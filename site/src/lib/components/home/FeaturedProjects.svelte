<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import SectionHeading from '$lib/components/ui/SectionHeading.svelte';

	const projects = [
		{
			title: 'Computational model for in vitro limb morphogenesis',
			image: '/projects/limb.png',
			description:
				'Agent-based simulation capturing self-organization of mesenchymal cells into digit-like structures.',
			tags: ['Julia', 'Agent-based models', 'Dev. Biology'],
			links: [
				{ label: 'Paper', url: 'https://doi.org/10.1101/2025.08.31.673315' },
				{ label: 'Code', url: 'https://github.com/SteffenPL' }
			]
		},
		{
			title: 'First-order position-based dynamics',
			image: '/projects/pbd.png',
			description:
				'A framework for overdamped particle dynamics with constraints for simulating soft biological matter.',
			tags: ['Julia', 'Particle dynamics', 'Soft matter'],
			links: [
				{ label: 'Paper', url: 'https://arxiv.org/abs/2310.01215' },
				{ label: 'Code', url: 'https://github.com/SteffenPL' }
			]
		},
		{
			title: 'Epithelial-to-mesenchymal transitions',
			image: '/projects/emt.png',
			description:
				'Modeling the transition of epithelial cells to a migratory mesenchymal state in cancer and wound healing.',
			tags: ['Python', 'Cell migration', 'Cancer biology'],
			links: [
				{ label: 'Paper', url: 'https://doi.org/10.1038/s41467-024-51372-z' }
			]
		},
		{
			title: 'Cell migration model for plithotaxis',
			image: '/projects/emt.png',
			description:
				'How cells collectively migrate guided by intercellular stress patterns and mechanical forces.',
			tags: ['Julia', 'Collective migration'],
			links: [
				{ label: 'Paper', url: 'https://doi.org/10.1038/s41467-024-51638-6' },
				{ label: 'Code', url: 'https://github.com/SteffenPL' }
			]
		}
	];
</script>

<section class="mx-auto max-w-[var(--max-w-content)] px-6 py-16">
	<SectionHeading subtitle="Computational models and tools for understanding living systems">
		Featured Projects
	</SectionHeading>

	<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
		{#each projects as project}
			<div class="glass-card flex gap-4 p-4">
				<!-- Square thumbnail -->
				<div class="aspect-square w-[110px] shrink-0 overflow-hidden rounded-[10px] bg-[var(--color-surface-hover)]">
					<img
						src={project.image}
						alt={project.title}
						class="h-full w-full object-cover"
					/>
				</div>

				<!-- Content -->
				<div class="flex min-w-0 flex-1 flex-col">
					<h3
						class="mb-1 text-[0.95rem] font-semibold leading-snug text-[var(--color-text-primary)]"
						style="letter-spacing: -0.01em;"
					>
						{project.title}
					</h3>
					<p class="mb-2 text-[0.82rem] leading-relaxed text-[var(--color-text-muted)] line-clamp-2"
						style="letter-spacing: -0.01em;"
					>
						{project.description}
					</p>
					<div class="mb-2 flex flex-wrap gap-1.5">
						{#each project.tags as tag}
							<Badge>{tag}</Badge>
						{/each}
					</div>
					<div class="mt-auto flex flex-wrap gap-3">
						{#each project.links as link}
							<a
								href={link.url}
								target="_blank"
								rel="noopener"
								class="group/link inline-flex items-center gap-1 text-[0.78rem] font-medium text-accent-500 transition-colors hover:text-secondary-500"
							>
								{link.label}
								<span class="transition-transform group-hover/link:translate-x-0.5">&rarr;</span>
							</a>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>
