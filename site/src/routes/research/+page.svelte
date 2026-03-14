<script lang="ts">
  import projects from '$lib/data/projects.yaml';
  import ProjectCard from '$lib/components/projects/ProjectCard.svelte';

  const research = (projects.research || []).map((p: any) => ({ ...p, type: 'research' }));
  const active = research.filter((p: any) => p.status === 'active');
  const completed = research.filter((p: any) => p.status === 'completed');
</script>

<section class="py-20 px-6">
  <div class="max-w-[1100px] mx-auto">
    <h1 class="font-display font-semibold text-[clamp(1.3rem,2.5vw,1.8rem)]" style="color: var(--text);">
      Research Projects
    </h1>
    <div class="mt-2 mb-12 h-[3px] w-[48px] rounded-full" style="background: var(--gradient-accent);"></div>

    {#if active.length > 0}
      <h2 class="font-display font-semibold text-lg mt-8 mb-6" style="color: var(--text);">
        Active ({active.length})
      </h2>
      <div class="grid gap-4">
        {#each active as project, i}
          <ProjectCard {project} />
        {/each}
      </div>
    {/if}

    {#if completed.length > 0}
      <h2 class="font-display font-semibold text-lg mt-12 mb-6" style="color: var(--text);">
        Completed ({completed.length})
      </h2>
      <div class="grid gap-4">
        {#each completed as project, i}
          <ProjectCard {project} />
        {/each}
      </div>
    {/if}
  </div>
</section>
