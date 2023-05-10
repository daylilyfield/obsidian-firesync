import { onLocalCreate, onLocalModify, onLocalRename } from '$/handlers/local.handler'
import { createSyncFile, generateSyncFileId, updateSyncFile } from '$/services/firestore.service'
import { generateNextVersion, uploadFile } from '$/services/storage.service'
import { createFixtures } from '$/testing/fixtures'
import { expect, test, vi } from 'vitest'

vi.mock('$/services/firestore.service')
vi.mock('$/services/storage.service')

test('it should create sync file', async () => {
  const fixtures = createFixtures()
  const onCreate = onLocalCreate(fixtures.context)

  await onCreate({ type: 'local/create', file: fixtures.syncfile }, vi.fn())

  expect(generateNextVersion).toBeCalled()
  expect(uploadFile).toBeCalled()
  expect(createSyncFile).toBeCalled()
})

test('it should modify sync file', async () => {
  const fixtures = createFixtures()
  const onModify = onLocalModify(fixtures.context)

  await onModify({ type: 'local/modify', file: fixtures.syncfile }, vi.fn())

  expect(generateNextVersion).toBeCalled()
  expect(uploadFile).toBeCalled()
  expect(updateSyncFile).toBeCalled()
})

test('it should rename sync file', async () => {
  const fixtures = createFixtures()
  const onRename = onLocalRename(fixtures.context)

  await onRename(
    { type: 'local/rename', file: fixtures.syncfile, previous: 'path/to/previous' },
    vi.fn()
  )

  expect(generateNextVersion).toBeCalled()
  expect(uploadFile).toBeCalled()
  expect(createSyncFile).toBeCalled()
  expect(generateSyncFileId).toBeCalled()
  expect(updateSyncFile).toBeCalled()
})
