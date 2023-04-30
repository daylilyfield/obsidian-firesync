import { Notice, setIcon } from 'obsidian'

export function showNotice(message: string, duration = 4000): void {
  const fragment = document.createDocumentFragment()

  const header = fragment.createDiv({
    attr: {
      style: `display: flex; align-items: center; gap: 0.5em;`,
    },
  })
  setIcon(header, 'flame')
  header.appendText('Firesync')

  fragment.createDiv({
    text: message,
    attr: {
      style: `margin: 0.5em 0 0 0;`,
    },
  })
  new Notice(fragment, duration)
}
