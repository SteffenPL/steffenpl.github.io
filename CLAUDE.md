# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This project uses beads 'bd'.

## Project Overview

Personal academic webpage built with the TEA stack (TailwindCSS, Eleventy, Alpine.js). Static site generator that builds markdown content into HTML pages with math support, code highlighting, and interactive simulators.

## Build Commands

**Development:**
```bash
npm run dev          # Start dev server with live reload (parallel: 11ty, CSS, JS)
npm run dev:11ty     # Eleventy dev server only
npm run dev:css      # TailwindCSS watch mode only
npm run dev:js       # ESBuild bundle only
```

**Production:**
```bash
npm run build        # Production build (minified CSS/JS, optimized HTML)
npm run clean        # Remove dist/ folder
```

**Preview Production:**
```bash
npm run build && npx serve dist
```

## Architecture

### Static Site Generation (Eleventy)

- **Input:** `src/` → **Output:** `dist/`
- **Template Engine:** Nunjucks (`.njk`) for layouts, Markdown (`.md`) for content
- **Markdown Engine:** markdown-it with plugins:
  - `markdown-it-texmath` - KaTeX math rendering (delimiter: `$$...$$`)
  - `markdown-it-prism` - Code syntax highlighting
  - `markdown-it-emoji`, `markdown-it-footnote`, `markdown-it-attrs`
  - `markdown-it-anchor`, `markdown-it-table-of-contents`
  - Custom KaTeX macros: `\RR` → `\mathbb{R}`

### Content Collections

Defined in [.eleventy.js](.eleventy.js) - collections are sorted arrays of pages:

- **projects:** `src/research/projects/**/*.md` (sorted by `order` frontmatter, descending)
- **past_projects:** `src/research/past_projects/**/*.md` (sorted by `order`)
- **blog:** `src/blog/posts/**/*.md` (sorted by `id`, descending)
- **kyoto_blog:** `src/blog/kyoto/**/*.md` (sorted by `id`)

### File Processing

**Passthrough Copy** (files copied directly without processing):
- `public/` → `dist/` (root-level files like `.nojekyll`)
- `src/assets/` → `dist/assets/`
- `src/internal/` → `dist/internal/` (simulators, interactive pages)
- `src/research/**/*.js` → `dist/research/**/*.js`
- `src/blog/**/*.js` → `dist/blog/**/*.js`

**Built Assets:**
- CSS: `src/_styles/_main.pcss` → `dist/assets/main.bundle.css` (TailwindCSS + PostCSS)
- JS: `src/_scripts/_main.js` → `dist/assets/main.bundle.js` (ESBuild bundle)

**Image Processing:**
- Plugin: `eleventy-plugin-page-assets`
- Auto-processes images (`.png`, `.jpg`, `.gif`, `.svg`) referenced in markdown files
- Generates content-addressed filenames (hash-based)

### Templates & Layouts

- **Main Layout:** `src/_includes/layout.njk` - Base HTML structure
- **Header:** `src/_includes/header.njk` - Navigation component
- **Collections:** `src/_includes/projects.njk`, `src/_includes/past_projects.njk`
- **Custom Shortcodes:** `{% markdown %}...{% endmarkdown %}` - Inline/block markdown rendering

### Global Data

Located in `src/_data/`:
- `navigation.js` - Site navigation menu items
- `publications.yaml` - Publications list
- `env.js` - Environment variables

### Styling

- **Framework:** TailwindCSS v3 with plugins:
  - `@tailwindcss/forms`, `@tailwindcss/typography`
  - `tw-elements`, `flowbite`
  - `tailwindcss-debug-screens`
- **Dark Mode:** Class-based (`class="dark"`)
- **Content Paths:** `./src/**/*.{js,md,njk,svg,html}` + plugin node_modules
- **Custom Typography:** Link colors customized (lime-800, lime-600 on hover)

### Client-Side JavaScript

- **Alpine.js:** Interactive components
- **Libraries:** p5.js, Tweakpane, QuickSettings (for simulators)
- **Entry Point:** `src/_scripts/_main.js`

## Deployment

**GitHub Actions:** [.github/workflows/main.yml](.github/workflows/main.yml)
- Triggers on push to `main` branch
- Builds with `npm ci && npm run build`
- Deploys `dist/` folder to GitHub Pages
- Deployed URL: https://steffenpl.github.io/

**Important:** The `.nojekyll` file in `public/` disables Jekyll processing on GitHub Pages. Without it, certain assets may not load correctly.

## Content Editing

### Adding Blog Posts

1. Create `src/blog/posts/your-post.md`
2. Add frontmatter with `id` (higher = newer):
   ```yaml
   ---
   id: 5
   title: "Post Title"
   date: 2025-01-23
   ---
   ```
3. Collection automatically sorts by `id` descending

### Adding Research Projects

1. Create `src/research/projects/your-project.md`
2. Add frontmatter with `order` (higher = first):
   ```yaml
   ---
   order: 10
   title: "Project Title"
   ---
   ```

### Math & Code

**Math (KaTeX):**
```markdown
Inline: $E = mc^2$
Block: $$\int_0^\infty e^{-x} dx = 1$$
Custom macro: $\RR$ renders as ℝ
```

**Code (Prism):**
````markdown
```python
def hello():
    print("Hello")
```
````

## Internal Pages (Simulators)

Located in `src/internal/` - interactive web applications (often built with Vite/React):
- `eht/` - Event-driven simulation with Three.js/WebGL/WebGPU
- `emt/`, `mert/`, `tsutsumi/`, `vode/` - Other simulators
- These folders may have their own build processes and asset bundles
- All files are copied as-is to `dist/internal/`

## Common Gotchas

- **CSS/JS not loading on GitHub Pages:** Ensure `.nojekyll` exists in `public/`
- **Collection not updating:** Check frontmatter `order` or `id` values
- **Images not processing:** Verify file extension matches `*.png|*.jpg|*.gif|*.svg`
- **Math not rendering:** Use `$$` delimiters, not `$...$` for inline (depends on config)
- **Path issues:** All absolute paths start from `dist/` root (e.g., `/assets/...`)
