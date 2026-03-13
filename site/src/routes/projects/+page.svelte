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

<section class="px-6 py-20">
  <div class="mx-auto max-w-[1100px]">
    <div class="reveal">
      <div class="accent-line"></div>
      <h1
        class="font-display text-[clamp(1.3rem,2.5vw,1.8rem)] font-semibold"
        style="color: var(--text);"
      >
        Projects
      </h1>
    </div>

    {#each [{ label: 'Active', items: activeProjects }, { label: 'Completed', items: completedProjects }] as group}
      {#if group.items.length > 0}
        <h2
          class="mt-12 mb-6 font-display text-lg font-semibold"
          style="color: var(--text);"
        >
          {group.label}
        </h2>

        <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {#each group.items as project, i}
            <div
              class="card reveal"
              style="transition-delay: {(i + 1) * 0.05}s;"
            >
              {#if project.image}
                <div class="card-thumb">
                  <img
                    src={project.image}
                    alt={project.title}
                    class="h-full w-full rounded-[10px] object-cover"
                  />
                </div>
              {/if}

              <div class="flex flex-1 flex-col gap-2 min-w-0">
                <h3
                  class="font-display text-sm font-semibold leading-tight"
                  style="color: var(--text);"
                >
                  {project.title}
                </h3>

                <p class="text-xs leading-relaxed" style="color: var(--text-muted);">
                  {project.desc}
                </p>

                {#if project.tags && project.tags.length > 0}
                  <div class="flex flex-wrap gap-1.5">
                    {#each project.tags as tag}
                      <span class="tag">{tag}</span>
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
                  <div class="mt-auto flex flex-wrap gap-3 pt-1">
                    {#each project.links as link}
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="card-link"
                      >
                        {link.label} <span class="card-link-arrow">&rarr;</span>
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

<style>
  .accent-line {
    width: 48px;
    height: 3px;
    background: var(--gradient-accent);
    border-radius: 2px;
    margin-bottom: 1rem;
  }

  .card {
    background: var(--bg-card);
    border: 1px solid var(--bg-card-border);
    border-radius: 14px;
    backdrop-filter: blur(16px);
    box-shadow: var(--shadow-card);
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
    overflow: hidden;
    display: flex;
    gap: 1.15rem;
    padding: 1rem;
  }
  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent), transparent);
    opacity: 0;
    transition: opacity 0.4s;
  }
  .card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-card-hover);
  }
  .card:hover::before { opacity: 1; }

  .card-thumb {
    width: 110px;
    min-height: 90px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tag {
    font-size: 0.68rem;
    font-weight: 500;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    background: rgba(249, 115, 22, 0.08);
    color: var(--accent);
    border: 1px solid rgba(249, 115, 22, 0.15);
    letter-spacing: 0.02em;
  }
  :global([data-theme='light']) .tag {
    background: rgba(101, 163, 13, 0.1);
    border-color: rgba(101, 163, 13, 0.2);
  }

  .card-link {
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 500;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    transition: color 0.2s, gap 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .card-link:hover {
    color: var(--accent-secondary);
    gap: 0.45rem;
  }
  .card-link-arrow {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    font-size: 0.75rem;
  }
  .card-link:hover .card-link-arrow {
    transform: translateX(2px);
  }

  @media (max-width: 720px) {
    .card-thumb { display: none; }
  }
</style>
