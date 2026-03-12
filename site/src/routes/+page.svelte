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
    style="background: radial-gradient(ellipse at center, transparent 30%, var(--bg) 80%);"
  ></div>

  <div class="relative z-10 mx-auto max-w-3xl px-6 text-center">
    <h1
      class="mb-4 font-display font-bold tracking-tight"
      style="font-size: clamp(2rem, 5vw, 3.5rem); color: var(--text);"
    >
      Steffen Plunder
    </h1>

    <p
      class="mb-8 text-sm font-medium uppercase tracking-[0.18em]"
      style="color: var(--accent);"
    >
      Mathematician &middot; Computational Biologist &middot; Developer
    </p>

    <p
      class="mx-auto mb-10 max-w-xl text-base leading-relaxed md:text-lg"
      style="color: var(--text-muted);"
    >
      Program-specific researcher at ASHBi, Kyoto University. I build computational models
      and interactive simulations to understand how cells move, organize, and form living
      structures.
    </p>

    <div class="flex flex-wrap items-center justify-center gap-4">
      <a
        href="mailto:steffen.plunder@ashbi.kyoto-u.ac.jp"
        class="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold transition-all duration-300"
        style="
          background: var(--gradient-accent);
          color: var(--bg);
          box-shadow: 0 0 20px rgba(var(--accent-rgb, 100 200 255) / 0.3);
        "
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Email
      </a>

      <a
        href="https://github.com/SteffenPL"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 rounded-full border px-7 py-3 text-sm font-semibold transition-all duration-300 hover:scale-105"
        style="
          border-color: color-mix(in srgb, var(--text-muted) 30%, transparent);
          color: var(--text-muted);
          background: color-mix(in srgb, var(--bg-card) 60%, transparent);
          backdrop-filter: blur(8px);
        "
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
        class="inline-flex items-center gap-2 rounded-full border px-7 py-3 text-sm font-semibold transition-all duration-300 hover:scale-105"
        style="
          border-color: color-mix(in srgb, var(--text-muted) 30%, transparent);
          color: var(--text-muted);
          background: color-mix(in srgb, var(--bg-card) 60%, transparent);
          backdrop-filter: blur(8px);
        "
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
  <div class="mx-auto max-w-5xl">
    <h2
      class="mb-2 text-center text-sm font-semibold uppercase tracking-[0.15em]"
      style="color: var(--accent);"
    >
      Featured Projects
    </h2>
    <p
      class="mb-12 text-center text-2xl font-bold md:text-3xl"
      style="color: var(--text);"
    >
      Research & Development
    </p>

    <div class="grid gap-6 md:grid-cols-2">
      {#each featuredProjects as project}
        <article
          class="group flex overflow-hidden rounded-2xl border transition-all duration-300"
          style="
            background: color-mix(in srgb, var(--bg-card) 70%, transparent);
            border-color: color-mix(in srgb, var(--text-muted) 12%, transparent);
            backdrop-filter: blur(16px);
            box-shadow: var(--shadow-card);
          "
          onmouseenter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.boxShadow = 'var(--shadow-card-hover)';
            el.style.transform = 'translateY(-2px)';
          }}
          onmouseleave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.boxShadow = 'var(--shadow-card)';
            el.style.transform = 'translateY(0)';
          }}
        >
          <!-- Thumbnail -->
          <div
            class="hidden flex-shrink-0 overflow-hidden sm:flex"
            style="width: 110px; background: color-mix(in srgb, var(--accent) 8%, var(--bg));"
          >
            <img
              src={project.image}
              alt={project.title}
              class="h-full w-full object-cover"
            />
          </div>

          <!-- Content -->
          <div class="flex flex-1 flex-col p-5">
            <h3
              class="mb-1 text-base font-bold leading-snug"
              style="color: var(--text);"
            >
              {project.title}
            </h3>
            <p
              class="mb-3 text-sm leading-relaxed"
              style="color: var(--text-muted);"
            >
              {project.desc}
            </p>

            <!-- Tags -->
            <div class="mb-3 flex flex-wrap gap-2">
              {#each project.tags as tag}
                <span
                  class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style="
                    background: color-mix(in srgb, var(--accent) 12%, transparent);
                    color: var(--accent);
                  "
                >
                  {tag}
                </span>
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
                    class="text-xs font-semibold underline-offset-2 transition-colors hover:underline"
                    style="color: var(--accent-secondary);"
                  >
                    {link.label}
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
<section
  class="px-6 py-20"
  style="background: color-mix(in srgb, var(--bg) 95%, var(--accent));"
>
  <div class="mx-auto max-w-3xl">
    <h2
      class="mb-2 text-center text-sm font-semibold uppercase tracking-[0.15em]"
      style="color: var(--accent);"
    >
      Recent Publications
    </h2>
    <p
      class="mb-12 text-center text-2xl font-bold md:text-3xl"
      style="color: var(--text);"
    >
      Peer-Reviewed Work
    </p>

    <div class="flex flex-col gap-6">
      {#each recentPubs as pub}
        <article
          class="rounded-2xl border p-6 transition-all duration-300"
          style="
            background: color-mix(in srgb, var(--bg-card) 70%, transparent);
            border-color: color-mix(in srgb, var(--text-muted) 12%, transparent);
            backdrop-filter: blur(16px);
            box-shadow: var(--shadow-card);
          "
        >
          <h3
            class="mb-2 text-base font-bold leading-snug"
            style="color: var(--text);"
          >
            {pub.title}
          </h3>

          <p
            class="mb-1 text-sm"
            style="color: var(--text-muted);"
          >
            {formatAuthors(pub.authors)}
          </p>

          {#if pub.journal}
            <p
              class="mb-2 text-sm font-medium italic"
              style="color: var(--accent-secondary);"
            >
              {cleanMarkdown(pub.journal)} {cleanMarkdown(pub.year)}
            </p>
          {/if}

          {#if pub.links && pub.links.length > 0}
            <div class="mt-3 flex flex-wrap gap-3">
              {#each pub.links as link}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-xs font-semibold underline-offset-2 transition-colors hover:underline"
                  style="color: var(--accent);"
                >
                  {link.name}
                </a>
              {/each}
            </div>
          {/if}
        </article>
      {/each}
    </div>
  </div>
</section>
