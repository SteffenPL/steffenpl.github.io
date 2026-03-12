<script lang="ts">
	let { data } = $props();
	const Content = $derived(data.content);
</script>

<section class="py-20 px-6">
	<div class="mx-auto max-w-[1100px]">
		<article class="prose prose-sm max-w-none" style="color: var(--text);">
			<h1
				class="font-display text-[clamp(1.3rem,2.5vw,1.8rem)] font-semibold"
				style="color: var(--text);"
			>
				{data.meta.title}
			</h1>
			{#if data.meta.date}
				<p class="font-display mt-1 mb-8 text-xs" style="color: var(--text-muted);">
					{data.meta.date}
				</p>
			{/if}
			<Content />
		</article>
	</div>
</section>
