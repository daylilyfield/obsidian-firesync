import { sleep } from '$/utils/times'

const baseInterval = 100

export async function withRetry<T>(retryable: () => Promise<T>, max = 10): Promise<T> {
  let count = 0
  let error: unknown

  while (count < max) {
    try {
      const result = await retryable()
      return result
    } catch (err) {
      error = err
      await sleep(baseInterval + Math.pow(2, count))
      count++
    }
  }

  throw new Error(`obsidian-firesync/max-retries-exceeded: ${error}`)
}
