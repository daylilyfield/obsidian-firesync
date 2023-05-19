export async function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve, _) => {
    window.setTimeout(resolve, ms)
  })
}
