<script lang="ts">
  import type { EventQueue } from '$/stores/eventqueue.store'
  import SyncIconComponent from '$/views/components/SyncIconComponent.svelte'

  export let queue: EventQueue
</script>

{#if $queue.length > 0}
  <div class="statusbar-component">
    <SyncIconComponent rotate /> firesync
  </div>
{/if}

<style>
  .statusbar-component {
    display: flex;
    align-items: center;
    gap: var(--size-2-2);
  }
</style>
