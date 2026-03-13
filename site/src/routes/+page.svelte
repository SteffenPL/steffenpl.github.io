<script lang="ts">
  import HeroCanvas from '$lib/components/home/HeroCanvas.svelte';
  import projects from '$lib/data/projects.yaml';
  import publications from '$lib/data/publications.yaml';

  interface Project {
    slug: string;
    title: string;
    desc: string;
    image: string;
    tags: string[];
    status: string;
    start: string;
    end?: string;
    publications: number[];
    links: { label: string; url: string }[];
    blog?: string;
  }

  interface Author {
    name: string;
    url?: string;
  }

  interface Publication {
    id: number;
    title: string;
    year: string;
    authors: Author[];
    journal?: string;
    links: { name: string; url: string }[];
  }

  const featuredProjects: Project[] = (projects as Project[]).slice(0, 4);

  const recentPubs: Publication[] = (publications as { peer_reviewed: Publication[] }).peer_reviewed.slice(0, 3);

  function formatAuthors(authors: Author[]): string {
    return authors.map((a) => a.name).join(', ');
  }

  function cleanMarkdown(text: string): string {
    return text.replace(/\*\*/g, '');
  }
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
        href="mailto:steffen.plunder@ashbi.kyoto-u.ac.jp"
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
        href="https://scholar.google.com/citations?user=GOOGLE_SCHOLAR_ID"
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

<!-- Featured Projects Section -->
<section class="px-6 py-20" style="background: var(--bg);">
  <div class="mx-auto max-w-[1100px]">
    <div class="reveal">
      <div class="accent-line"></div>
      <h2
        class="font-display text-[clamp(1.3rem,2.5vw,1.8rem)] font-semibold"
        style="color: var(--text);"
      >
        Featured Projects
      </h2>
      <p class="mb-12 mt-2 text-[0.95rem]" style="color: var(--text-muted);">
        Computational models and tools for understanding living systems
      </p>
    </div>

    <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
      {#each featuredProjects as project, i}
        <article
          class="card reveal"
          style="transition-delay: {(i + 1) * 0.05}s;"
        >
          <!-- Thumbnail -->
          {#if project.image}
            <div class="card-thumb">
              <img
                src={project.image}
                alt={project.title}
                class="h-full w-full rounded-[10px] object-cover"
              />
            </div>
          {:else}
            <div class="card-thumb card-thumb--placeholder">thumbnail</div>
          {/if}

          <!-- Content -->
          <div class="flex flex-1 flex-col">
            <h3
              class="mb-1 text-[0.95rem] font-semibold leading-snug"
              style="color: var(--text);"
            >
              {project.title}
            </h3>
            <p
              class="mb-2 text-[0.82rem] leading-relaxed"
              style="color: var(--text-muted);"
            >
              {project.desc}
            </p>

            <!-- Tags -->
            <div class="mb-2 flex flex-wrap gap-1">
              {#each project.tags as tag}
                <span class="tag">{tag}</span>
              {/each}
            </div>

            <!-- Links -->
            {#if project.links && project.links.length > 0}
              <div class="mt-auto flex flex-wrap gap-3">
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
        </article>
      {/each}
    </div>
  </div>
</section>

<!-- Recent Publications Section -->
<section class="px-6 py-20">
  <div class="mx-auto max-w-[1100px]">
    <div class="reveal">
      <div class="accent-line"></div>
      <h2
        class="font-display text-[clamp(1.3rem,2.5vw,1.8rem)] font-semibold"
        style="color: var(--text);"
      >
        Recent Publications
      </h2>
      <p class="mb-12 mt-2 text-[0.95rem]" style="color: var(--text-muted);">
        Selected works in computational biology and applied mathematics
      </p>
    </div>

    <div class="flex flex-col gap-5">
      {#each recentPubs as pub, i}
        <article
          class="pub-card reveal"
          style="transition-delay: {(i + 1) * 0.07}s;"
        >
          <span class="pub-year">{cleanMarkdown(pub.year)}</span>
          <div class="flex-1">
            <h3
              class="mb-1 text-[0.95rem] font-semibold leading-snug"
              style="color: var(--text);"
            >
              {pub.title}
            </h3>

            <p class="mb-1 text-[0.85rem]" style="color: var(--text-muted);">
              {formatAuthors(pub.authors)}
            </p>

            {#if pub.journal}
              <p class="mb-2 text-[0.85rem] italic" style="color: var(--text-muted);">
                {cleanMarkdown(pub.journal)}
              </p>
            {/if}

            {#if pub.links && pub.links.length > 0}
              <div class="flex flex-wrap gap-3">
                {#each pub.links as link}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="card-link"
                  >
                    {link.name} <span class="card-link-arrow">&rarr;</span>
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        </article>
      {/each}
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

  /* ─── Project Cards ─── */
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
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent), transparent);
    opacity: 0;
    transition: opacity 0.4s;
  }
  .card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-card-hover);
  }
  .card:hover::before {
    opacity: 1;
  }

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
  .card-thumb--placeholder {
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(52, 211, 153, 0.15));
    font-family: var(--font-display);
    font-size: 0.65rem;
    color: var(--text-muted);
    text-align: center;
    padding: 0.5rem;
  }
  :global([data-theme='light']) .card-thumb--placeholder {
    background: linear-gradient(135deg, rgba(101, 163, 13, 0.15), rgba(249, 115, 22, 0.15));
  }

  /* ─── Tags ─── */
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

  /* ─── Publication Cards ─── */
  .pub-card {
    background: var(--bg-card);
    border: 1px solid var(--bg-card-border);
    border-radius: 14px;
    padding: 1.5rem 1.75rem;
    backdrop-filter: blur(16px);
    box-shadow: var(--shadow-card);
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s;
  }
  .pub-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-card-hover);
  }

  .pub-year {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.3rem;
    color: var(--accent);
    flex-shrink: 0;
    min-width: 55px;
    line-height: 1.2;
  }

  /* ─── Responsive ─── */
  @media (max-width: 720px) {
    .card-thumb {
      display: none;
    }
    .pub-card {
      flex-direction: column;
      gap: 0.5rem;
    }
    .pub-year {
      font-size: 1.1rem;
      min-width: unset;
    }
  }
</style>
