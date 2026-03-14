import katex from 'katex';

/**
 * Svelte preprocessor that renders LaTeX math to HTML before mdsvex processes the file.
 *
 * This runs BEFORE mdsvex in the preprocessor pipeline, so markdown emphasis
 * parsing never sees the underscores/braces inside math delimiters.
 *
 * All { and } in KaTeX's HTML output are replaced with HTML entities to prevent
 * Svelte from parsing them as expressions.
 *
 * Supports:
 *   - Display math: $$ ... $$
 *   - Inline math:  $ ... $
 */
export function katexPreprocessor() {
	return {
		name: 'katex-preprocessor',
		markup({ content, filename }) {
			if (!filename?.endsWith('.md')) return;

			// Split content into protected regions (code blocks, inline code) and text.
			// Only process math in text regions.
			const segments = splitProtectedRegions(content);
			let result = '';

			for (const segment of segments) {
				if (segment.protected) {
					result += segment.text;
				} else {
					result += processmath(segment.text);
				}
			}

			return { code: result };
		}
	};
}

/**
 * Split markdown content into segments, marking fenced code blocks and
 * inline code as protected (not to be processed for math).
 */
function splitProtectedRegions(content) {
	const segments = [];
	// Match fenced code blocks (``` ... ```), inline code (` ... `), and <script> blocks
	const codeRegex = /```[\s\S]*?```|`[^`\n]+`|<script[\s\S]*?<\/script>/g;
	let lastIndex = 0;
	let match;

	while ((match = codeRegex.exec(content)) !== null) {
		if (match.index > lastIndex) {
			segments.push({ text: content.slice(lastIndex, match.index), protected: false });
		}
		segments.push({ text: match[0], protected: true });
		lastIndex = match.index + match[0].length;
	}

	if (lastIndex < content.length) {
		segments.push({ text: content.slice(lastIndex), protected: false });
	}

	return segments;
}

/** Process math delimiters in a text segment. */
function processmath(text) {
	// Render display math: $$...$$
	let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
		try {
			const html = katex.renderToString(math.trim(), {
				displayMode: true,
				throwOnError: false,
				output: 'html'
			});
			return `<div class="katex-display">${escapeBraces(html)}</div>`;
		} catch {
			return `<div class="katex-display katex-error">${escapeBraces(math.trim())}</div>`;
		}
	});

	// Render inline math: $...$
	// Negative lookbehind/ahead for $ to avoid matching $$
	// Don't match across newlines for inline math
	result = result.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g, (_, math) => {
		try {
			const html = katex.renderToString(math.trim(), {
				displayMode: false,
				throwOnError: false,
				output: 'html'
			});
			return escapeBraces(html);
		} catch {
			return `<span class="katex-error">${escapeBraces(math.trim())}</span>`;
		}
	});

	return result;
}

/** Replace { and } with HTML entities so Svelte doesn't parse them as expressions. */
function escapeBraces(html) {
	return html.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
}
