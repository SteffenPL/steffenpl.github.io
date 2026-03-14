<script lang="ts">
  import publications from '$lib/data/publications.yaml';
  import PublicationCard from '$lib/components/publications/PublicationCard.svelte';

  const theses = publications.theses || [];
  const preprints = publications.preprints || [];
  const peerReviewed = publications.peer_reviewed || [];
</script>

<section class="py-20 px-6">
  <div class="max-w-[1100px] mx-auto">
    <h1 class="font-display font-semibold text-[clamp(1.3rem,2.5vw,1.8rem)]" style="color: var(--text);">
      Publications
    </h1>
    <div class="mt-2 mb-12 h-[3px] w-[48px] rounded-full" style="background: var(--gradient-accent);"></div>

    {#each [{ label: `Peer-reviewed (${peerReviewed.length})`, items: peerReviewed }, { label: `Preprints (${preprints.length})`, items: preprints }, { label: 'Theses', items: theses }] as section}
      {#if section.items.length > 0}
        <h2 class="font-display font-semibold text-lg mt-12 mb-6" style="color: var(--text);">
          {section.label}
        </h2>

        <div class="flex flex-col gap-4">
          {#each section.items as pub, i}
            <PublicationCard {pub} animationDelay="{i * 0.05}s" />
          {/each}
        </div>
      {/if}
    {/each}
  </div>
</section>
