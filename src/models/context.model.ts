import type FiresyncPlugin from '$/main'
import type { FirebaseContext } from '$/models/firebase.models'
import type { ObsidianContext } from '$/models/obsidian.model'

export type Context = {
  plugin: FiresyncPlugin
  obsidian: ObsidianContext
  firebase: FirebaseContext
}
