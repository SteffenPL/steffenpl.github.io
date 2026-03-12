<script lang="ts">
	import SectionHeading from '$lib/components/ui/SectionHeading.svelte';

	const posts = [
		{ title: 'My favourite Claude Code skills & MCPs', date: '2026-03-09', slug: '#' },
		{ title: '5 Tips for Using AI in research', date: '2026-02-02', slug: '#' },
		{
			title: 'On the road of clean parameter estimation',
			date: '2024-11-27',
			slug: '#'
		},
		{ title: 'How to chat with LLama3', date: '2024-04-24', slug: '#' },
		{ title: 'Spellchecking in LaTeX with Grammarly', date: '2022-06-14', slug: '#' }
	];

	function formatDate(d: string): string {
		return new Date(d).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<section class="mx-auto max-w-[var(--max-w-content)] px-6 py-12">
	<SectionHeading>Recent Posts</SectionHeading>

	<div class="space-y-1">
		{#each posts as post}
			<a
				href={post.slug}
				class="group flex items-baseline gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--color-surface-hover)]"
			>
				<time
					datetime={post.date}
					class="shrink-0 text-sm tabular-nums text-[var(--color-text-muted)]"
				>
					{formatDate(post.date)}
				</time>
				<span
					class="text-[var(--color-text-primary)] group-hover:text-accent-600 [html[data-theme=dark]_&]:group-hover:text-accent-400"
				>
					{post.title}
				</span>
			</a>
		{/each}
	</div>

	<div class="mt-4 px-3">
		<a href="/blog" class="text-sm font-medium text-accent-600 hover:text-accent-700 [html[data-theme=dark]_&]:text-accent-400">
			View all posts &rarr;
		</a>
	</div>
</section>
