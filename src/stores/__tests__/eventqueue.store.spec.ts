import { defaultSettings } from '$/models/settings.model'
import type { SyncEvent } from '$/models/syncevent.model'
import { restoreSyncEvents, saveSyncEvents } from '$/services/syncevent.service'
import { createEventQueue } from '$/stores/eventqueue.store'
import { createFixtures } from '$/testing/fixtures'
import { waitUntil } from '$/testing/testing'
import { get } from 'svelte/store'
import { describe, it, expect, vi } from 'vitest'

vi.mock('$/services/syncevent.service')

describe('add', async () => {
  it('should preserve events when offline', async () => {
    const { syncfile } = createFixtures()

    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false)
    vi.mocked(restoreSyncEvents).mockReturnValue([])

    const queue = createEventQueue(defaultSettings)

    queue.add({ type: 'local/create', file: syncfile })

    expect(saveSyncEvents).toBeCalled()

    queue.destroy()
  })

  it('sould consume waitings immediately', async () => {
    const { syncfile } = createFixtures()
    const handler = vi.fn().mockResolvedValue(undefined)
    const queue = createEventQueue(defaultSettings)

    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)
    queue.on('local/create', handler)

    queue.add({ type: 'local/create', file: syncfile })

    expect(get(queue)).toHaveLength(1)

    await waitUntil(() => get(queue).length === 0)

    expect(handler).toBeCalled()
    expect(get(queue)).toHaveLength(0)

    queue.destroy()
  })

  it('sould consume waitings lazily', async () => {
    const { context, syncfile } = createFixtures()
    const handler = vi.fn().mockResolvedValue(undefined)
    const queue = createEventQueue(defaultSettings)

    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)
    queue.on('local/modify', handler)

    vi.useFakeTimers()

    queue.add({ type: 'local/modify', file: syncfile })

    vi.advanceTimersByTime(context.plugin.settings.debounce)

    expect(get(queue)).toHaveLength(1)

    vi.useRealTimers()

    await waitUntil(() => get(queue).length === 0)

    expect(handler).toBeCalled()
    expect(get(queue)).toHaveLength(0)

    queue.destroy()
  })

  it('should distinct events', async () => {
    const { context, syncfile } = createFixtures()
    const handler = vi.fn().mockResolvedValue(undefined)
    const queue = createEventQueue(defaultSettings)

    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)
    queue.on('local/modify', handler)

    vi.useFakeTimers()

    queue.add({ type: 'local/modify', file: { ...syncfile, mtime: 1 } })
    queue.add({ type: 'local/modify', file: { ...syncfile, mtime: 2 } })

    vi.advanceTimersByTime(context.plugin.settings.debounce)

    expect(get(queue)).toHaveLength(1)
    expect(get(queue)[0].event.file.mtime).toBe(2)

    queue.destroy()
  })
})

describe('retry', () => {
  it('should retry event', async () => {
    const { syncfile } = createFixtures()
    const handler = vi.fn().mockRejectedValue('Error')
    const queue = createEventQueue(defaultSettings)

    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)
    queue.on('local/create', handler)

    queue.add({ type: 'local/create', file: syncfile })

    expect(get(queue)).toHaveLength(1)

    const { id: current } = get(queue)[0]

    queue.retry(current)

    expect(get(queue)).toHaveLength(1)

    const { id: next } = get(queue)[0]

    expect(current === next).toBe(false)

    queue.destroy()
  })
})

describe('delete', () => {
  it('should delete event', async () => {
    const { syncfile } = createFixtures()
    const handler = vi.fn().mockRejectedValue('Error')
    const queue = createEventQueue(defaultSettings)

    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)
    queue.on('local/create', handler)

    queue.add({ type: 'local/create', file: syncfile })

    expect(get(queue)).toHaveLength(1)

    const { id } = get(queue)[0]

    queue.delete(id)

    expect(get(queue)).toHaveLength(0)

    queue.destroy()
  })
})

describe('online', () => {
  it('should consume events when become online', () => {
    const { syncfile } = createFixtures()
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)

    vi.mocked(restoreSyncEvents).mockReturnValue([{ type: 'local/create', file: syncfile }])

    const queue = createEventQueue(defaultSettings)

    expect(saveSyncEvents).toBeCalled()
    expect(get(queue)).toHaveLength(1)

    queue.destroy()
  })

  it('should preserve waiting events when become offline', () => {
    const { syncfile } = createFixtures()
    const event: SyncEvent = { type: 'local/modify', file: syncfile }
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)
    const queue = createEventQueue(defaultSettings)

    // let events stay in waiting queue
    vi.useFakeTimers()
    queue.add(event)

    window.dispatchEvent(new Event('offline'))

    expect(saveSyncEvents).toBeCalledTimes(2) // each online and offline cases
    expect(saveSyncEvents).toHaveBeenNthCalledWith(2, [event])

    queue.destroy()
  })
})
