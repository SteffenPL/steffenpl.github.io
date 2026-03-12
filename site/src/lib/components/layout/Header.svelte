<script lang="ts">
	import { page } from '$app/state';
	import ThemeToggle from './ThemeToggle.svelte';
	import type { NavItem } from '$lib/types';

	const nav: NavItem[] = [
		{ name: 'Home', route: '/' },
		{ name: 'Research', route: '/research' },
		{ name: 'Publications', route: '/publications' },
		{ name: 'Blog', route: '/blog' },
		{ name: 'CV', route: '/cv' },
		{ name: 'Talks', route: '/talks' }
	];

	let mobileOpen = $state(false);

	function isActive(route: string): boolean {
		if (route === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(route);
	}
</script>

<header
	class="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-lg"
>
	<div class="mx-auto flex max-w-[var(--max-w-content)] items-center justify-between px-6 py-3">
		<!-- Logo / Name -->
		<a href="/" class="text-lg font-bold tracking-tight text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]">
			Steffen Plunder
		</a>

		<!-- Desktop nav -->
		<nav class="hidden items-center gap-1 md:flex">
			{#each nav as item}
				<a
					href={item.route}
					class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors
						{isActive(item.route)
						? 'bg-accent-500/10 text-accent-600 [html[data-theme=dark]_&]:text-accent-400'
						: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'}"
				>
					{item.name}
				</a>
			{/each}
			<div class="ml-2 border-l border-[var(--color-border)] pl-2">
				<ThemeToggle />
			</div>
		</nav>

		<!-- Mobile controls -->
		<div class="flex items-center gap-2 md:hidden">
			<ThemeToggle />
			<button
				onclick={() => (mobileOpen = !mobileOpen)}
				aria-label="Toggle menu"
				class="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--color-surface-hover)]"
			>
				{#if mobileOpen}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 6 6 18" /><path d="m6 6 12 12" />
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile menu -->
	{#if mobileOpen}
		<nav class="border-t border-[var(--color-border)] px-6 py-3 md:hidden">
			<div class="flex flex-col gap-1">
				{#each nav as item}
					<a
						href={item.route}
						onclick={() => (mobileOpen = false)}
						class="rounded-lg px-3 py-2 text-sm font-medium transition-colors
							{isActive(item.route)
							? 'bg-accent-500/10 text-accent-600'
							: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'}"
					>
						{item.name}
					</a>
				{/each}
			</div>
		</nav>
	{/if}
</header>
