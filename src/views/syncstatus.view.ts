import { ItemView, WorkspaceLeaf } from 'obsidian'
import SyncStatusComponent from '$/views/components/SyncStatusComponent.svelte'
import type { EventQueue } from '$/stores/eventqueue.store'

export const viewTypeStatus = 'firesync-status-view'

export class SyncStatusView extends ItemView {
  private component: SyncStatusComponent

  constructor(leaf: WorkspaceLeaf, private queue: EventQueue) {
    super(leaf)
    this.icon = 'flame'
  }

  getViewType() {
    return viewTypeStatus
  }

  getDisplayText() {
    return 'Firesync Status'
  }

  async onOpen() {
    this.component = new SyncStatusComponent({
      target: this.contentEl,
      props: {
        queue: this.queue,
      },
    })
  }

  async onClose() {
    this.component.$destroy()
  }
}
