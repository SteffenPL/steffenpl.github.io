<script lang="ts">
  import projects from '$lib/data/projects.yaml';
  import publications from '$lib/data/publications.yaml';

  const allPubs = [...(publications.preprints || []), ...(publications.peer_reviewed || [])];

  function getPubById(id: number) {
    return allPubs.find((p: any) => p.id === id);
  }

  const activeProjects = projects.filter((p: any) => p.status === 'active');
  const completedProjects = projects.filter((p: any) => p.status === 'completed');
</script>

<section class="py-20 px-6">
  <div class="max-w-[1100px] mx-auto">
    <h1 class="font-display font-semibold text-[clamp(1.3rem,2.5vw,1.8rem)]" style="color: var(--text);">
      Projects
    </h1>
    <div class="mt-2 mb-12 h-[3px] w-[48px] rounded-full" style="background: var(--gradient-accent);"></div>

    {#each [{ label: 'Active', items: activeProjects }, { label: 'Completed', items: completedProjects }] as group}
      {#if group.items.length > 0}
        <h2 class="font-display font-semibold text-lg mt-12 mb-6" style="color: var(--text);">
          {group.label}
        </h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {#each group.items as project}
            <div
              class="flex rounded-xl border backdrop-blur-sm overflow-hidden"
              style="background: var(--bg-card); border-color: var(--bg-card-border); box-shadow: var(--shadow-card);"
            >
              {#if project.image}
                <div class="shrink-0 w-[110px]">
                  <img
                    src={project.image}
                    alt={project.title}
                    class="w-full h-full object-cover"
                  />
                </div>
              {/if}

              <div class="p-4 flex flex-col gap-2 min-w-0">
                <h3 class="font-display font-semibold text-sm leading-tight" style="color: var(--text);">
                  {project.title}
                </h3>

                <p class="text-xs leading-relaxed" style="color: var(--text-muted);">
                  {project.desc}
                </p>

                {#if project.tags && project.tags.length > 0}
                  <div class="flex flex-wrap gap-1.5">
                    {#each project.tags as tag}
                      <span
                        class="text-[10px] px-2 py-0.5 rounded-full border"
                        style="color: var(--accent); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, transparent);"
                      >
                        {tag}
                      </span>
                    {/each}
                  </div>
                {/if}

                {#if project.publications && project.publications.length > 0}
                  <div class="flex flex-col gap-0.5">
                    {#each project.publications as pubId}
                      {@const pub = getPubById(pubId)}
                      {#if pub}
                        <p class="text-[11px] leading-snug" style="color: var(--text-muted);">
                          {#if pub.links && pub.links.length > 0}
                            <a
                              href={pub.links[0].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="underline decoration-dotted hover:opacity-80"
                              style="color: var(--accent-secondary);"
                            >
                              {pub.title}
                            </a>
                          {:else}
                            {pub.title}
                          {/if}
                        </p>
                      {/if}
                    {/each}
                  </div>
                {/if}

                {#if project.links && project.links.length > 0}
                  <div class="flex flex-wrap gap-2 mt-auto pt-1">
                    {#each project.links as link}
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-[11px] font-display font-medium hover:opacity-80 transition-opacity"
                        style="color: var(--accent);"
                      >
                        {link.label}
                      </a>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/each}
  </div>
</section>
