<script lang="ts">
  import cv from '$lib/data/cv.yaml';
</script>

<section class="py-20 px-6">
  <div class="max-w-[1100px] mx-auto">
    <h1 class="font-display font-semibold text-[clamp(1.3rem,2.5vw,1.8rem)]" style="color: var(--text);">
      Curriculum Vitae
    </h1>
    <div class="mt-2 mb-8 h-[3px] w-[48px] rounded-full" style="background: var(--gradient-accent);"></div>

    <div class="flex gap-3 mb-12 flex-wrap">
      <a
        href="/cv.pdf"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-block text-sm font-display font-medium px-4 py-2 rounded-lg border hover:opacity-80 transition-opacity"
        style="color: var(--accent); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent);"
      >
        Detailed CV (PDF)
      </a>
      <a
        href="/cv-one-page.pdf"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-block text-sm font-display font-medium px-4 py-2 rounded-lg border hover:opacity-80 transition-opacity"
        style="color: var(--accent); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent);"
      >
        One-Page CV (PDF)
      </a>
    </div>

    <!-- Current Affiliation -->
    <h2 class="font-display font-semibold text-lg mt-10 mb-4" style="color: var(--text);">
      Current Affiliation
    </h2>
    <div
      class="rounded-xl border backdrop-blur-sm p-5 mb-8"
      style="background: var(--bg-card); border-color: var(--bg-card-border); box-shadow: var(--shadow-card);"
    >
      <p class="text-sm" style="color: var(--text);">
        {cv.affiliation.role}
      </p>
      <p class="text-sm mt-1" style="color: var(--text-muted);">
        <a href={cv.affiliation.url} target="_blank" rel="noopener noreferrer" class="hover:opacity-80" style="color: var(--accent-secondary);">
          {cv.affiliation.institution}
        </a>
        &mdash;
        <a href={cv.affiliation.lab_url} target="_blank" rel="noopener noreferrer" class="hover:opacity-80" style="color: var(--accent-secondary);">
          {cv.affiliation.lab}
        </a>
        (since {cv.affiliation.start})
      </p>
    </div>

    <!-- Education -->
    <h2 class="font-display font-semibold text-lg mt-10 mb-4" style="color: var(--text);">
      Education
    </h2>
    <div class="flex flex-col gap-2 mb-8">
      {#each cv.education as item}
        <div class="flex gap-4 py-2 border-b" style="border-color: var(--bg-card-border);">
          <span class="font-display text-xs shrink-0 tabular-nums w-[140px]" style="color: var(--accent);">
            {item.period}
          </span>
          <span class="text-sm" style="color: var(--text);">
            {item.title}
          </span>
        </div>
      {/each}
    </div>

    <!-- Grants -->
    <h2 class="font-display font-semibold text-lg mt-10 mb-4" style="color: var(--text);">
      Grants &amp; Awards
    </h2>
    <div class="flex flex-col gap-2 mb-8">
      {#each cv.grants as item}
        <div
          class="flex gap-4 py-2 border-b {item.highlight ? 'rounded-lg px-3 -mx-3' : ''}"
          style="border-color: var(--bg-card-border); {item.highlight ? 'background: color-mix(in srgb, var(--accent) 8%, transparent);' : ''}"
        >
          <span class="font-display text-xs shrink-0 tabular-nums w-[140px]" style="color: var(--accent);">
            {item.period}
          </span>
          <span class="text-sm {item.highlight ? 'font-semibold' : ''}" style="color: var(--text);">
            {#if item.url}
              <a href={item.url} target="_blank" rel="noopener noreferrer" class="hover:opacity-80" style="color: var(--accent-secondary);">
                {item.title}
              </a>
            {:else}
              {item.title}
            {/if}
          </span>
        </div>
      {/each}
    </div>

    <!-- Teaching -->
    <h2 class="font-display font-semibold text-lg mt-10 mb-4" style="color: var(--text);">
      Teaching
    </h2>
    <div class="flex flex-col gap-2 mb-8">
      {#each cv.teaching as item}
        <div class="flex gap-4 py-2 border-b" style="border-color: var(--bg-card-border);">
          <span class="font-display text-xs shrink-0 tabular-nums w-[140px]" style="color: var(--accent);">
            {item.period}
          </span>
          <span class="text-sm" style="color: var(--text);">
            {item.title}
          </span>
        </div>
      {/each}
    </div>

    <!-- Software -->
    <h2 class="font-display font-semibold text-lg mt-10 mb-4" style="color: var(--text);">
      Software
    </h2>
    <div class="flex flex-col gap-3 mb-8">
      {#each cv.software as item}
        <div
          class="rounded-xl border backdrop-blur-sm p-4"
          style="background: var(--bg-card); border-color: var(--bg-card-border); box-shadow: var(--shadow-card);"
        >
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm font-display font-semibold hover:opacity-80"
            style="color: var(--accent);"
          >
            {item.name}
          </a>
          <p class="text-xs mt-1" style="color: var(--text-muted);">{item.desc}</p>
        </div>
      {/each}
    </div>

    <!-- Organisation -->
    <h2 class="font-display font-semibold text-lg mt-10 mb-4" style="color: var(--text);">
      Organisation
    </h2>
    <div class="flex flex-col gap-2 mb-8">
      {#each cv.organisation as item}
        <div class="flex gap-4 py-2 border-b" style="border-color: var(--bg-card-border);">
          <span class="font-display text-xs shrink-0 tabular-nums w-[140px]" style="color: var(--accent);">
            {item.period}
          </span>
          <span class="text-sm" style="color: var(--text);">
            {#if item.url}
              <a href={item.url} target="_blank" rel="noopener noreferrer" class="hover:opacity-80" style="color: var(--accent-secondary);">
                {item.title}
              </a>
            {:else}
              {item.title}
            {/if}
          </span>
        </div>
      {/each}
    </div>
  </div>
</section>
