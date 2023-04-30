import { getLogger } from '$/logging/logger'
import type { Context } from '$/models/context.model'
import type { LocalRenameEvent } from '$/models/syncevent.model'
import type { EventQueue, SyncEventHandler } from '$/stores/eventqueue.store'
import { createSyncFile, generateSyncFileId, updateSyncFile } from '$/services/firestore.service'
import { generateNextVersion, uploadFile } from '$/services/storage.service'
import type { Unsubscriber } from 'svelte/store'

const { debug } = getLogger('lcoal.handler')

export function setUpLocalHandlers(context: Context, queue: EventQueue): Unsubscriber {
  debug('set up local event handlers.')

  const unsubscribers = [
    queue.on('local/create', onLocalCreate(context)),
    queue.on('local/modify', onLocalModify(context)),
    queue.on('local/delete', onLocalDelete(context)),
    queue.on('local/rename', onLocalRename(context)),
  ]

  return () => {
    unsubscribers.forEach(it => it())
    debug('local event handlers unsubscribed.')
  }
}

export function onLocalCreate(context: Context): SyncEventHandler {
  return async (event, progress) => {
    const { file } = event

    const version = await generateNextVersion(context, file)

    progress({ progress: 10 })

    await uploadFile(context, file, version, proportion => {
      progress({ progress: Math.round(proportion * 70 + 10) })
    })

    progress({ progress: 80 })

    await createSyncFile(context, file)
  }
}

export function onLocalModify(context: Context): SyncEventHandler {
  return async (event, progress) => {
    const { file } = event

    const version = await generateNextVersion(context, file)

    progress({ progress: 10 })

    await uploadFile(context, file, version, proportion => {
      progress({ progress: Math.round(proportion * 70 + 10) })
    })

    progress({ progress: 80 })

    await updateSyncFile(context, file)
  }
}

export function onLocalDelete(context: Context): SyncEventHandler {
  return async (event, _progress) => {
    const { file } = event

    await updateSyncFile(context, { ...file, mtime: Date.now(), trashed: true })
  }
}

export function onLocalRename(context: Context): SyncEventHandler {
  return async (event, progress) => {
    const { file, previous } = event as LocalRenameEvent

    // create new file
    {
      const version = await generateNextVersion(context, file)

      progress({ progress: 10 })

      await uploadFile(context, file, version, proportion => {
        progress({ progress: Math.round(proportion * 70 + 10) })
      })

      progress({ progress: 80 })

      await createSyncFile(context, file)

      progress({ progress: 90 })
    }

    // delete previous file
    {
      const id = await generateSyncFileId(previous)
      await updateSyncFile(context, { id, mtime: Date.now(), deleted: true })
    }
  }
}
