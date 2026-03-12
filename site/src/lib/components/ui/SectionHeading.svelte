<script lang="ts">
	let { children, subtitle }: { children: any; subtitle?: string } = $props();
</script>

<div class="mb-8">
	<div class="accent-line"></div>
	<h2
		class="font-mono text-[clamp(1.3rem,2.5vw,1.8rem)] font-semibold text-[var(--color-text-primary)]"
		style="letter-spacing: -0.01em;"
	>
		{@render children()}
	</h2>
	{#if subtitle}
		<p class="mt-2 text-[0.95rem] text-[var(--color-text-muted)]" style="letter-spacing: -0.01em;">
			{subtitle}
		</p>
	{/if}
</div>
