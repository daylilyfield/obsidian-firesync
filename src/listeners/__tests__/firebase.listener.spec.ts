import { onFirebaseChanged } from '$/listeners/firebase.listener'
import {
  findObsidianFile,
  generateHash,
  isFileType,
  isInternalPath,
} from '$/services/vault.service'
import { createFixtures } from '$/testing/fixtures'
import { describe, expect, it, vi } from 'vitest'

vi.mock('$/services/vault.service')

describe('onFirebaseChanged', () => {
  it('should suppress', async () => {
    const { context, syncfile, queue } = createFixtures()

    vi.mocked(queue.isSuppressed).mockReturnValue(true)

    await onFirebaseChanged(context, syncfile, queue)

    expect(findObsidianFile).not.toBeCalled()
  })

  it('should not handle internal file', async () => {
    const { context, syncfile, queue } = createFixtures()

    context.plugin.settings.internal = false

    vi.mocked(isInternalPath).mockReturnValue(true)

    await onFirebaseChanged(context, syncfile, queue)

    expect(findObsidianFile).not.toBeCalled()
  })

  it('should ignore', async () => {
    const { context, syncfile, queue } = createFixtures()

    context.plugin.settings.ignores = 'file.md'

    vi.mocked(isInternalPath).mockReturnValue(true)

    await onFirebaseChanged(context, syncfile, queue)

    expect(findObsidianFile).not.toBeCalled()
  })

  it.each([
    { label: 'deleted', prop: { deleted: true, trashed: false } },
    { label: 'trashed', prop: { deleted: false, trashed: true } },
  ])(
    'should not add remote event when local file is missing and remote file is $label',
    async ({ prop }) => {
      const { context, syncfile, queue } = createFixtures()

      vi.mocked(isInternalPath).mockReturnValue(true)
      vi.mocked(findObsidianFile).mockResolvedValue(null)

      await onFirebaseChanged(context, { ...syncfile, ...prop }, queue)

      expect(queue.add).not.toBeCalled()
    }
  )

  it('should add remote event', async () => {
    const { context, syncfile, queue } = createFixtures()

    vi.mocked(findObsidianFile).mockResolvedValue(null)

    await onFirebaseChanged(context, syncfile, queue)

    expect(queue.add).toBeCalled()
  })

  it.each([
    { label: 'deleted', prop: { deleted: true, trashed: false } },
    { label: 'trashed', prop: { deleted: false, trashed: true } },
  ])('should add remote event when local file exists and remote is $label', async ({ prop }) => {
    const { context, syncfile, queue, file } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)
    vi.mocked(findObsidianFile).mockResolvedValue(file)

    await onFirebaseChanged(context, { ...syncfile, ...prop, mtime: file.stat.mtime + 1 }, queue)

    expect(queue.add).toBeCalled()
  })

  it('should not add remote event when target is a directory', async () => {
    const { context, syncfile, queue, file } = createFixtures()

    vi.mocked(findObsidianFile).mockResolvedValue(file)
    vi.mocked(isFileType).mockReturnValue(false)

    await onFirebaseChanged(context, syncfile, queue)

    expect(queue.add).not.toBeCalled()
  })

  it('should not add remote event when remote mtime is older', async () => {
    const { context, syncfile, queue, file } = createFixtures()

    vi.mocked(findObsidianFile).mockResolvedValue(file)
    vi.mocked(isFileType).mockReturnValue(true)

    await onFirebaseChanged(context, syncfile, queue)

    expect(queue.add).not.toBeCalled()
  })

  it('should not add remote event when both hashes are same', async () => {
    const { context, syncfile, queue, file } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)
    vi.mocked(findObsidianFile).mockResolvedValue(file)
    vi.mocked(generateHash).mockResolvedValue(syncfile.hash)

    await onFirebaseChanged(context, { ...syncfile, mtime: file.stat.mtime + 1 }, queue)

    expect(queue.add).not.toBeCalled()
  })

  it('should add remote event when both hashes are different', async () => {
    const { context, syncfile, queue, file } = createFixtures()

    vi.mocked(isFileType).mockReturnValue(true)
    vi.mocked(findObsidianFile).mockResolvedValue(file)
    vi.mocked(generateHash).mockResolvedValue(syncfile.hash + 'hijk')

    await onFirebaseChanged(context, { ...syncfile, mtime: file.stat.mtime + 1 }, queue)

    expect(queue.add).toBeCalled()
  })
})
