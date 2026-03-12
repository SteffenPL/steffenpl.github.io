<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import ThemeToggle from './ThemeToggle.svelte';
	import type { NavItem } from '$lib/types';

	const nav: NavItem[] = [
		{ name: 'Projects', route: '/research' },
		{ name: 'Publications', route: '/publications' },
		{ name: 'Blog', route: '/blog' },
		{ name: 'Talks', route: '/talks' },
		{ name: 'CV', route: '/cv' }
	];

	let mobileOpen = $state(false);
	let scrolled = $state(false);

	onMount(() => {
		const onScroll = () => {
			scrolled = window.scrollY > 60;
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	function isActive(route: string): boolean {
		if (route === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(route);
	}
</script>

<header
	class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
	class:scrolled
	style="
		background: {scrolled ? 'var(--color-surface-elevated)' : 'transparent'};
		backdrop-filter: {scrolled ? 'blur(16px)' : 'none'};
		-webkit-backdrop-filter: {scrolled ? 'blur(16px)' : 'none'};
		border-bottom: 1px solid {scrolled ? 'var(--color-card-border)' : 'transparent'};
	"
>
	<div class="mx-auto flex max-w-[var(--max-w-content)] items-center justify-between px-6" style="height: 56px;">
		<!-- Logo -->
		<a
			href="/"
			class="font-mono text-[0.95rem] font-semibold tracking-tight text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]"
			style="letter-spacing: -0.02em;"
		>
			Steffen Plunder
		</a>

		<!-- Desktop nav -->
		<div class="hidden items-center gap-1 md:flex">
			<nav class="flex items-center gap-0.5">
				{#each nav as item}
					<a
						href={item.route}
						class="rounded-md px-3 py-1.5 font-mono text-[0.78rem] font-medium transition-colors"
						style="letter-spacing: -0.01em;"
						class:text-accent-500={isActive(item.route)}
						class:text-[var(--color-text-muted)]={!isActive(item.route)}
					>
						{item.name}
					</a>
				{/each}
			</nav>
			<div class="ml-2">
				<ThemeToggle />
			</div>
		</div>

		<!-- Mobile controls -->
		<div class="flex items-center gap-2 md:hidden">
			<ThemeToggle />
			<button
				onclick={() => (mobileOpen = !mobileOpen)}
				aria-label="Toggle menu"
				class="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-lg"
			>
				{#if mobileOpen}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 6 6 18" /><path d="m6 6 12 12" />
					</svg>
				{:else}
					<span class="block h-[1.5px] w-5 rounded-sm bg-[var(--color-text-muted)]"></span>
					<span class="block h-[1.5px] w-5 rounded-sm bg-[var(--color-text-muted)]"></span>
					<span class="block h-[1.5px] w-5 rounded-sm bg-[var(--color-text-muted)]"></span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile menu -->
	{#if mobileOpen}
		<nav
			class="px-6 py-3 md:hidden"
			style="
				background: var(--color-surface-elevated);
				backdrop-filter: blur(20px);
				-webkit-backdrop-filter: blur(20px);
				border-bottom: 1px solid var(--color-card-border);
			"
		>
			<div class="flex flex-col gap-1">
				{#each nav as item}
					<a
						href={item.route}
						onclick={() => (mobileOpen = false)}
						class="rounded-md px-3 py-2 font-mono text-[0.85rem] font-medium transition-colors"
						class:text-accent-500={isActive(item.route)}
						class:text-[var(--color-text-muted)]={!isActive(item.route)}
					>
						{item.name}
					</a>
				{/each}
			</div>
		</nav>
	{/if}
</header>
