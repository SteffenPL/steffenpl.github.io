import { writable } from 'svelte/store';
import type { Theme } from '$lib/types';

function createThemeStore() {
	const { subscribe, set } = writable<Theme>('dark');

	return {
		subscribe,
		init() {
			if (typeof window === 'undefined') return;
			const stored = localStorage.getItem('theme') as Theme | null;
			const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light';
			const theme = stored ?? preferred;
			set(theme);
			document.documentElement.setAttribute('data-theme', theme);
		},
		toggle() {
			if (typeof window === 'undefined') return;
			const current = document.documentElement.getAttribute('data-theme') as Theme;
			const next = current === 'dark' ? 'light' : 'dark';

			const apply = () => {
				set(next);
				document.documentElement.setAttribute('data-theme', next);
				localStorage.setItem('theme', next);
			};

			// Circular wipe via View Transitions API
			if (document.startViewTransition) {
				const toggle = document.getElementById('themeToggle');
				if (toggle) {
					const rect = toggle.getBoundingClientRect();
					const x = ((rect.left + rect.width / 2) / window.innerWidth * 100).toFixed(1);
					const y = ((rect.top + rect.height / 2) / window.innerHeight * 100).toFixed(1);
					document.documentElement.style.setProperty('--toggle-x', x + '%');
					document.documentElement.style.setProperty('--toggle-y', y + '%');
				}
				document.startViewTransition(apply);
			} else {
				apply();
			}
		}
	};
}

export const theme = createThemeStore();
