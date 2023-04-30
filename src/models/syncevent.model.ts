import type { SyncFile } from '$/models/syncfile.model'

export const syncEventTypes = [
  'local/create',
  'local/modify',
  'local/delete',
  'local/rename',
  'local/raw',
  'remote/create',
  'remote/modify',
  'remote/delete',
  'remote/trash',
] as const

export type SyncEventType = (typeof syncEventTypes)[number]

export type LocalCreateEvent = {
  type: 'local/create'
  file: SyncFile
}

export type LocalModifyEvent = {
  type: 'local/modify'
  file: SyncFile
}

export type LocalDeleteEvent = {
  type: 'local/delete'
  file: SyncFile
}

export type LocalRenameEvent = {
  type: 'local/rename'
  file: SyncFile
  previous: string
}

export type RemoteCreateEvent = {
  type: 'remote/create'
  file: SyncFile
}

export type RemoteModifyEvent = {
  type: 'remote/modify'
  file: SyncFile
}

export type RemoteDeleteEvent = {
  type: 'remote/delete'
  file: SyncFile
}

export type RemoteTrashEvent = {
  type: 'remote/trash'
  file: SyncFile
}

export type LocalSyncEvent =
  | LocalCreateEvent
  | LocalModifyEvent
  | LocalDeleteEvent
  | LocalRenameEvent

export type RemoteSyncEvent =
  | RemoteCreateEvent
  | RemoteModifyEvent
  | RemoteDeleteEvent
  | RemoteTrashEvent

export type SyncEvent = LocalSyncEvent | RemoteSyncEvent
