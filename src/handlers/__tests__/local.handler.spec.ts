import { onLocalCreate } from '$/handlers/local.handler'
import { createSyncFile } from '$/services/firestore.service'
import { generateNextVersion, uploadFile } from '$/services/storage.service'
import * as fixtures from '$/testing/fixtures'
import { describe, expect, it, vi } from 'vitest'

vi.mock('$/services/firestore.service')
vi.mock('$/services/storage.service')

describe('onLocalCreate', () => {
  it('should create sync file', async () => {
    const context = fixtures.createContext()
    const onCreate = onLocalCreate(context)

    await onCreate({ type: 'local/create', file: fixtures.syncfile }, vi.fn())

    expect(generateNextVersion).toBeCalled()
    expect(uploadFile).toBeCalled()
    expect(createSyncFile).toBeCalled()
  })
})
