<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import SectionHeading from '$lib/components/ui/SectionHeading.svelte';

	const projects = [
		{
			title: 'Computational model for in vitro limb morphogenesis',
			image: '/projects/limb.png',
			description:
				'Hybrid computational and experimental study on how digit-like structures emerge through mechanical instabilities in organoids.',
			tags: ['agent-based modelling', 'morphogenesis', 'Julia'],
			links: [{ label: 'bioRxiv', url: 'https://doi.org/10.1101/2025.08.31.673315' }]
		},
		{
			title: 'First-order position-based dynamics',
			image: '/projects/pbd.png',
			description:
				'A convergence theory for position-based dynamics as a numerical tool for constrained particle systems and cell migration models.',
			tags: ['numerics', 'convergence theory', 'constraints'],
			links: [{ label: 'arXiv', url: 'https://arxiv.org/abs/2310.01215' }]
		},
		{
			title: 'Epithelial-to-mesenchymal transitions',
			image: '/projects/emt.png',
			description:
				'Modelling variability and heterogeneity of EMT scenarios to identify main drivers of basal extrusion in developmental biology.',
			tags: ['cell migration', 'developmental biology', 'non-smooth dynamics'],
			links: [
				{
					label: 'Nature Comms',
					url: 'https://doi.org/10.1038/s41467-024-51372-z'
				}
			]
		},
		{
			title: 'Cell migration model for plithotaxis',
			image: '/projects/emt.png',
			description:
				'Agent-based model for collective cell migration driven by intercellular stress, exploring plithotaxis as a guidance mechanism.',
			tags: ['cell migration', 'plithotaxis', 'agent-based modelling'],
			links: [
				{
					label: 'Nature Comms',
					url: 'https://doi.org/10.1038/s41467-024-51638-6'
				}
			]
		}
	];
</script>

<section class="mx-auto max-w-[var(--max-w-content)] px-6 py-12">
	<SectionHeading>Featured Projects</SectionHeading>

	<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
		{#each projects as project}
			<article
				class="group flex overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] transition-all hover:border-accent-500/40 hover:shadow-lg hover:shadow-accent-500/5"
			>
				<!-- Square image (1:1) -->
				<div class="w-28 shrink-0 overflow-hidden bg-[var(--color-surface-hover)] md:w-32 aspect-square">
					<img
						src={project.image}
						alt={project.title}
						class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				</div>

				<!-- Content -->
				<div class="flex flex-1 flex-col gap-2 p-4">
					<h3
						class="text-base font-semibold leading-snug text-[var(--color-text-primary)] group-hover:text-accent-600 [html[data-theme=dark]_&]:group-hover:text-accent-400"
					>
						{project.title}
					</h3>
					<p class="flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)] line-clamp-2">
						{project.description}
					</p>
					<div class="flex flex-wrap gap-1.5">
						{#each project.tags as tag}
							<Badge>{tag}</Badge>
						{/each}
					</div>
					{#if project.links.length}
						<div class="flex gap-3 pt-1">
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
