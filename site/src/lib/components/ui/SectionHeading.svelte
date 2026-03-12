<script lang="ts">
	let { children } = $props();
</script>

<h2
	class="mb-6 flex items-center gap-3 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]"
>
	<span
		class="h-px flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent"
	></span>
	{@render children()}
	<span
		class="h-px flex-1 bg-gradient-to-l from-[var(--color-border)] to-transparent"
	></span>
</h2>
