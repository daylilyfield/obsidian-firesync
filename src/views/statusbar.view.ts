import FiresyncPlugin from '$/main'
import type { EventQueue } from '$/stores/eventqueue.store'
import StatusbarComponent from '$/views/components/StatusbarComponent.svelte'

export class SyncStatusbarView {
  private contentEl: HTMLElement
  private component: StatusbarComponent

  constructor(plugin: FiresyncPlugin, queue: EventQueue) {
    this.contentEl = plugin.addStatusBarItem()

    this.component = new StatusbarComponent({
      target: this.contentEl,
      props: {
        queue,
      },
    })
  }

  destroy() {
    this.component.$destroy()
    this.contentEl.remove()
  }
}
