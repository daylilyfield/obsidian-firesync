import { getLogger } from '$/logging/logger'
import type { Settings } from '$/models/settings.model'
import type { SyncEvent, SyncEventType } from '$/models/syncevent.model'
import { newSyncProgress, type SyncProgress } from '$/models/syncprogress.model'
import { createOnline, type Online } from '$/stores/online.store'
import { createSyncProgresses } from '$/stores/syncprogresses.store'
import { restoreSyncEvents, saveSyncEvents } from '$/services/syncevent.service'
import { tick } from 'svelte'
import { get, type Readable, type Unsubscriber } from 'svelte/store'

export type SyncEventHandler = (
  event: SyncEvent,
  progress: (progress: Partial<Omit<SyncProgress, 'id'>>) => void
) => Promise<void>

export type EventQueue = Readable<SyncProgress[]> & {
  online: Online
  add(event: SyncEvent): void
  retry(id: SyncProgress['id']): void
  delete(id: SyncProgress['id']): void
  on(type: SyncEventType, handler: SyncEventHandler): Unsubscriber
  isSuppressed(type: 'local' | 'remote', path: string): boolean
  destroy(): void
}

const { debug, error } = getLogger('event.queue')

export function createEventQueue(settings: Settings): EventQueue {
  const online = createOnline()
  const progresses = createSyncProgresses()
  const handlerMap = new Map<SyncEventType, SyncEventHandler>()
  const unsubscribers: Unsubscriber[] = []

  type Pair = [SyncEvent, SyncProgress]

  let waitings: SyncEvent[] = []
  let pendings: Pair[] = []
  let runnings: Pair[] = []
  let timer = 0

  unsubscribers.push(
    online.subscribe(async online => {
      debug('online:', online)

      if (online) {
        const events = restoreSyncEvents()

        if (events.length > 0) {
          debug(`found ${events.length} saved event(s).`)
          saveSyncEvents([])
          waitings = [...events, ...waitings]
          void consumeWaitings()
        }
      } else {
        saveSyncEvents(waitings)
      }
    })
  )

  async function consumeWaitings() {
    debug('consume waiting events')

    const candidates = distinctEvents(waitings)

    const pairs = candidates.map(candidate => {
      const progress = newSyncProgress(candidate)
      progresses.add(progress)
      return [candidate, progress] as Pair
    })

    waitings = []
    pendings = [...pendings, ...pairs]

    await tick()

    if (runnings.length > 0) {
      debug('already running another asynchronous process')
      return
    }

    do {
      runnings = pendings.splice(0, settings.concurrency)
      await consumeRunnings(runnings)
    } while (pendings.length > 0)

    runnings = []
  }

  async function consumeRunnings(pairs: [SyncEvent, SyncProgress][]) {
    if (pairs.length === 0) return

    const results = await Promise.allSettled(
      pairs.map(async ([event, base]) => {
        const handler = handlerMap.get(event.type)

        if (!handler) {
          debug('missing handler for type:', event.type)
          throw new Error('obsidian-firesync/handler-not-found')
        }

        debug(`start to handle: ${event.type} for path: ${event.file.path}`)

        try {
          await handler(event, progress => {
            progresses.update({ ...progress, id: base.id })
          })
          progresses.update({ id: base.id, done: true, progress: 100 })
          await tick()
          progresses.remove(base.id)
        } catch (e) {
          error(`catch error while handling: ${event.type} for path: ${event.file.path}`, e)
          progresses.update({ id: base.id, error: true, message: e.toString() })
          throw e
        }

        debug(`finish to handle: ${event.type} for path: ${event.file.path}`)
      })
    )

    const failures = results.filter((result): result is PromiseRejectedResult => {
      return result.status === 'rejected'
    })

    const flen = failures.length
    const slen = results.length - flen
    debug(`${slen} handler(s) succeeded, and ${flen} handler(s) failed.`)
  }

  return {
    subscribe: progresses.subscribe,

    online,

    add(event) {
      debug('event added: ', event)

      if (!online.isOnline()) {
        debug('store event because of offline.')
        const events = restoreSyncEvents()
        const distincted = distinctEvents([...events, event])
        saveSyncEvents(distincted)
        return
      }

      waitings.push(event)

      if (timer) {
        debug('clear timeout:', timer)
        window.clearTimeout(timer)
      }

      if (event.type !== 'local/modify') {
        void consumeWaitings()
        return
      }

      timer = window.setTimeout(consumeWaitings, settings.debounce)
    },

    retry(id) {
      debug('event retry:', id)

      const progress = progresses.get(id)

      if (!progress) {
        debug('no progress found:', id)
        return
      }

      progresses.remove(id)

      waitings.push(progress.event)

      void consumeWaitings()
    },

    delete(id) {
      debug('event delete:', id)
      progresses.remove(id)
    },

    on(type, handler) {
      handlerMap.set(type, handler)

      return () => {
        handlerMap.delete(type)
      }
    },

    isSuppressed(type: 'local' | 'remote', path) {
      const $progresses = get(progresses)
      const pair = type === 'local' ? 'remote' : 'local'
      return $progresses.some(progress =>
        progress.event.type === 'local/rename' && pair === 'local'
          ? progress.event.file.path === path || progress.event.previous === path
          : progress.event.type.startsWith(pair) && progress.event.file.path === path
      )
    },

    destroy() {
      unsubscribers.forEach(it => it())
    },
  }
}

function distinctEvents(waitings: SyncEvent[]): SyncEvent[] {
  return waitings.reduce<SyncEvent[]>((acc, next) => {
    const found = acc.findIndex(
      previous => previous.type === next.type && previous.file.path === next.file.path
    )

    if (~found) {
      acc[found] = next
    } else {
      acc.push(next)
    }

    return acc
  }, [])
}
