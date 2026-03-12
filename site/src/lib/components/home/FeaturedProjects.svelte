<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import SectionHeading from '$lib/components/ui/SectionHeading.svelte';

	const projects = [
		{
			title: 'Computational model for in vitro limb morphogenesis',
			description:
				'Hybrid computational and experimental study on how digit-like structures emerge through mechanical instabilities in organoids.',
			tags: ['agent-based modelling', 'morphogenesis', 'Julia'],
			links: [{ label: 'bioRxiv', url: 'https://doi.org/10.1101/2025.08.31.673315' }]
		},
		{
			title: 'First-order position-based dynamics',
			description:
				'A convergence theory for position-based dynamics as a numerical tool for constrained particle systems and cell migration models.',
			tags: ['numerics', 'convergence theory', 'constraints'],
			links: [{ label: 'arXiv', url: 'https://arxiv.org/abs/2310.01215' }]
		},
		{
			title: 'Epithelial-to-mesenchymal transitions',
			description:
				'Modelling variability and heterogeneity of EMT scenarios to identify main drivers of basal extrusion in developmental biology.',
			tags: ['cell migration', 'developmental biology', 'non-smooth dynamics'],
			links: [
				{
					label: 'Nature Comms',
					url: 'https://doi.org/10.1038/s41467-024-51372-z'
				}
			]
		}
	];
</script>

<section class="mx-auto max-w-[var(--max-w-content)] px-6 py-12">
	<SectionHeading>Featured Projects</SectionHeading>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each projects as project}
			<article
				class="group flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] transition-all hover:border-accent-500/40 hover:shadow-lg hover:shadow-accent-500/5"
			>
				<div class="flex flex-1 flex-col gap-3 p-5">
					<h3
						class="text-lg font-semibold leading-snug text-[var(--color-text-primary)] group-hover:text-accent-600 [html[data-theme=dark]_&]:group-hover:text-accent-400"
					>
						{project.title}
					</h3>
					<p class="flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
						{project.description}
					</p>
					<div class="flex flex-wrap gap-1.5">
						{#each project.tags as tag}
							<Badge>{tag}</Badge>
						{/each}
					</div>
					{#if project.links.length}
						<div class="mt-auto flex gap-3 border-t border-[var(--color-border-subtle)] pt-3">
							{#each project.links as link}
								<a
									href={link.url}
									target="_blank"
									rel="noopener"
									class="text-sm font-medium text-accent-600 hover:text-accent-700 [html[data-theme=dark]_&]:text-accent-400 [html[data-theme=dark]_&]:hover:text-accent-300"
								>
									{link.label} &rarr;
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</article>
		{/each}
	</div>
</section>
