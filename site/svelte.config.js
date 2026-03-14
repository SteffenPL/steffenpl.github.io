import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import { katexPreprocessor } from './src/lib/katex-preprocessor.js';
import { createHighlighter } from 'shiki';
import remarkGfm from 'remark-gfm';

const highlighter = await createHighlighter({
	themes: ['github-dark'],
	langs: ['javascript', 'typescript', 'html', 'css', 'bash', 'python', 'json', 'svelte']
});

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		katexPreprocessor(),
		mdsvex({
			extensions: ['.md'],
			remarkPlugins: [remarkGfm],
			highlight: {
				highlighter: (code, lang) => {
					const html = highlighter.codeToHtml(code, {
						lang: lang || 'text',
						theme: 'github-dark'
					});
					return `{@html \`${html.replace(/`/g, '\\`')}\`}`;
				}
			}
		})
	],
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		}),
		prerender: {
			handleHttpError: 'warn',
			handleMissingId: 'warn'
		}
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) => ({ runes: !filename.includes('node_modules') })
	}
};

export default config;
