import type { SyncEvent } from '$/models/syncevent.model'

export type SyncProgress = {
  id: string
  message: string
  progress: number
  done: boolean
  error: boolean
  event: SyncEvent
}

export function newSyncProgress(event: SyncEvent): SyncProgress {
  return {
    id: (Date.now() + performance.now()).toString(),
    message: event.file.path,
    progress: 0,
    done: false,
    error: false,
    event,
  }
}
