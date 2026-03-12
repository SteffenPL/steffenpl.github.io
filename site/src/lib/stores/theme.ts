import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

function createThemeStore() {
	const initial: Theme = browser
		? ((localStorage.getItem('theme') as Theme) ??
				(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
		: 'light';

	const { subscribe, set, update } = writable<Theme>(initial);

	return {
		subscribe,
		toggle() {
			update((t) => {
				const next: Theme = t === 'light' ? 'dark' : 'light';
				if (browser) {
					localStorage.setItem('theme', next);
					document.documentElement.setAttribute('data-theme', next);
				}
				return next;
			});
		},
		init() {
			if (!browser) return;
			const saved = localStorage.getItem('theme') as Theme | null;
			const preferred: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light';
			const theme = saved ?? preferred;
			set(theme);
			document.documentElement.setAttribute('data-theme', theme);
		}
	};
}

export const theme = createThemeStore();
