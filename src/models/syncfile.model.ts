import { hash } from '$/utils/hashes'
import type { TFile, Vault } from 'obsidian'

export type SyncFile = {
  id: string
  path: string
  hash: string
  mtime: number
  deleted: boolean
  trashed: boolean
}

export async function fromObsidianFile(vault: Vault, file: TFile): Promise<SyncFile> {
  const content = await vault.cachedRead(file)
  return {
    id: await hash(file.path),
    path: file.path,
    hash: await hash(content),
    mtime: file.stat.mtime,
    deleted: false,
    trashed: false,
  }
}
