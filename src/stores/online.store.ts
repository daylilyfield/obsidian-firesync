import { type Readable, readable } from 'svelte/store'

export type Online = Readable<boolean> & {
  isOnline(): boolean
}

export function createOnline(): Online {
  const online = readable<boolean>(window.navigator.onLine, set => {
    const onOnLine = () => set(true)
    const onOffLine = () => set(false)

    window.addEventListener('online', onOnLine)
    window.addEventListener('offline', onOffLine)

    return () => {
      window.removeEventListener('online', onOnLine)
      window.removeEventListener('offline', onOffLine)
    }
  })

  return {
    subscribe: online.subscribe,
    isOnline: () => window.navigator.onLine,
  }
}
