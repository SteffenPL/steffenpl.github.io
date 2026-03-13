<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let scrolled = $state(false);
	let mobileOpen = $state(false);

	const links = [
		{ href: '/publications', label: 'Publications' },
		{ href: '/blog', label: 'Blog' },
		{ href: '/talks', label: 'Talks' },
		{ href: '/cv', label: 'CV' }
	];

	let currentTheme: string = $state('dark');
	theme.subscribe((v) => (currentTheme = v));

	onMount(() => {
		const onScroll = () => {
			scrolled = window.scrollY > 60;
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	function closeMobile() {
		mobileOpen = false;
	}
</script>

<nav
	class="fixed top-0 left-0 right-0 z-100 flex h-14 items-center justify-between px-6 transition-all duration-300"
	class:scrolled
>
	<a href="/" class="font-display text-[0.95rem] font-semibold tracking-tight no-underline" style="color: var(--text)">
		Steffen Plunder
	</a>

	<ul class="hidden items-center gap-1 md:flex">
		{#each links as link}
			<li>
				<a
					href={link.href}
					class="font-display rounded-md px-3 py-1.5 text-[0.78rem] font-medium no-underline transition-colors duration-200"
					class:nav-active={page.url.pathname.startsWith(link.href)}
					style="color: var(--text-muted)"
				>
					{link.label}
				</a>
			</li>
		{/each}
	</ul>

	<div class="flex items-center gap-2">
		<button
			id="themeToggle"
			onclick={() => theme.toggle()}
			class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors duration-200"
			style="border-color: var(--bg-card-border); background: transparent; color: var(--text-muted)"
			aria-label="Toggle theme"
		>
			{currentTheme === 'dark' ? '☾' : '☀'}
		</button>

		<button
			class="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
			style="background: transparent; border: none; cursor: pointer"
			onclick={() => (mobileOpen = !mobileOpen)}
			aria-label="Menu"
		>
			<span class="hamburger-line" class:open={mobileOpen}></span>
			<span class="hamburger-line" class:open={mobileOpen}></span>
			<span class="hamburger-line" class:open={mobileOpen}></span>
		</button>
	</div>
</nav>

{#if mobileOpen}
	<div class="mobile-menu" onclick={closeMobile} onkeydown={closeMobile} role="presentation">
		{#each links as link}
			<a
				href={link.href}
				class="font-display block rounded-md px-3 py-2.5 text-[0.85rem] font-medium no-underline transition-colors duration-200"
				style="color: var(--text-muted)"
			>
				{link.label}
			</a>
		{/each}
	</div>
{/if}

<style>
	.scrolled {
		background: var(--bg-card);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid var(--bg-card-border);
	}

	nav:not(.scrolled) {
		border-bottom: 1px solid transparent;
	}

	ul a:hover,
	.nav-active {
		color: var(--accent) !important;
		background: rgba(255, 255, 255, 0.05);
	}
	:global([data-theme='light']) ul a:hover,
	:global([data-theme='light']) .nav-active {
		background: rgba(0, 0, 0, 0.04);
	}

	#themeToggle:hover {
		color: var(--accent) !important;
		background: rgba(255, 255, 255, 0.05);
	}
	:global([data-theme='light']) #themeToggle:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	.hamburger-line {
		display: block;
		width: 20px;
		height: 1.5px;
		background: var(--text-muted);
		border-radius: 1px;
		transition: transform 0.3s, opacity 0.3s;
	}
	.hamburger-line.open:nth-child(1) {
		transform: translateY(6.5px) rotate(45deg);
	}
	.hamburger-line.open:nth-child(2) {
		opacity: 0;
	}
	.hamburger-line.open:nth-child(3) {
		transform: translateY(-6.5px) rotate(-45deg);
	}

	.mobile-menu {
		position: fixed;
		top: 56px;
		left: 0;
		right: 0;
		z-index: 99;
		background: var(--bg-card);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-bottom: 1px solid var(--bg-card-border);
		padding: 0.75rem 1.5rem 1rem;
	}
	.mobile-menu a:hover {
		color: var(--accent) !important;
	}
</style>
