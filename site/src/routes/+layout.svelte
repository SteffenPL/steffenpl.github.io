<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/layout/Nav.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	let { children } = $props();

	let observer: IntersectionObserver;

	function observeReveals() {
		document.querySelectorAll('.reveal:not(.visible)').forEach((el) => observer.observe(el));
	}

	onMount(() => {
		theme.init();

		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
		);
		observeReveals();

		return () => observer.disconnect();
	});

	afterNavigate(() => {
		if (observer) observeReveals();
	});
</script>

<Nav />
<main>
	{@render children()}
</main>
<Footer />
