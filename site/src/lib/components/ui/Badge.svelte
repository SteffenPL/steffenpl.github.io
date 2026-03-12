<script lang="ts">
	let { children } = $props();
</script>

<span
	class="inline-flex items-center rounded-full border border-accent-500/15 bg-accent-500/8 px-2.5 py-0.5 text-[0.68rem] font-medium tracking-wide text-accent-500"
>
	{@render children()}
</span>
