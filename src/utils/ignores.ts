import type { Context } from '$/models/context.model'
import ignore from 'ignore'

const defaultIgnores = [
  '.DS_Store',
  'Thumbs.db',
  '.git/',
  'node_modules/',
  '.obsidian/plugins/obsidian-firesync/**',
  '!.obsidian/plugins/obsidian-firesync/main.js',
  '!.obsidian/plugins/obsidian-firesync/styles.css',
  '!.obsidian/plugins/obsidian-firesync/manifest.json',
  'data.json',
]

export function createIgnoreFilter(context: Context) {
  const ignores = [...defaultIgnores, ...context.plugin.settings.ignores.trim().split('\n')]
  const ig = ignore().add(ignores)
  return {
    isIgnored: (path: string) => ig.ignores(path),
    isAccepted: (path: string) => !ig.ignores(path),
  }
}
