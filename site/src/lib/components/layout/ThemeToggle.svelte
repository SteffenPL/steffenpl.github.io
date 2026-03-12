<script lang="ts">
	import { theme } from '$lib/stores/theme';
</script>

<button
	onclick={() => theme.toggle()}
	aria-label="Toggle dark mode"
	class="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-card-border)] text-[var(--color-text-muted)] transition-colors hover:text-accent-500"
	style="background: transparent;"
>
	{#if $theme === 'dark'}
		<span style="font-size: 1rem;">&#9728;</span>
	{:else}
		<span style="font-size: 1rem;">&#9790;</span>
	{/if}
</button>
