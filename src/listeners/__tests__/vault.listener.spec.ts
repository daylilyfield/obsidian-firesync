import {
  onVaultCreate,
  onVaultDelete,
  onVaultModify,
  onVaultRaw,
  onVaultRename,
} from '$/listeners/vault.listener'
import { findSyncFile } from '$/services/firestore.service'
import {
  findInternalFile,
  generateHash,
  isFileType,
  isInternalPath,
} from '$/services/vault.service'
import { createFixtures } from '$/testing/fixtures'
import { describe, it, expect, vi } from 'vitest'

vi.mock('$/services/vault.service')
vi.mock('$/services/firestore.service')

describe('onVaultCreate', () => {
  it('should suppress', async () => {
    const { context, file, queue } = createFixtures()

    vi.mocked(queue.isSuppressed).mockReturnValue(true)

    await onVaultCreate(context, queue)(file)

    expect(queue.add).not.toBeCalled()
  })

  it('should not add local event when target is a directory', async () => {
    const { context, file, queue } = createFixtures()

    vi.mocked(queue.isSuppressed).mockReturnValue(false)
    vi.mocked(isFileType).mockReturnValue(false)

    await onVaultCreate(context, queue)(file)

    expect(queue.add).not.toBeCalled()
  })

  it('should ignore', async () => {
    const { context, file, queue } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)

    context.plugin.settings.ignores = 'file.md'

    await onVaultCreate(context, queue)(file)

    expect(queue.add).not.toBeCalled()
  })

  it('should not add local event when both hashes are same', async () => {
    const { context, file, queue, syncfile } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)
    vi.mocked(findSyncFile).mockResolvedValue(syncfile)
    vi.mocked(generateHash).mockResolvedValue(syncfile.hash)

    await onVaultCreate(context, queue)(file)

    expect(queue.add).not.toBeCalled()
  })

  it('should add local event when both hashes are different', async () => {
    const { context, file, queue, syncfile } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)
    vi.mocked(findSyncFile).mockResolvedValue(syncfile)
    vi.mocked(generateHash).mockResolvedValue(syncfile.hash + 'hijk')

    await onVaultCreate(context, queue)(file)

    expect(queue.add).toBeCalled()
  })
})

describe('onVaultModify', () => {
  it('should suppress', async () => {
    const { context, file, queue } = createFixtures()

    vi.mocked(queue.isSuppressed).mockReturnValue(true)

    await onVaultModify(context, queue)(file)

    expect(queue.add).not.toBeCalled()
  })

  it('should not add local event when target is a directory', async () => {
    const { context, file, queue } = createFixtures()

    vi.mocked(queue.isSuppressed).mockReturnValue(false)
    vi.mocked(isFileType).mockReturnValue(false)

    await onVaultModify(context, queue)(file)

    expect(queue.add).not.toBeCalled()
  })

  it('should ignore', async () => {
    const { context, file, queue } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)

    context.plugin.settings.ignores = 'file.md'

    await onVaultModify(context, queue)(file)

    expect(queue.add).not.toBeCalled()
  })

  it('should not add local event when both hashes are same', async () => {
    const { context, file, queue, syncfile } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)
    vi.mocked(findSyncFile).mockResolvedValue(syncfile)
    vi.mocked(generateHash).mockResolvedValue(syncfile.hash)

    await onVaultModify(context, queue)(file)

    expect(queue.add).not.toBeCalled()
  })

  it('should add local event when both hashes are different', async () => {
    const { context, file, queue, syncfile } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)
    vi.mocked(findSyncFile).mockResolvedValue(syncfile)
    vi.mocked(generateHash).mockResolvedValue(syncfile.hash + 'hijk')

    await onVaultModify(context, queue)(file)

    expect(queue.add).toBeCalled()
  })
})

describe('onVaultDelete', () => {
  it('should suppress', async () => {
    const { context, file, queue } = createFixtures()

    vi.mocked(queue.isSuppressed).mockReturnValue(true)

    await onVaultDelete(context, queue)(file)

    expect(queue.add).not.toBeCalled()
  })

  it('sould not add local event when target is a directory', async () => {
    const { context, file, queue } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(false)

    await onVaultDelete(context, queue)(file)

    expect(queue.add).not.toBeCalled()
  })

  it('sould ignore', async () => {
    const { context, file, queue } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)

    context.plugin.settings.ignores = 'file.md'

    await onVaultDelete(context, queue)(file)

    expect(queue.add).not.toBeCalled()
  })

  it.each([
    { label: 'deleted', prop: { deleted: true, trashed: false } },
    { label: 'trashed', prop: { deleted: false, trashed: true } },
  ])('sould not add local event when target has already been $label', async ({ prop }) => {
    const { context, file, queue, syncfile } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)
    vi.mocked(findSyncFile).mockResolvedValue({ ...syncfile, ...prop })

    await onVaultDelete(context, queue)(file)

    expect(queue.add).not.toBeCalled()
  })

  it('should add local event', async () => {
    const { context, file, queue, syncfile } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)
    vi.mocked(findSyncFile).mockResolvedValue(syncfile)

    await onVaultDelete(context, queue)(file)

    expect(queue.add).toBeCalled()
  })
})

describe('onVaultRename', () => {
  it('should suppress', async () => {
    const { context, file, queue, previous } = createFixtures()

    vi.mocked(queue.isSuppressed).mockReturnValue(true)

    await onVaultDelete(context, queue)(file)

    expect(queue.add).not.toBeCalled()
  })

  it('should not add local event when target is a directory', async () => {
    const { context, file, queue } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(false)

    await onVaultDelete(context, queue)(file)

    expect(queue.add).not.toBeCalled()
  })

  it('should ignore', async () => {
    const { context, file, queue, previous } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)

    context.plugin.settings.ignores = 'file.md'

    await onVaultRename(context, queue)(file, previous)

    expect(queue.add).not.toBeCalled()
  })

  it('should ignore', async () => {
    const { context, file, queue, previous } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)

    context.plugin.settings.ignores = 'file.md'

    await onVaultRename(context, queue)(file, previous)

    expect(queue.add).not.toBeCalled()
  })

  it('should not add local event when both hashes are same', async () => {
    const { context, file, queue, syncfile, previous } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)
    vi.mocked(findSyncFile).mockResolvedValue(syncfile)
    vi.mocked(generateHash).mockResolvedValue(syncfile.hash)

    await onVaultRename(context, queue)(file, previous)

    expect(queue.add).not.toBeCalled()
  })

  it('sould add local event', async () => {
    const { context, file, queue, syncfile, previous } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)
    vi.mocked(findSyncFile).mockResolvedValue(syncfile)
    vi.mocked(generateHash).mockResolvedValue(syncfile.hash + 'hijk')

    await onVaultRename(context, queue)(file, previous)

    expect(queue.add).toBeCalled()
  })
})

describe('onVaultRaw', async () => {
  it('sould not dispatch when internal settings is off', async () => {
    const on = vi.fn()
    const { context } = createFixtures()

    context.plugin.settings.internal = false

    await onVaultRaw(context, on, on)('raw.md')

    expect(on).not.toBeCalled()
  })

  it('sould not dispatch when target is not located in .obisidan', async () => {
    const on = vi.fn()
    const { context } = createFixtures()

    vi.mocked(isInternalPath).mockReturnValue(false)

    await onVaultRaw(context, on, on)('raw.md')

    expect(on).not.toBeCalled()
  })

  it('sould not dispatch when target does not exist', async () => {
    const on = vi.fn()
    const { context } = createFixtures()

    vi.mocked(isInternalPath).mockReturnValue(true)
    vi.mocked(findInternalFile).mockResolvedValue(null)

    await onVaultRaw(context, on, on)('raw.md')

    expect(on).not.toBeCalled()
  })

  it('sould call onCreate when internal file is newly created', async () => {
    const onCreate = vi.fn()
    const onModify = vi.fn()
    const { context, internal } = createFixtures()

    vi.mocked(isInternalPath).mockReturnValue(true)
    vi.mocked(findInternalFile).mockResolvedValue({
      ...internal,
      stat: { ...internal.stat, ctime: 100, mtime: 100 },
    })

    await onVaultRaw(context, onCreate, onModify)('raw.md')

    expect(onCreate).toBeCalled()
    expect(onModify).not.toBeCalled()
  })

  it('sould call onModify when internal file is updated', async () => {
    const onCreate = vi.fn()
    const onModify = vi.fn()
    const { context, internal } = createFixtures()

    vi.mocked(isInternalPath).mockReturnValue(true)
    vi.mocked(findInternalFile).mockResolvedValue(internal)

    await onVaultRaw(context, onCreate, onModify)('raw.md')

    expect(onCreate).not.toBeCalled()
    expect(onModify).toBeCalled()
  })
})
