/**
 * Svelte preprocessor that converts markdown footnote syntax to HTML.
 *
 * Runs BEFORE mdsvex so that footnote markers and definitions are already
 * rendered as HTML when mdsvex sees them.
 *
 * Supports:
 *   - Inline references: [^label]
 *   - Definitions: [^label]: text (single-line, may contain inline code/math/links)
 */
export function footnotePreprocessor() {
	return {
		name: 'footnote-preprocessor',
		markup({ content, filename }) {
			if (!filename?.endsWith('.md')) return;

			// Collect footnote definitions from the raw content (before code splitting)
			// so that inline code inside definitions is captured correctly.
			const definitions = new Map();
			const defLineRegex = /^\[\^([^\]]+)\]:\s*(.+)$/gm;
			for (const m of content.matchAll(defLineRegex)) {
				definitions.set(m[1], m[2].trim());
			}

			// Collect reference order from non-protected regions
			const segments = splitProtectedRegions(content);
			const refOrder = [];

			for (const seg of segments) {
				if (seg.protected) continue;
				for (const m of seg.text.matchAll(/\[\^([^\]]+)\](?!:)/g)) {
					if (!refOrder.includes(m[1])) {
						refOrder.push(m[1]);
					}
				}
			}

			if (refOrder.length === 0) return;

			// Build number map based on order of first reference
			const numberMap = new Map();
			refOrder.forEach((label, i) => numberMap.set(label, i + 1));

			// Remove definition lines and replace references
			// Work on the raw content to handle definitions that span protected regions
			let result = content;

			// Remove definition lines (full lines starting with [^label]:)
			result = result.replace(/^\[\^([^\]]+)\]:\s*(.+)$/gm, '');

			// Replace inline references with superscript links, but not inside code blocks
			const parts = splitProtectedRegions(result);
			result = '';
			for (const seg of parts) {
				if (seg.protected) {
					result += seg.text;
					continue;
				}
				result += seg.text.replace(/\[\^([^\]]+)\](?!:)/g, (_, label) => {
					const n = numberMap.get(label);
					if (n === undefined) return `[^${label}]`;
					return `<sup class="footnote-ref"><a href="#fn-${n}" id="fnref-${n}">${n}</a></sup>`;
				});
			}

			// Append footnotes section
			const items = refOrder
				.map((label, i) => {
					const n = i + 1;
					let text = definitions.get(label) || '';
					// Convert markdown links to HTML since we're inside an HTML block
					text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
					// Convert inline code to HTML
					text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
					return `<li id="fn-${n}">${text} <a href="#fnref-${n}" class="footnote-backref">\u21a9</a></li>`;
				})
				.join('\n');

			result += `\n<aside class="footnotes">\n<ol>\n${items}\n</ol>\n</aside>\n`;

			return { code: result };
		}
	};
}

function splitProtectedRegions(content) {
	const segments = [];
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
