import type { SyncTime } from '$/models/synctime.model'

const syncTimeKey = 'obisidian-firesync/synctime'

export function getSyncTime(): SyncTime {
  return parseInt(localStorage.getItem(syncTimeKey) ?? '0')
}

export function setSyncTime(time: SyncTime): void {
  localStorage.setItem(syncTimeKey, time.toString())
}
