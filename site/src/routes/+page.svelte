<script lang="ts">
  import HeroCanvas from '$lib/components/home/HeroCanvas.svelte';
  import PublicationList from '$lib/components/publications/PublicationList.svelte';
  import ProjectCard from '$lib/components/projects/ProjectCard.svelte';
  import projects from '$lib/data/projects.yaml';

  const featuredResearch = projects.research.slice(0, 3).map((p: any) => ({ ...p, type: 'research' }));
  const featuredCoding = projects.coding.slice(0, 3).map((p: any) => ({ ...p, type: 'coding' }));
</script>

<svelte:head>
  <title>Steffen Plunder</title>
  <meta
    name="description"
    content="Steffen Plunder — Mathematician, Computational Biologist, Developer. Program-specific researcher at ASHBi, Kyoto University."
  />
</svelte:head>

<!-- Hero Section -->
<section
  class="relative flex items-center justify-center overflow-hidden"
  style="min-height: 100vh; min-height: 100dvh; background: var(--bg);"
>
  <HeroCanvas />

  <!-- Radial gradient overlay -->
  <div
    class="pointer-events-none absolute inset-0 z-[1]"
    style="background: radial-gradient(ellipse at 50% 40%, transparent 0%, var(--bg) 75%);"
  ></div>

  <div class="relative z-10 mx-auto max-w-3xl px-6 text-center">
    <h1
      class="mb-2 font-display font-bold tracking-tight"
      style="font-size: clamp(2rem, 5vw, 3.5rem); color: var(--text); text-shadow: 0 0 40px var(--accent-glow);"
    >
      Steffen Plunder
    </h1>

    <p
      class="mb-6 text-sm font-medium uppercase tracking-[0.18em]"
      style="color: var(--accent);"
    >
      Mathematician &middot; Computational Biologist &middot; Developer
    </p>

    <p
      class="mx-auto mb-10 max-w-[580px] font-light leading-[1.7]"
      style="font-size: clamp(0.95rem, 1.5vw, 1.1rem); color: var(--text-muted);"
    >
      Program-specific researcher at ASHBi, Kyoto University. I build computational models
      and interactive simulations to understand how cells move, organize, and form living
      structures.
    </p>

    <div class="flex flex-wrap items-center justify-center gap-4">
      <a
        href="mailto:plunder.steffen.2a@kyoto-u.ac.jp"
        class="cta-btn cta-btn--primary"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        Email
      </a>

      <a
        href="https://github.com/SteffenPL"
        target="_blank"
        rel="noopener noreferrer"
        class="cta-btn cta-btn--secondary"
      >
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        GitHub
      </a>

      <a
        href="https://scholar.google.com/citations?user=-QyslKMAAAAJ&hl=en"
        target="_blank"
        rel="noopener noreferrer"
        class="cta-btn cta-btn--secondary"
      >
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 100 14 7 7 0 000-14z" />
        </svg>
        Scholar
      </a>
    </div>
  </div>
</section>

<!-- Projects Section -->
<section class="px-6 py-20">
  <div class="mx-auto max-w-[1100px]">
    <div class="reveal">
      <div class="accent-line"></div>
      <h2
        class="font-display text-[clamp(1.3rem,2.5vw,1.8rem)] font-semibold"
        style="color: var(--text);"
      >
        Projects
      </h2>
      <p class="mb-10 mt-2 text-[0.95rem]" style="color: var(--text-muted);">
        Research and software for computational biology and applied mathematics
      </p>
    </div>

    <div class="projects-grid">
      <div>
        <h3 class="font-display text-sm font-semibold mb-4 uppercase tracking-wider" style="color: var(--accent);">
          Research
        </h3>
        <div class="flex flex-col gap-3">
          {#each featuredResearch as project, i}
            <ProjectCard {project} compact />
          {/each}
        </div>
        <div class="mt-4">
          <a href="/research" class="card-link text-[0.85rem]">
            All research <span class="card-link-arrow">&rarr;</span>
          </a>
        </div>
      </div>

      <div>
        <h3 class="font-display text-sm font-semibold mb-4 uppercase tracking-wider" style="color: var(--accent);">
          Software
        </h3>
        <div class="flex flex-col gap-3">
          {#each featuredCoding as project, i}
            <ProjectCard {project} compact />
          {/each}
        </div>
        <div class="mt-4">
          <a href="/coding" class="card-link text-[0.85rem]">
            All software <span class="card-link-arrow">&rarr;</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Selected Publications Section -->
<section class="px-6 py-20">
  <div class="mx-auto max-w-[1100px]">
    <div class="reveal">
      <div class="accent-line"></div>
      <h2
        class="font-display text-[clamp(1.3rem,2.5vw,1.8rem)] font-semibold"
        style="color: var(--text);"
      >
        Selected Publications
      </h2>
      <p class="mb-12 mt-2 text-[0.95rem]" style="color: var(--text-muted);">
        Selected works in computational biology and applied mathematics
      </p>
    </div>

    <PublicationList ids={[11, 10, 5, 9]} />

    <div class="mt-8 text-center">
      <a href="/publications" class="card-link text-[0.9rem]">
        Complete list <span class="card-link-arrow">&rarr;</span>
      </a>
    </div>
  </div>
</section>

<style>
  /* ─── CTA Buttons ─── */
  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.6rem;
    border-radius: 999px;
    font-family: var(--font-body);
    font-weight: 500;
    font-size: 0.9rem;
    text-decoration: none;
    letter-spacing: 0.02em;
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid var(--bg-card-border);
  }
  .cta-btn--primary {
    background: var(--accent);
    color: #0c1222;
    border-color: var(--accent);
    box-shadow: 0 0 20px var(--accent-glow);
  }
  .cta-btn--primary:hover {
    transform: translateY(-2px) scale(1.04);
    background: var(--accent-secondary);
    border-color: var(--accent-secondary);
    box-shadow: 0 0 36px rgba(52, 211, 153, 0.3), 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  .cta-btn--secondary {
    background: var(--bg-card);
    color: var(--text);
    backdrop-filter: blur(8px);
  }
  .cta-btn--secondary:hover {
    transform: translateY(-2px) scale(1.04);
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
  }

  /* ─── Accent Line ─── */
  .accent-line {
    width: 48px;
    height: 3px;
    background: var(--gradient-accent);
    border-radius: 2px;
    margin-bottom: 1rem;
  }

  /* ─── Card Links ─── */
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

  /* ─── Projects Grid ─── */
  .projects-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  @media (max-width: 720px) {
    .projects-grid {
      grid-template-columns: 1fr;
      gap: 2.5rem;
    }
  }
</style>
