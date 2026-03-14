<script lang="ts">
  import talks from '$lib/data/talks.yaml';

  import type { Talk } from '$lib/types';

  const talksByYear = $derived.by(() => {
    const groups: Record<string, Talk[]> = {};
    for (const talk of talks as Talk[]) {
      const year = talk.date.slice(0, 4);
      if (!groups[year]) groups[year] = [];
      groups[year].push(talk);
    }
    return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a));
  });
</script>

<section class="py-20 px-6">
  <div class="max-w-[1100px] mx-auto">
    <h1 class="font-display font-semibold text-[clamp(1.3rem,2.5vw,1.8rem)]" style="color: var(--text);">
      Talks
    </h1>
    <div class="mt-2 mb-12 h-[3px] w-[48px] rounded-full" style="background: var(--gradient-accent);"></div>

    {#each talksByYear as [year, yearTalks]}
      <h2 class="font-display font-semibold text-lg mt-10 mb-4" style="color: var(--text);">
        {year}
      </h2>

      <div class="flex flex-col gap-2 mb-6">
        {#each yearTalks as talk}
          <div class="flex items-baseline gap-4 py-2 border-b" style="border-color: var(--bg-card-border);">
            <span
              class="font-display text-xs shrink-0 tabular-nums"
              style="color: var(--accent);"
            >
              {talk.date}
            </span>

            <div class="min-w-0">
              {#if talk.url}
                <a
                  href={talk.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm font-medium hover:opacity-80 transition-opacity"
                  style="color: var(--text);"
                >
                  {talk.title}
                </a>
              {:else}
                <span class="text-sm font-medium" style="color: var(--text);">
                  {talk.title}
                </span>
              {/if}

              <span class="text-xs ml-2" style="color: var(--text-muted);">
                {talk.venue}
              </span>

              {#if talk.video}
                <a
                  href={talk.video}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[11px] font-display font-medium ml-2 hover:opacity-80 transition-opacity"
                  style="color: var(--accent-secondary);"
                >
                  Video
                </a>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/each}
  </div>
</section>
