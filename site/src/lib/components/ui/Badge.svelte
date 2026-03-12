<script lang="ts">
	let { children } = $props();
</script>

<span
	class="inline-flex items-center rounded-md bg-accent-500/10 px-2 py-0.5 text-xs font-medium text-accent-700 ring-1 ring-accent-500/20 ring-inset
		[html[data-theme=dark]_&]:text-accent-300"
>
	{@render children()}
</span>
