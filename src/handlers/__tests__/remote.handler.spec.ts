import { expect, test, vi } from 'vitest'
import {
  onRemoteCreate,
  onRemoteDelete,
  onRemoteModify,
  onRemoteTrash,
} from '$/handlers/remote.handler'
import { downloadFile } from '$/services/storage.service'
import {
  createFolders,
  createObsidianFile,
  deleteObsidianFile,
  findObsidianFile,
  isFileType,
  trashObsidianFile,
  updateObsidianFile,
} from '$/services/vault.service'
import { createFixtures } from '$/testing/fixtures'

vi.mock('$/services/storage.service')
vi.mock('$/services/vault.service')

test('it should create local file', async () => {
  const fixtures = createFixtures()
  const onCreate = onRemoteCreate(fixtures.context)

  vi.mocked(findObsidianFile).mockResolvedValue(null)

  await onCreate({ type: 'remote/create', file: fixtures.syncfile }, vi.fn())

  expect(downloadFile).toBeCalled()
  expect(createFolders).toBeCalled()
  expect(createObsidianFile).toBeCalled()
})

test('it should update local file', async () => {
  const fixtures = createFixtures()
  const onModify = onRemoteModify(fixtures.context)

  vi.mocked(findObsidianFile).mockResolvedValue(fixtures.file)
  vi.mocked(isFileType).mockReturnValue(true)

  await onModify({ type: 'remote/modify', file: fixtures.syncfile }, vi.fn())

  expect(downloadFile).toBeCalled()
  expect(createFolders).toBeCalled()
  expect(updateObsidianFile).toBeCalled()
})

test('it should delete local file', async () => {
  const fixtures = createFixtures()
  const onDelete = onRemoteDelete(fixtures.context)

  vi.mocked(findObsidianFile).mockResolvedValue(fixtures.file)
  vi.mocked(isFileType).mockReturnValue(true)

  await onDelete({ type: 'remote/delete', file: fixtures.syncfile }, vi.fn())

  expect(deleteObsidianFile).toBeCalled()
})

test('it should trash local file', async () => {
  const fixtures = createFixtures()
  const onTrash = onRemoteTrash(fixtures.context)

  vi.mocked(findObsidianFile).mockResolvedValue(fixtures.file)
  vi.mocked(isFileType).mockReturnValue(true)

  await onTrash({ type: 'remote/trash', file: fixtures.syncfile }, vi.fn())

  expect(trashObsidianFile).toBeCalled()
})
