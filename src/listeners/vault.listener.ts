import { getLogger } from '$/logging/logger'
import type { Context } from '$/models/context.model'
import type {
  LocalRenameEvent,
  LocalDeleteEvent,
  LocalModifyEvent,
  LocalCreateEvent,
} from '$/models/syncevent.model'
import type { EventQueue } from '$/stores/eventqueue.store'
import { findSyncFile } from '$/services/firestore.service'
import {
  findInternalFile,
  generateHash,
  isFileType,
  isInternalPath,
  toSyncFile,
} from '$/services/vault.service'
import { TFile, type TAbstractFile } from 'obsidian'
import type { Unsubscriber } from 'svelte/store'
import type { InternalFile } from '$/models/vault.model'

const { debug } = getLogger('vault.listener')

export function setUpVaultListeners(context: Context, queue: EventQueue): Unsubscriber {
  debug('set up vault listeners.')

  const { vault } = context.obsidian

  const onCreate = onVaultCreate(context, queue)
  const onModify = onVaultModify(context, queue)
  const onRename = onVaultRename(context, queue)
  const onDelete = onVaultDelete(context, queue)

  const refs = [
    vault.on('create', onCreate),
    vault.on('modify', onModify),
    vault.on('rename', onRename),
    vault.on('delete', onDelete),
  ]

  if (context.plugin.settings.internal) {
    // @ts-ignore
    refs.push(vault.on('raw', onVaultRaw(context, onCreate, onModify)))
  }

  return () => {
    refs.forEach(ref => context.obsidian.vault.offref(ref))
    debug('vault listeners unsubscribed.')
  }
}

export function onVaultCreate(context: Context, queue: EventQueue) {
  return async (local: TAbstractFile | InternalFile) => {
    debug('create event occured:', local.path)

    if (queue.isSuppressed('local', local.path)) {
      debug('local events suppressed for path:', local.path)
      return
    }

    if (!isFileType(local)) {
      debug('file is not a type of TFile or InternalFile. ignored.')
      return
    }

    if (queue.online.isOnline()) {
      const remote = await findSyncFile(context, local.path)

      if (remote && (!remote.deleted || !remote.trashed)) {
        const hash = await generateHash(context, local)

        if (hash === remote.hash) {
          debug(`same hash detected: ${remote.path}. ignored.`)
          return
        }
      }
    }

    const event: LocalCreateEvent = {
      type: 'local/create',
      file: await toSyncFile(context, local),
    }

    queue.add(event)
  }
}

export function onVaultModify(context: Context, queue: EventQueue) {
  return async (local: TAbstractFile | InternalFile) => {
    debug('modify event occured:', local.path)

    if (queue.isSuppressed('local', local.path)) {
      debug('local events suppressed for path:', local.path)
      return
    }

    if (!isFileType(local)) {
      debug('file is not a type of TFile or InternalFile. ignored.')
      return
    }

    if (queue.online.isOnline()) {
      const remote = await findSyncFile(context, local.path)

      if (!remote) {
        debug(`remote file missing. ignored.`)
        return
      }

      const hash = await generateHash(context, local)

      if (hash === remote.hash) {
        debug(`same hash detected: ${remote.path}. ignored.`)
        return
      }
    }

    const event: LocalModifyEvent = {
      type: 'local/modify',
      file: await toSyncFile(context, local),
    }

    queue.add(event)
  }
}

export function onVaultDelete(context: Context, queue: EventQueue) {
  return async (local: TAbstractFile) => {
    debug('delete event occured:', local.path)

    if (queue.isSuppressed('local', local.path)) {
      debug('local events suppressed for path:', local.path)
      return
    }

    if (!isFileType(local)) {
      debug('file is not a type of TFile or InternalFile. ignored.')
      return
    }

    if (queue.online.isOnline()) {
      const remote = await findSyncFile(context, local.path)

      if (!remote) {
        debug(`remote file missing. ignored.`)
        return
      }

      if (remote.deleted || remote.trashed) {
        debug(`remote file alreay deleted or trashed. ignored.`)
        return
      }
    }

    const event: LocalDeleteEvent = {
      type: 'local/delete',
      file: await toSyncFile(context, local),
    }

    queue.add(event)
  }
}

export function onVaultRename(context: Context, queue: EventQueue) {
  return async (local: TAbstractFile, previous: string) => {
    debug('rename event occured:', local.path)

    if (queue.isSuppressed('local', local.path)) {
      debug('local events suppressed for path:', local.path)
      return
    }

    if (!isFileType(local)) {
      debug('file is not a type of TFile or InternalFile. ignored.')
      return
    }

    if (!(local instanceof TFile)) {
      debug('file is not a type of TFile. ignored.')
      return
    }

    if (queue.online.isOnline()) {
      const remote = await findSyncFile(context, local.path)

      if (remote) {
        const hash = await generateHash(context, local)

        if (hash === remote.hash) {
          debug(`same hash detected: ${remote.path}. ignored.`)
          return
        }
      }
    }

    const event: LocalRenameEvent = {
      type: 'local/rename',
      file: await toSyncFile(context, local),
      previous,
    }

    queue.add(event)
  }
}

export function onVaultRaw(
  context: Context,
  onCreate: ReturnType<typeof onVaultCreate>,
  onModify: ReturnType<typeof onVaultModify>
) {
  return async (path: string) => {
    if (!isInternalPath(context, path)) return

    const internal = await findInternalFile(context, path)

    if (!internal) return

    if (internal.stat.ctime === internal.stat.mtime) {
      await onCreate(internal)
    } else {
      await onModify(internal)
    }
  }
}
