<script lang="ts">
  import publications from '$lib/data/publications.yaml';

  const preprints = publications.preprints || [];
  const peerReviewed = publications.peer_reviewed || [];

  function formatAuthors(authors: any[]) {
    return authors;
  }
</script>

<section class="py-20 px-6">
  <div class="max-w-[1100px] mx-auto">
    <h1 class="font-display font-semibold text-[clamp(1.3rem,2.5vw,1.8rem)]" style="color: var(--text);">
      Publications
    </h1>
    <div class="mt-2 mb-12 h-[3px] w-[48px] rounded-full" style="background: var(--gradient-accent);"></div>

    {#each [{ label: 'Preprints', items: preprints }, { label: 'Peer-reviewed', items: peerReviewed }] as section}
      {#if section.items.length > 0}
        <h2 class="font-display font-semibold text-lg mt-12 mb-6" style="color: var(--text);">
          {section.label}
        </h2>

        <div class="flex flex-col gap-4">
          {#each section.items as pub}
            <div
              class="rounded-xl border backdrop-blur-sm p-5"
              style="background: color-mix(in srgb, var(--bg-card) 80%, transparent); border-color: var(--bg-card-border); box-shadow: var(--shadow-card);"
            >
              <div class="flex gap-4">
                <span
                  class="font-display text-sm font-semibold shrink-0 pt-0.5"
                  style="color: var(--accent);"
                >
                  {@html pub.year}
                </span>

                <div class="min-w-0">
                  <h3 class="font-body text-sm font-medium leading-snug" style="color: var(--text);">
                    {pub.title}
                  </h3>

                  <p class="text-xs mt-1.5 leading-relaxed" style="color: var(--text-muted);">
                    {#each pub.authors as author, i}
                      {#if i > 0}, {/if}
                      {#if author.name === 'S. Plunder'}
                        <strong style="color: var(--text);">{author.name}</strong>
                      {:else if author.url}
                        <a
                          href={author.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="underline decoration-dotted hover:opacity-80"
                          style="color: var(--accent-secondary);"
                        >
                          {author.name}
                        </a>
                      {:else}
                        {author.name}
                      {/if}
                    {/each}
                  </p>

                  {#if pub.journal}
                    <p class="text-xs mt-1 italic" style="color: var(--text-muted);">
                      {@html pub.journal}
                    </p>
                  {/if}

                  {#if pub.links && pub.links.length > 0}
                    <div class="flex flex-wrap gap-3 mt-2">
                      {#each pub.links as link}
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-[11px] font-display font-medium hover:opacity-80 transition-opacity"
                          style="color: var(--accent);"
                        >
                          {link.name}
                        </a>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/each}
  </div>
</section>
