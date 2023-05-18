import type { SyncEvent } from '$/models/syncevent.model'

export type SyncProgress = {
  id: string
  message: string
  progress: number
  done: boolean
  error: boolean
  event: SyncEvent
}

let previousNow = performance.now().toFixed(2)
let counter = 0

export function newSyncProgress(event: SyncEvent): SyncProgress {
  const now = performance.now().toFixed(3)

  if (now === previousNow) {
    counter++
  } else {
    previousNow = now
    counter = 0
  }

  const variant = counter.toString().padStart(3, '0')

  return {
    id: `${now}.${variant}`,
    message: event.file.path,
    progress: 0,
    done: false,
    error: false,
    event,
  }
}
