import { getLogger } from '$/logging/logger'
import type { Context } from '$/models/context.model'
import type {
  RemoteCreateEvent,
  RemoteDeleteEvent,
  RemoteModifyEvent,
  RemoteTrashEvent,
} from '$/models/syncevent.model'
import type { SyncFile } from '$/models/syncfile.model'
import type { EventQueue } from '$/stores/eventqueue.store'
import { watchSyncFileChanges } from '$/services/firestore.service'
import { getSyncTime, setSyncTime } from '$/services/synctime.service'
import { findVaultFile, generateHash } from '$/services/vault.service'
import { TFile } from 'obsidian'
import type { Unsubscriber } from 'svelte/store'

const { debug } = getLogger('firebase.listener')

export function setUpFirebaseListeners(context: Context, queue: EventQueue): Unsubscriber {
  debug('set up vault listeners.')

  let stime = getSyncTime()

  const unsubscriber = watchSyncFileChanges(context, stime).subscribe(async changes => {
    for (const change of changes) {
      const remote = change.doc.data()

      switch (change.type) {
        case 'added':
        case 'modified':
          await onFirebaseChanged(context, remote, queue)
          break
        case 'removed':
          await onFirebaseRemoved(context, remote, queue)
          break
      }

      if (remote.mtime > stime) {
        stime = remote.mtime
        setSyncTime(stime)
      }
    }
  })

  return () => {
    unsubscriber()
    debug('firebase listeners unsubscribed.')
  }
}

export async function onFirebaseChanged(context: Context, remote: SyncFile, queue: EventQueue) {
  debug('added or modified event occured:', remote.path)

  if (queue.isSuppressed('remote', remote.path)) {
    debug('remote events suppressed for path:', remote.path)
    return
  }

  const local = findVaultFile(context, remote.path)

  if (!local) {
    if (remote.deleted || remote.trashed) {
      debug('the file already deleted or trashed. ignored.')
      return
    }

    const event: RemoteCreateEvent = {
      type: 'remote/create',
      file: remote,
    }
    queue.add(event)
    return
  }

  if (!(local instanceof TFile)) {
    debug('file is not a type of TFile. ignored.')
    return
  }

  if (remote.mtime <= local.stat.mtime) {
    debug('remote mtime is same as or older than local mtime. ignored.')
    return
  }

  if (remote.deleted) {
    const event: RemoteDeleteEvent = {
      type: 'remote/delete',
      file: remote,
    }
    queue.add(event)
    return
  }

  if (remote.trashed) {
    const event: RemoteTrashEvent = {
      type: 'remote/trash',
      file: remote,
    }
    queue.add(event)
    return
  }

  const hash = await generateHash(context, local)

  if (hash === remote.hash) {
    debug(`same hash detected: ${remote.path}. ignored.`)
    return
  }

  const event: RemoteModifyEvent = {
    type: 'remote/modify',
    file: remote,
  }
  queue.add(event)
}

async function onFirebaseRemoved(_context: Context, _remote: SyncFile, _queue: EventQueue) {
  debug('removed event occured, but not imeplemented yet. ignored.')
}
