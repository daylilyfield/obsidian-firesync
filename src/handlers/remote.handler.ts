import { getLogger } from '$/logging/logger'
import type { Context } from '$/models/context.model'
import type { EventQueue, SyncEventHandler } from '$/stores/eventqueue.store'
import { downloadFile } from '$/services/storage.service'
import {
  createFolders,
  findObsidianFile,
  isFileType,
  deleteObsidianFile,
  trashObsidianFile,
  createObsidianFile,
  updateObsidianFile,
} from '$/services/vault.service'
import type { Unsubscriber } from 'svelte/store'
import type { SyncFile } from '$/models/syncfile.model'

const { debug } = getLogger('remote.handler')

export function setUpRemoteHandlers(context: Context, queue: EventQueue): Unsubscriber {
  debug('set up remote event handlers.')

  const unsubscribers = [
    queue.on('remote/create', onRemoteCreate(context)),
    queue.on('remote/modify', onRemoteModify(context)),
    queue.on('remote/delete', onRemoteDelete(context)),
    queue.on('remote/trash', onRemoteTrash(context)),
  ]

  return () => {
    unsubscribers.forEach(it => it())
    debug('remote event handlers unsubscribed.')
  }
}

export function onRemoteCreate(context: Context): SyncEventHandler {
  return async (event, progress) => {
    const { file: remote } = event

    const bytes = await downloadFile(context, remote, proportion => {
      progress({ progress: Math.round(proportion * 70) })
    })

    await createFolders(context, remote)

    progress({ progress: 90 })

    await createOrUpdate(context, remote, bytes)
  }
}

export function onRemoteModify(context: Context): SyncEventHandler {
  return async (event, progress) => {
    const { file: remote } = event

    const bytes = await downloadFile(context, remote, proportion => {
      progress({ progress: Math.round(proportion * 70) })
    })

    await createFolders(context, remote)

    progress({ progress: 90 })

    await createOrUpdate(context, remote, bytes)
  }
}

export function onRemoteDelete(context: Context): SyncEventHandler {
  return async (event, progress) => {
    const { file: remote } = event

    const local = await findObsidianFile(context, remote.path)

    progress({ progress: 50 })

    if (local && isFileType(local)) {
      await deleteObsidianFile(context, local)
    }
  }
}

export function onRemoteTrash(context: Context): SyncEventHandler {
  return async (event, progress) => {
    const { file: remote } = event

    const local = await findObsidianFile(context, remote.path)

    progress({ progress: 50 })

    if (local && isFileType(local)) {
      await trashObsidianFile(context, local)
    }
  }
}

async function createOrUpdate(context: Context, remote: SyncFile, bytes: ArrayBuffer) {
  const local = await findObsidianFile(context, remote.path)

  if (!local) {
    await createObsidianFile(context, remote.path, bytes)
  } else if (isFileType(local)) {
    await updateObsidianFile(context, local, bytes)
  }
}
