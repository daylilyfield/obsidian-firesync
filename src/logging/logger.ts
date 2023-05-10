let verbose = true

export function setVerbose(value: boolean) {
  verbose = value
}

export function getLogger(label: string) {
  return {
    debug(...args: unknown[]) {
      if (!verbose) return
      const [format, ...params] = args
      console.debug(`[${label}] ${format}`, ...params)
    },
    warn(...args: unknown[]) {
      if (!verbose) return
      const [format, ...params] = args
      console.warn(`[${label}] ${format}`, ...params)
    },
    error(...args: unknown[]) {
      const [format, ...params] = args
      console.error(`[${label}] ${format}`, ...params)
    },
  }
}
