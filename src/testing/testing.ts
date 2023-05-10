export async function waitUntil(predicate: () => boolean, timeout = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    const until = Date.now() + timeout
    const timer = setInterval(() => {
      if (predicate()) {
        clearInterval(timer)
        resolve()
      }

      if (Date.now() > until) {
        clearInterval(timer)
        reject(`timeout: ${timeout}ms`)
      }
    }, 100)
  })
}
