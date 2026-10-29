<svelte:head>
  <title>Workshop | Steffen Plunder</title>
  <meta name="description" content="Workshop links: game, Paseo, and seminar." />
</svelte:head>

<main class="mx-auto min-h-screen max-w-3xl px-6 pb-20 pt-28">
  <div class="accent-line"></div>
  <h1 class="font-display text-3xl font-semibold" style="color: var(--text);">Workshop</h1>
  <p class="mb-8 mt-2" style="color: var(--text-muted);">A collection of workshop links.</p>

  <ul class="links">
    <li><a href="https://steffenpl-workshop.exe.xyz/" target="_blank" rel="noopener noreferrer">Game <span aria-hidden="true">↗</span></a></li>
    <li><a href="https://app.paseo.sh/#offer=eyJ2IjoyLCJzZXJ2ZXJJZCI6InNydl81ZElYaEVoZXhiTW4iLCJkYWVtb25QdWJsaWNLZXlCNjQiOiJqN0V2dTBYeXlsNU9ieWRJTklhODNhYWFtQkZsNmJpUVUwVkNBVm80NjM0PSIsInJlbGF5Ijp7ImVuZHBvaW50IjoicmVsYXkucGFzZW8uc2g6NDQzIiwidXNlVGxzIjp0cnVlfX0" target="_blank" rel="noopener noreferrer">Paseo <span aria-hidden="true">↗</span></a></li>
    <li><a href="https://steffenpl.github.io/ai-tea-seminar/" target="_blank" rel="noopener noreferrer">Seminar <span aria-hidden="true">↗</span></a></li>
  </ul>
</main>

<style>
  .accent-line { width: 48px; height: 3px; margin-bottom: 1rem; border-radius: 2px; background: var(--gradient-accent); }
  .links { display: grid; gap: 0.75rem; padding: 0; list-style: none; }
  .links a { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border: 1px solid var(--bg-card-border); border-radius: 0.75rem; background: var(--bg-card); color: var(--text); text-decoration: none; transition: border-color 0.2s, transform 0.2s; }
  .links a:hover { border-color: var(--accent); transform: translateY(-2px); }
  .links span { color: var(--accent); }
</style>
