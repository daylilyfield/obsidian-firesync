import type FiresyncPlugin from '$/main'
import type { VaultId } from '$/models/vault.model'
import type { App, Vault } from 'obsidian'

export type ObsidianApp = App

export type ObsidianContext = {
  plugin: FiresyncPlugin
  app: ObsidianApp
  vault: Vault & { id: VaultId }
}
