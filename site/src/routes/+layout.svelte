<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/layout/Nav.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		theme.init();

		const reveals = document.querySelectorAll('.reveal');
		const observer = new IntersectionObserver(
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
		reveals.forEach((el) => observer.observe(el));

		return () => observer.disconnect();
	});
</script>

<Nav />
<main>
	{@render children()}
</main>
<Footer />
