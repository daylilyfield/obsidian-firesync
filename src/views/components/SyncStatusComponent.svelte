<script lang="ts">
  import type { EventQueue } from '$/stores/eventqueue.store'
  import CloudIconComponent from '$/views/components/CloudIconComponent.svelte'
  import CloudOffIconComponent from '$/views/components/CloudOffIconComponent.svelte'
  import SyncStatusItemComponent from '$/views/components/SyncStatusItemComponent.svelte'
  import { fade } from 'svelte/transition'

  export let queue: EventQueue

  $: online = queue.online
</script>

<div class="sync-status-component">
  <header>
    <div>Firesync Status</div>
    <div class="online">
      {#if $online}
        <CloudIconComponent size="1.25em" />
      {:else}
        <CloudOffIconComponent size="1.25em" />
      {/if}
    </div>
  </header>
  <div class="items">
    {#each $queue as progress (progress.id)}
      <div in:fade={{ duration: 300 }} out:fade={{ duration: 300, delay: 1500 }}>
        <SyncStatusItemComponent
          {queue}
          id={progress.id}
          message={progress.message}
          progress={progress.progress}
          done={progress.done}
          error={progress.error} />
      </div>
    {:else}
      <div class="pane-empty" in:fade={{ delay: 2000 }}>No sync in progress.</div>
    {/each}
  </div>
</div>

<style>
  .sync-status-component {
    font-size: var(--nav-item-size);
    font-weight: var(--nav-item-weight);
    color: var(--nav-item-color);
  }

  header {
    margin: 0 0 var(--size-4-3) 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .items {
    display: flex;
    flex-direction: column;
    margin: var(--size-4-4) 0 0 0;
    gap: var(--size-4-4);
  }
</style>
