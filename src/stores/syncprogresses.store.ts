import type { SyncProgress } from '$/models/syncprogress.model'
import { binarySearch } from '$/utils/binsearch'
import { get, type Readable, writable } from 'svelte/store'

export type SyncProgresses = {
  get(id: SyncProgress['id']): SyncProgress
  add(progress: SyncProgress): void
  update(progress: Partial<SyncProgress> & { id: SyncProgress['id'] }): void
  remove(id: SyncProgress['id']): void
}

export function createSyncProgresses(): Readable<SyncProgress[]> & SyncProgresses {
  const progresses = writable<SyncProgress[]>([])

  return {
    subscribe: progresses.subscribe,

    get(id: SyncProgress['id']) {
      const $progresses = get(progresses)
      const index = binarySearch($progresses, it => it.id.localeCompare(id))
      return $progresses[index]
    },

    add(progress: SyncProgress) {
      progresses.update($progresses => [...$progresses, progress])
    },

    update(progress: Partial<SyncProgress> & { id: SyncProgress['id'] }) {
      progresses.update($progresses => {
        const index = binarySearch($progresses, it => it.id.localeCompare(progress.id))

        if (!~index) return $progresses

        $progresses[index] = { ...$progresses[index], ...progress }

        return [...$progresses]
      })
    },

    remove(id: SyncProgress['id']) {
      progresses.update($progresses => {
        const index = binarySearch($progresses, it => it.id.localeCompare(id))

        if (!~index) return $progresses

        const next = [...$progresses]
        next.splice(index, 1)

        return next
      })
    },
  }
}
