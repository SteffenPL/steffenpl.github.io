<script lang="ts">
  import type { Publication } from '$lib/types/index.js';

  interface Props {
    pub: Publication;
    animationDelay?: string;
  }

  let { pub, animationDelay = '0s' }: Props = $props();

  function cleanYear(year: string): string {
    return year.replace(/\*\*/g, '').replace(/[()]/g, '');
  }
</script>

<article class="pub-card" style="transition-delay: {animationDelay};">
  <span class="pub-year">{cleanYear(pub.year)}</span>

  <div class="pub-body">
    <h3 class="pub-title">{pub.title}</h3>

    <p class="pub-authors">
      {#each pub.authors as author, i}
        {#if i > 0}<span>, </span>{/if}
        {#if author.name === 'S. Plunder'}
          <strong class="author-self">{author.name}</strong>
        {:else if author.url}
          <a
            href={author.url}
            target="_blank"
            rel="noopener noreferrer"
            class="author-link"
          >{author.name}</a>
        {:else}
          <span>{author.name}</span>
        {/if}
      {/each}
    </p>

    {#if pub.journal}
      <p class="pub-journal">{@html pub.journal}</p>
    {/if}

    {#if pub.links?.length}
      <div class="pub-links">
        {#each pub.links as link}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            class="pub-link"
          >{link.name} <span class="pub-link-arrow">→</span></a>
        {/each}
      </div>
    {/if}
  </div>
</article>

<style>
  .pub-card {
    background: var(--bg-card);
    border: 1px solid var(--bg-card-border);
    border-radius: 14px;
    padding: 1.25rem 1.5rem;
    backdrop-filter: blur(16px);
    box-shadow: var(--shadow-card);
    display: flex;
    gap: 1.25rem;
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
    font-size: 1rem;
    color: var(--accent);
    flex-shrink: 0;
    min-width: 44px;
    line-height: 1.4;
    padding-top: 0.1rem;
  }

  .pub-body {
    flex: 1;
    min-width: 0;
  }

  .pub-title {
    font-size: 0.93rem;
    font-weight: 600;
    line-height: 1.45;
    color: var(--text);
    margin: 0 0 0.35rem;
  }

  .pub-authors {
    font-size: 0.82rem;
    line-height: 1.5;
    color: var(--text-muted);
    margin: 0 0 0.25rem;
  }

  .author-self {
    color: var(--text);
    font-weight: 700;
  }

  .author-link {
    color: var(--accent);
    text-decoration: underline;
    text-decoration-style: dotted;
    text-underline-offset: 2px;
    transition: color 0.2s;
  }
  .author-link:hover {
    color: var(--accent-secondary);
  }

  .pub-journal {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--accent-secondary);
    margin: 0 0 0.35rem;
  }

  .pub-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.4rem;
  }

  .pub-link {
    color: var(--accent);
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 500;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    transition: color 0.2s, gap 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .pub-link:hover {
    color: var(--accent-secondary);
    gap: 0.4rem;
  }
  .pub-link-arrow {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .pub-link:hover .pub-link-arrow {
    transform: translateX(2px);
  }

  @media (max-width: 720px) {
    .pub-card {
      flex-direction: column;
      gap: 0.4rem;
    }
    .pub-year {
      font-size: 0.9rem;
      min-width: unset;
    }
  }
</style>
