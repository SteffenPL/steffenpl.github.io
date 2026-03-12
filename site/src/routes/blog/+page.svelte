<script lang="ts">
  const modules = import.meta.glob('/src/content/blog/*.md', { eager: true });

  type Post = {
    slug: string;
    title: string;
    date: string;
    description?: string;
  };

  const posts = $derived.by(() => {
    const items: Post[] = [];
    for (const [path, mod] of Object.entries(modules)) {
      const slug = path.split('/').pop()?.replace('.md', '') || '';
      const meta = (mod as any).metadata || {};
      items.push({
        slug,
        title: meta.title || slug,
        date: meta.date || '',
        description: meta.description || ''
      });
    }
    return items.sort((a, b) => (b.date > a.date ? 1 : -1));
  });
</script>

<section class="py-20 px-6">
  <div class="max-w-[1100px] mx-auto">
    <h1 class="font-display font-semibold text-[clamp(1.3rem,2.5vw,1.8rem)]" style="color: var(--text);">
      Blog
    </h1>
    <div class="mt-2 mb-12 h-[3px] w-[48px] rounded-full" style="background: var(--gradient-accent);"></div>

    {#if posts.length === 0}
      <p class="text-sm" style="color: var(--text-muted);">No posts yet.</p>
    {:else}
      <div class="flex flex-col gap-2">
        {#each posts as post}
          <a
            href="/blog/{post.slug}"
            class="flex items-baseline gap-4 py-3 border-b hover:opacity-80 transition-opacity"
            style="border-color: var(--bg-card-border);"
          >
            <span
              class="font-display text-xs shrink-0 tabular-nums"
              style="color: var(--accent);"
            >
              {post.date}
            </span>
            <span class="text-sm font-medium" style="color: var(--text);">
              {post.title}
            </span>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</section>
