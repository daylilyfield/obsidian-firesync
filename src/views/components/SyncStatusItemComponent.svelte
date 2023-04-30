<script lang="ts">
  import MoreVertIconComponent from '$/views/components/MoreVertIconComponent.svelte'
  import SyncIconComponent from '$/views/components/SyncIconComponent.svelte'
  import { clickoutside } from '$/views/components/clickoutside'
  import type { EventQueue } from '$/stores/eventqueue.store'
  import type { SyncProgress } from '$/models/syncprogress.model'

  export let queue: EventQueue
  export let id: SyncProgress['id']
  export let message = ''
  export let progress = 0
  export let done = false
  export let error = false

  let entering = false
  let visible = false

  function onMouseEnter() {
    entering = true
  }

  function onMouseLeave() {
    entering = false
  }

  function onMenuClick() {
    visible = true
  }

  function onOutsideClick() {
    visible = false
  }

  function onRetryClick() {
    visible = false
    queue.retry(id)
  }

  function onDeleteClick() {
    visible = false
    queue.delete(id)
  }
</script>

<div
  use:clickoutside={onOutsideClick}
  class="sync-status-item-component"
  class:done
  class:error
  on:mouseenter={onMouseEnter}
  on:mouseleave={onMouseLeave}>
  <div class="header">
    <div class="icon">
      <SyncIconComponent rotate={!done && !error} />
    </div>
    <div class="message">{message}</div>
  </div>
  <div class="progress">
    <div class="bar" style:width="{progress}%" />
  </div>
  {#if entering}
    <button class="sync-menu" on:click={onMenuClick}>
      <MoreVertIconComponent />
    </button>
  {/if}
  {#if visible}
    <div class="sync-menu-list">
      <button on:click={onRetryClick}>Retry</button>
      <button on:click={onDeleteClick}>Delete</button>
    </div>
  {/if}
</div>

<style>
  .sync-status-item-component {
    position: relative;
    font-size: var(--font-ui-small);
    border-radius: var(--radius-s);
    transition: opacity 300ms 1s;
    background-color: var(--titlebar-background);
  }

  .sync-status-item-component.done {
    color: var(--text-accent);
  }

  .sync-status-item-component.error {
    color: var(--color-red);
  }

  .header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--size-2-2);
  }

  .header > .icon {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .header > .message {
    padding: 0;
    margin: 0;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    direction: rtl;
    text-align: left;
  }

  .progress {
    margin: var(--size-2-1) 0 0 0;
    height: 0.2em;
    border-radius: var(--radius-s);
  }

  .bar {
    height: 0.2em;
    background-color: var(--color-accent);
    flex: 1 1 auto;
    border-radius: var(--radius-s);
    transition: width 300ms;
  }

  .sync-menu {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
    width: 20px;
    height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    cursor: pointer;
  }

  .sync-menu-list {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
  }

  .sync-menu-list > button {
    border-radius: 0;
  }

  .sync-menu-list > button:first-child {
    border-top-left-radius: var(--button-radius);
    border-top-right-radius: var(--button-radius);
  }

  .sync-menu-list > button:last-child {
    border-bottom-left-radius: var(--button-radius);
    border-bottom-right-radius: var(--button-radius);
  }
</style>
