import type { SyncEvent } from '$/models/syncevent.model'

const syncEventKey = 'obisidian-firesync/syncevents'

export function saveSyncEvents(events: SyncEvent[]) {
  localStorage.setItem(syncEventKey, JSON.stringify(events))
}

export function restoreSyncEvents(): SyncEvent[] {
  const json = localStorage.getItem(syncEventKey) ?? '[]'
  return JSON.parse(json)
}
