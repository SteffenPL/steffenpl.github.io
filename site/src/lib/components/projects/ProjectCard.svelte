<script lang="ts">
  import type { Project } from '$lib/types/index.js';
  import publications from '$lib/data/publications.yaml';

  interface Props {
    project: Project;
    compact?: boolean;
  }

  let { project, compact = false }: Props = $props();

  const allPubs = [
    ...(publications.peer_reviewed || []),
    ...(publications.preprints || []),
  ];

  const journalAbbrev: Record<string, string> = {
    'Nature Materials [accepted]': 'NatMat',
    'Nature Physics [accepted]': 'NatPhys',
    'Nature Communications': 'NatComms',
    'iScience': 'iScience',
    'Mathematical Models and Methods in Applied Sciences': 'M3AS',
    'Proceedings in Applied Mathematics & Mechanics': 'PAMM',
    'Current Protocols': 'CurrProt',
    'Kinetic and Related Models': 'KRM',
    'Frontiers of Medicine': 'FrontMed',
  };

  function abbreviate(journal: string): string {
    return journalAbbrev[journal] || journal;
  }

  interface Ref {
    label: string;
    href: string;
  }

  const refs = $derived(
    project.publications
      .map((slug) => allPubs.find((p: any) => p.slug === slug))
      .filter((p): p is any => !!p)
      .map((p): Ref => {
        const label = p.journal ? abbreviate(p.journal) : (p.links?.[0]?.name || 'Paper');
        return { label, href: `/publications#${p.slug}` };
      })
  );

  const hasCodeLinks = $derived(project.repos.length > 0 || project.blogs.length > 0 || project.links.length > 0);
</script>

{#if compact}
  <a href="/{project.type === 'research' ? 'research' : 'coding'}" class="compact-card">
    <div class="compact-thumb">
      <img src={project.image} alt={project.title} />
    </div>
    <div class="compact-body">
      <h3 class="compact-title">{project.title}</h3>
      <p class="compact-desc">{project.desc}</p>
      <div class="compact-tags">
        {#each project.tags.slice(0, 3) as tag}
          <span class="tag">{tag}</span>
        {/each}
      </div>
      {#if hasCodeLinks}
        <div class="link-row">
          {#each project.repos.slice(0, 1) as repo}
            <span class="link-item" onclick={(e) => e.stopPropagation()}>
              <a href={repo.url} target="_blank" rel="noopener noreferrer" class="card-link">Code <span class="arrow">→</span></a>
            </span>
          {/each}
          {#each project.links.slice(0, 1) as link}
            <span class="link-item" onclick={(e) => e.stopPropagation()}>
              <a href={link.url} target="_blank" rel="noopener noreferrer" class="card-link">{link.label} <span class="arrow">→</span></a>
            </span>
          {/each}
        </div>
      {/if}
      {#if refs.length > 0}
        <div class="link-row">
          {#each refs.slice(0, 2) as ref}
            <span class="link-item" onclick={(e) => e.stopPropagation()}>
              <a href={ref.href} class="ref-link">{ref.label}</a>
            </span>
          {/each}
        </div>
      {/if}
    </div>
  </a>
{:else}
  <a href="/{project.type === 'research' ? 'research' : 'coding'}" class="full-card">
    <div class="full-thumb">
      <img src={project.image} alt={project.title} />
    </div>
    <div class="full-body">
      <div class="full-header">
        <h3 class="full-title">{project.title}</h3>
        <span class="full-year">{project.year}{project.end ? `–${project.end}` : ''}</span>
      </div>
      <p class="full-desc">{project.desc}</p>
      <div class="full-tags">
        {#each project.tags as tag}
          <span class="tag">{tag}</span>
        {/each}
      </div>
      {#if hasCodeLinks}
        <div class="link-row">
          {#each project.repos as repo}
            <span class="link-item" onclick={(e) => e.stopPropagation()}>
              <a href={repo.url} target="_blank" rel="noopener noreferrer" class="card-link">{repo.label} <span class="arrow">→</span></a>
            </span>
          {/each}
          {#each project.blogs as slug}
            <span class="link-item" onclick={(e) => e.stopPropagation()}>
              <a href="/blog/{slug}" class="card-link">Blog <span class="arrow">→</span></a>
            </span>
          {/each}
          {#each project.links as link}
            <span class="link-item" onclick={(e) => e.stopPropagation()}>
              <a href={link.url} target="_blank" rel="noopener noreferrer" class="card-link">{link.label} <span class="arrow">→</span></a>
            </span>
          {/each}
        </div>
      {/if}
      {#if refs.length > 0}
        <div class="link-row">
          {#each refs as ref}
            <span class="link-item" onclick={(e) => e.stopPropagation()}>
              <a href={ref.href} class="ref-link">{ref.label}</a>
            </span>
          {/each}
        </div>
      {/if}
    </div>
  </a>
{/if}

<style>
  /* ─── Shared ─── */
  .tag {
    font-size: 0.65rem;
    font-weight: 500;
    padding: 0.15rem 0.5rem;
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

  .link-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    align-items: center;
  }

  .card-link {
    color: var(--accent);
    font-size: 0.75rem;
    font-family: var(--font-display);
    font-weight: 500;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    transition: color 0.2s, gap 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .card-link:hover {
    color: var(--accent-secondary);
    gap: 0.4rem;
  }
  .arrow {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .card-link:hover .arrow {
    transform: translateX(2px);
  }

  .ref-link {
    color: var(--accent-secondary);
    font-size: 0.72rem;
    font-family: var(--font-display);
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;
  }
  .ref-link:hover {
    color: var(--accent);
  }

  /* ─── Compact Card (hero page) ─── */
  .compact-card {
    background: var(--bg-card);
    border: 1px solid var(--bg-card-border);
    border-radius: 12px;
    backdrop-filter: blur(16px);
    box-shadow: var(--shadow-card);
    display: flex;
    gap: 0.85rem;
    padding: 0.75rem;
    text-decoration: none;
    color: inherit;
    position: relative;
    overflow: hidden;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s;
  }
  .compact-card::before {
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
  .compact-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-card-hover);
  }
  .compact-card:hover::before {
    opacity: 1;
  }

  .compact-thumb {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    flex-shrink: 0;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.04);
  }
  .compact-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .compact-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .compact-title {
    font-size: 0.82rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--text);
    margin: 0;
  }

  .compact-desc {
    font-size: 0.72rem;
    line-height: 1.4;
    color: var(--text-muted);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .compact-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  /* ─── Full Card (project listing pages) ─── */
  .full-card {
    background: var(--bg-card);
    border: 1px solid var(--bg-card-border);
    border-radius: 14px;
    backdrop-filter: blur(16px);
    box-shadow: var(--shadow-card);
    display: flex;
    gap: 1.25rem;
    padding: 1.25rem;
    text-decoration: none;
    color: inherit;
    position: relative;
    overflow: hidden;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s;
  }
  .full-card::before {
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
  .full-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-card-hover);
  }
  .full-card:hover::before {
    opacity: 1;
  }

  .full-thumb {
    width: 120px;
    height: 120px;
    border-radius: 10px;
    flex-shrink: 0;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.04);
  }
  .full-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .full-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .full-header {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }

  .full-title {
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.35;
    color: var(--text);
    margin: 0;
    flex: 1;
  }

  .full-year {
    font-family: var(--font-display);
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--accent);
    flex-shrink: 0;
  }

  .full-desc {
    font-size: 0.82rem;
    line-height: 1.5;
    color: var(--text-muted);
    margin: 0;
  }

  .full-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  /* ─── Responsive ─── */
  @media (max-width: 720px) {
    .full-card {
      flex-direction: column;
      gap: 0.75rem;
    }
    .full-thumb {
      width: 100%;
      height: 140px;
    }
    .compact-thumb {
      width: 52px;
      height: 52px;
    }
  }
</style>
