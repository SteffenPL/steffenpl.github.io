<script lang="ts">
  import projects from '$lib/data/projects.yaml';
  import ProjectCard from '$lib/components/projects/ProjectCard.svelte';

  const research = (projects.research || [])
    .filter((p: any) => p.status !== 'hidden')
    .map((p: any) => ({ ...p, type: 'research' }));
  const none = research.filter((p: any) => p.status === 'none');
  const current = research.filter((p: any) => p.status === 'current');
  const published = research.filter((p: any) => p.status === 'published');
  const ideas = research.filter((p: any) => p.status === 'ideas');
</script>

<section class="py-20 px-6">
  <div class="max-w-[1100px] mx-auto">
    <h1 class="font-display font-semibold text-[clamp(1.3rem,2.5vw,1.8rem)]" style="color: var(--text);">
      Research Projects
    </h1>
    <div class="mt-2 mb-12 h-[3px] w-[48px] rounded-full" style="background: var(--gradient-accent);"></div>

    {#if none.length > 0}
      <div class="grid gap-4">
        {#each none as project, i}
          <ProjectCard {project} />
        {/each}
      </div>
    {/if}

    {#if current.length > 0}
      <h2 class="font-display font-semibold text-lg mt-8 mb-6" style="color: var(--text);">
        Current ({current.length})
      </h2>
      <div class="grid gap-4">
        {#each current as project, i}
          <ProjectCard {project} />
        {/each}
      </div>
    {/if}

    {#if published.length > 0}
      <h2 class="font-display font-semibold text-lg mt-12 mb-6" style="color: var(--text);">
        Published ({published.length})
      </h2>
      <div class="grid gap-4">
        {#each published as project, i}
          <ProjectCard {project} />
        {/each}
      </div>
    {/if}

    {#if ideas.length > 0}
      <h2 class="font-display font-semibold text-lg mt-12 mb-6" style="color: var(--text);">
        Ideas ({ideas.length})
      </h2>
      <div class="grid gap-4">
        {#each ideas as project, i}
          <ProjectCard {project} />
        {/each}
      </div>
    {/if}
  </div>
</section>
