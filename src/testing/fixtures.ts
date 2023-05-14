/* eslint @typescript-eslint/no-explicit-any: 0 */

import FiresyncPlugin from '$/main'
import type { Context } from '$/models/context.model'
import { defaultSettings } from '$/models/settings.model'
import type { SyncFile } from '$/models/syncfile.model'
import type { InternalFile, VaultId } from '$/models/vault.model'
import type { EventQueue } from '$/stores/eventqueue.store'
import type { Online } from '$/stores/online.store'
import type { TFile, TFolder, Vault } from 'obsidian'
import { vi } from 'vitest'

export function createFixtures() {
  const plugin: FiresyncPlugin = {
    settings: { ...defaultSettings, internal: true },
  } as any

  const online: Online = {
    subscribe: vi.fn(),
    isOnline: vi.fn().mockReturnValue(true),
  }

  const queue: EventQueue = {
    online,
    subscribe: vi.fn(),
    add: vi.fn(),
    retry: vi.fn(),
    delete: vi.fn(),
    on: vi.fn(),
    isSuppressed: vi.fn().mockReturnValue(false),
    destroy: vi.fn(),
  }

  const vault: Vault & { id: VaultId } = {
    id: 'valutid',
    configDir: '.obsidian',
    on: vi.fn() as any,
    append: vi.fn(),
    cachedRead: vi.fn(),
    copy: vi.fn(),
    create: vi.fn(),
    createBinary: vi.fn(),
    createFolder: vi.fn(),
    delete: vi.fn(),
    getAbstractFileByPath: vi.fn(),
    getAllLoadedFiles: vi.fn(),
    getFiles: vi.fn(),
    getMarkdownFiles: vi.fn(),
    getName: vi.fn(),
    getRoot: vi.fn(),
    read: vi.fn(),
    modify: vi.fn(),
    modifyBinary: vi.fn(),
    off: vi.fn(),
    offref: vi.fn(),
    readBinary: vi.fn(),
    rename: vi.fn(),
    trash: vi.fn(),
    trigger: vi.fn(),
    tryTrigger: vi.fn(),
    getResourcePath: vi.fn(),
    adapter: {
      append: vi.fn(),
      copy: vi.fn(),
      exists: vi.fn(),
      getName: vi.fn(),
      getResourcePath: vi.fn(),
      list: vi.fn(),
      mkdir: vi.fn(),
      read: vi.fn(),
      readBinary: vi.fn(),
      remove: vi.fn(),
      rename: vi.fn(),
      rmdir: vi.fn(),
      stat: vi.fn(),
      trashLocal: vi.fn(),
      trashSystem: vi.fn(),
      write: vi.fn(),
      writeBinary: vi.fn(),
    },
  }

  const context: Context = {
    plugin,
    obsidian: {
      plugin,
      app: {} as any,
      vault,
    },
    firebase: {
      app: {} as any,
      auth: {} as any,
      firestore: {} as any,
      storage: {} as any,
      user: {} as any,
    },
  }

  const syncfile: SyncFile = {
    id: 'id',
    hash: 'abcdefg',
    path: 'path/to/file.md',
    mtime: 101,
    deleted: false,
    trashed: false,
  }

  const folder: TFolder = {
    children: [],
    isRoot: vi.fn(),
    name: 'folder',
    parent: {} as any,
    path: 'path/to/',
    vault,
  }

  const file: TFile = {
    basename: 'file.md',
    extension: 'md',
    name: 'file',
    path: 'path/to/file.md',
    parent: folder,
    stat: {
      ctime: 100,
      mtime: 200,
      size: 300,
    },
    vault,
  }

  const internal: InternalFile = {
    path: '.obsidian/path/to/file.md',
    stat: {
      ctime: 100,
      mtime: 200,
      size: 300,
    },
  }

  const previous = 'path/to/previous.md'

  return {
    context,
    queue,
    syncfile,
    folder,
    file,
    previous,
    internal,
  }
}
