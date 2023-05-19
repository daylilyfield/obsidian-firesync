import { withRetry } from '$/utils/retries'
import { expect, test, vi } from 'vitest'

test('it should retry', async () => {
  const fake = vi.fn()
  fake.mockRejectedValueOnce('error')
  fake.mockResolvedValueOnce('ok')
  const result = await withRetry(fake)

  expect(result).toBe('ok')
})

test('it should reach max retries', async () => {
  const fake = vi.fn()
  fake.mockRejectedValue('error')

  let error: unknown

  try {
    await withRetry(fake, 1)
  } catch (e) {
    error = e
  }

  expect(error).toBeDefined()
})
