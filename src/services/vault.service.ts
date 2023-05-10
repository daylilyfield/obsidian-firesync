import { getLogger } from '$/logging/logger'
import type { Context } from '$/models/context.model'
import type { SyncFile } from '$/models/syncfile.model'
import type { SyncTime } from '$/models/synctime.model'
import type { InternalFile, VaultId } from '$/models/vault.model'
import { hash } from '$/utils/hashes'
import { createIgnoreFilter } from '$/utils/ignores'
import { TFile, Vault, TAbstractFile, type ListedFiles, TFolder } from 'obsidian'

const { warn } = getLogger('vault.service')

export async function generateVaultId(vault: Vault): Promise<VaultId> {
  return await hash(vault.getName())
}

export function applyVaultId(vault: Vault, id: VaultId): asserts vault is Vault & { id: VaultId } {
  if ('id' in vault) {
    return
  }

  Object.defineProperty(vault, 'id', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: id,
  })
}

export function isInternalPath(context: Context, path: string): boolean {
  return path.startsWith(context.obsidian.vault.configDir)
}

export function isFileType(file: TAbstractFile | InternalFile): file is TFile | InternalFile {
  return !(file instanceof TFolder)
}

export async function toSyncFile(context: Context, file: TFile | InternalFile): Promise<SyncFile> {
  return file instanceof TFile
    ? await fromVaultFile(context.obsidian.vault, file)
    : await fromInternalFile(context.obsidian.vault, file)
}

export async function fromInternalPath(context: Context, path: string): Promise<SyncFile> {
  const adapter = context.obsidian.vault.adapter
  const file: InternalFile = {
    path,
    stat: (await adapter.stat(path)) ?? {
      ctime: 0,
      mtime: 0,
      size: 0,
    },
  }
  return fromInternalFile(context.obsidian.vault, file)
}

export async function fromInternalFile(vault: Vault, file: InternalFile): Promise<SyncFile> {
  let content = ''
  try {
    content = await vault.adapter.read(file.path)
  } catch (e) {
    warn('error reading file from:', file.path, e)
  }

  return {
    id: await hash(file.path),
    path: file.path,
    hash: await hash(content),
    mtime: file.stat.mtime,
    deleted: false,
    trashed: false,
  }
}

export async function fromVaultFile(vault: Vault, file: TFile): Promise<SyncFile> {
  let content = ''
  try {
    content = await vault.cachedRead(file)
  } catch (e) {
    warn('error reading file from:', file.path, e)
  }
  return {
    id: await hash(file.path),
    path: file.path,
    hash: await hash(content),
    mtime: file.stat.mtime,
    deleted: false,
    trashed: false,
  }
}

export async function createFolders(context: Context, file: SyncFile): Promise<void> {
  const folders = file.path.split('/')
  folders.pop()

  const acc = []
  for (const folder of folders) {
    acc.push(folder)
    const path = acc.join('/')

    if (!(await context.obsidian.vault.adapter.exists(path))) {
      await context.obsidian.vault.adapter.mkdir(path)
    }
  }
}

export async function findInternalFilesAfter(
  context: Context,
  syncTime: SyncTime
): Promise<InternalFile[]> {
  const adapter = context.obsidian.vault.adapter
  const { isIgnored, isAccepted } = createIgnoreFilter(context)

  const dive = async (list: ListedFiles): Promise<string[]> => {
    const children = await Promise.all(
      list.folders.flatMap(async folder => {
        if (isIgnored(folder)) return []

        const list = await adapter.list(folder)
        return await dive(list)
      })
    )
    const flat = children.flat()
    return [...list.files.filter(isAccepted), ...flat]
  }

  const listed = await dive(await adapter.list(context.obsidian.vault.configDir))

  const internals: InternalFile[] = await Promise.all(
    listed.map(async path => ({
      path,
      stat: (await adapter.stat(path)) ?? {
        ctime: 0,
        mtime: 0,
        size: 0,
      },
    }))
  )

  return internals.filter(file => file.stat.mtime > syncTime)
}

export function findVaultFilesAfter(context: Context, syncTime: SyncTime) {
  const files = context.obsidian.vault.getFiles()
  return files.filter(file => file.stat.mtime > syncTime)
}

export async function findObsidianFile(
  context: Context,
  path: string
): Promise<TAbstractFile | InternalFile | null> {
  return isInternalPath(context, path)
    ? await findInternalFile(context, path)
    : findVaultFile(context, path)
}

export async function findInternalFile(
  context: Context,
  path: string
): Promise<InternalFile | null> {
  const adapter = context.obsidian.vault.adapter

  if (!(await adapter.exists(path))) return null

  return {
    path,
    stat: (await adapter.stat(path)) ?? {
      ctime: 0,
      mtime: 0,
      size: 0,
    },
  }
}

export function findVaultFile(context: Context, path: string): TAbstractFile | null {
  return context.obsidian.vault.getAbstractFileByPath(path)
}

export async function createObsidianFile(context: Context, path: string, bytes: ArrayBuffer) {
  return isInternalPath(context, path)
    ? await createInternalFile(context, path, bytes)
    : await createVaultFile(context, path, bytes)
}

export async function createInternalFile(context: Context, path: string, bytes: ArrayBuffer) {
  await context.obsidian.vault.adapter.writeBinary(path, bytes)
}

export async function createVaultFile(context: Context, path: string, bytes: ArrayBuffer) {
  await context.obsidian.vault.createBinary(path, bytes)
}

export async function updateObsidianFile(
  context: Context,
  file: TFile | InternalFile,
  bytes: ArrayBuffer
) {
  return file instanceof TFile
    ? await updateVaultFile(context, file, bytes)
    : await updateInternalFile(context, file, bytes)
}

export async function updateInternalFile(context: Context, file: InternalFile, bytes: ArrayBuffer) {
  await context.obsidian.vault.adapter.writeBinary(file.path, bytes)
}

export async function updateVaultFile(context: Context, file: TFile, bytes: ArrayBuffer) {
  await context.obsidian.vault.modifyBinary(file, bytes)
}

export async function deleteObsidianFile(context: Context, file: TFile | InternalFile) {
  return file instanceof TFile
    ? await deleteVaultFile(context, file)
    : await deleteInternalFile(context, file)
}

export async function deleteInternalFile(context: Context, file: InternalFile) {
  await context.obsidian.vault.adapter.remove(file.path)
}

export async function deleteVaultFile(context: Context, file: TFile) {
  await context.obsidian.vault.delete(file)
}

export async function trashObsidianFile(context: Context, file: TFile | InternalFile) {
  return file instanceof TFile
    ? await trashVaultFile(context, file)
    : await trashInternalFile(context, file)
}

export async function trashInternalFile(context: Context, file: InternalFile, system = true) {
  const trash = system
    ? context.obsidian.vault.adapter.trashSystem
    : context.obsidian.vault.adapter.trashLocal
  await trash(file.path)
}

export async function trashVaultFile(context: Context, file: TFile, system = true) {
  await context.obsidian.vault.trash(file, system)
}

export async function generateHash(context: Context, file: TFile | InternalFile): Promise<string> {
  const content =
    file instanceof TFile
      ? await context.obsidian.vault.cachedRead(file)
      : await context.obsidian.vault.adapter.read(file.path)

  return await hash(content)
}
