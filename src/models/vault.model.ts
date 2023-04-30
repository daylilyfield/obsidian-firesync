export type VaultId = string

export type InternalFile = {
  path: string
  stat: {
    ctime: number
    mtime: number
    size: number
  }
}
