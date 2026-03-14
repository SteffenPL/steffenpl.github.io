<!--
  Renders a vertical list of publication cards.

  Props:
    slugs   – optional array of publication slugs to include (in that order)
    section – 'all' | 'peer_reviewed' | 'preprints'  (default: 'all')
    limit   – optional max number of publications to show

  Usage in a blog post (.md with mdsvex):
    <script>
      import PublicationList from '$lib/components/publications/PublicationList.svelte';
    </script>

    <PublicationList slugs={['plunder_2024_natcomms', 'despin_2024_natcomms']} />
-->
<script lang="ts">
  import publications from '$lib/data/publications.yaml';
  import PublicationCard from './PublicationCard.svelte';
  import type { Publication } from '$lib/types/index.js';

  interface Props {
    slugs?: string[];
    section?: 'all' | 'peer_reviewed' | 'preprints';
    limit?: number;
  }

  let { slugs, section = 'all', limit }: Props = $props();

  const filteredPubs = $derived.by(() => {
    let pool: Publication[] = [];
    if (section !== 'preprints') pool.push(...publications.peer_reviewed);
    if (section !== 'peer_reviewed') pool.push(...publications.preprints);
    if (slugs) {
      // preserve the order of the slugs array
      pool = slugs
        .map((s) => pool.find((p) => p.slug === s))
        .filter((p): p is Publication => !!p);
    }
    if (limit) pool = pool.slice(0, limit);
    return pool;
  });
</script>

<div class="pub-list">
  {#each filteredPubs as pub, i}
    <PublicationCard {pub} animationDelay="{i * 0.07}s" />
  {/each}
</div>

<style>
  .pub-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
