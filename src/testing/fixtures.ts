/* eslint @typescript-eslint/no-explicit-any: 0 */

import type { Context } from '$/models/context.model'
import type { SyncFile } from '$/models/syncfile.model'
import { vi } from 'vitest'

export const syncfile: SyncFile = {
  id: 'id',
  hash: 'abcdefg',
  path: 'path/to/file.md',
  mtime: 12345,
  deleted: false,
  trashed: false,
}

export function createContext(): Context {
  const plugin = {} as any
  return {
    plugin,
    obsidian: {
      plugin,
      app: {} as any,
      vault: {
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
      },
    },
    firebase: {
      app: {} as any,
      auth: {} as any,
      firestore: {} as any,
      storage: {} as any,
      user: {} as any,
    },
  }
}
