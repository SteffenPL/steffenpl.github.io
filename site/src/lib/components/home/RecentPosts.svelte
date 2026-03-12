<script lang="ts">
	import SectionHeading from '$lib/components/ui/SectionHeading.svelte';

	const posts = [
		{ title: 'My favourite Claude Code skills & MCPs', date: '2026-03-09', slug: '#' },
		{ title: '5 Tips for Using AI in research', date: '2026-02-02', slug: '#' },
		{ title: 'On the road of clean parameter estimation', date: '2024-11-27', slug: '#' },
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

<section class="mx-auto max-w-[var(--max-w-content)] px-6 py-16">
	<SectionHeading subtitle="Notes on research, tools, and ideas">
		Recent Posts
	</SectionHeading>

	<div class="flex flex-col gap-3">
		{#each posts as post}
			<a
				href={post.slug}
				class="glass-card flex items-baseline gap-4 px-5 py-4 no-underline"
			>
				<time
					datetime={post.date}
					class="shrink-0 font-mono text-[0.78rem] tabular-nums text-[var(--color-text-muted)]"
				>
					{formatDate(post.date)}
				</time>
				<span class="text-[0.95rem] font-medium text-[var(--color-text-primary)]"
					style="letter-spacing: -0.01em;"
				>
					{post.title}
				</span>
			</a>
		{/each}
	</div>

	<div class="mt-6">
		<a
			href="/blog"
			class="group/link inline-flex items-center gap-1 text-[0.85rem] font-medium text-accent-500 transition-colors hover:text-secondary-500"
		>
			View all posts
			<span class="transition-transform group-hover/link:translate-x-0.5">&rarr;</span>
		</a>
	</div>
</section>
