import type { PageLoad } from './$types';

const modules = import.meta.glob('/src/content/blog/*.md');

export const load: PageLoad = async ({ params }) => {
	const match = modules[`/src/content/blog/${params.slug}.md`];
	if (!match) {
		throw new Error(`Post not found: ${params.slug}`);
	}
	const post = (await match()) as { default: any; metadata: Record<string, string> };
	return {
		content: post.default,
		meta: post.metadata
	};
};
