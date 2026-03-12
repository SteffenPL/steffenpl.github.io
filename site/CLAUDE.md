# CLAUDE.md

## Project Overview

Personal academic webpage for Steffen Plunder. SvelteKit 5 static site deployed to GitHub Pages.

## Stack

- **SvelteKit 5** (Svelte 5 runes syntax) + **TypeScript**
- **Tailwind CSS 4** with `@tailwindcss/vite`
- **mdsvex** for markdown blog posts (with remark-math + rehype-katex for math)
- **Static adapter** → builds to `build/`
- Fonts: Source Code Pro (display/monospace), Inter (body)

## Commands

```bash
npm run dev       # Dev server
npm run build     # Production build (output: build/)
npm run preview   # Preview production build
npm run check     # Type-check
```

## Architecture

### Routing

All pages are prerendered (static). Routes:
- `/` — Home (hero + featured projects + recent publications)
- `/projects` — All projects (active/completed)
- `/publications` — Full publication list
- `/blog` — Blog listing
- `/blog/[slug]` — Individual blog posts (mdsvex markdown)
- `/talks` — Talks grouped by year
- `/cv` — Curriculum vitae

### Data

Structured data lives in `src/lib/data/` as YAML files imported via `@rollup/plugin-yaml`:
- `projects.yaml` — Projects with tags, publication IDs, links, optional blog slug
- `publications.yaml` — Preprints + peer-reviewed (migrated from old site, keep as-is)
- `talks.yaml` — Talks with date, title, venue, optional URL/video
- `cv.yaml` — Education, grants, teaching, software, organisation

Projects reference publications by `id` field (matching IDs in `publications.yaml`).

### Blog Posts

Markdown files in `src/content/blog/*.md` with frontmatter:
```yaml
---
title: "Post Title"
date: "YYYY-MM-DD"
slug: "filename-without-extension"
---
```
Loaded via `import.meta.glob` in the blog listing and dynamic import in `[slug]/+page.ts`.

### Styling

CSS variables for theming (defined in `src/app.css`). Two themes:
- **Dark** (default): Orange (`#f97316`) primary, lime (`#a3e635`) secondary
- **Light**: Lime (`#65a30d`) primary, orange (`#f97316`) secondary

Use `var(--accent)`, `var(--text)`, `var(--bg)`, etc. — not hardcoded colors.
Theme toggle uses View Transitions API with circular wipe animation.

### Components

- `src/lib/components/layout/` — Nav, Footer
- `src/lib/components/home/` — HeroCanvas (particle simulation)
- `src/lib/stores/theme.ts` — Theme store with localStorage persistence

## Known Issues

- 4 project blog posts in `src/content/blog/_drafts/` need math escaping for mdsvex (curly braces in LaTeX parsed as Svelte expressions)
- Blog post images from old site not yet copied to `static/`
- Google Scholar ID placeholder in footer (`GOOGLE_SCHOLAR_ID`)

## Adding Content

**New project**: Add entry to `src/lib/data/projects.yaml`, add thumbnail to `static/images/projects/`.

**New blog post**: Create `src/content/blog/my-post.md` with the frontmatter format above.

**New publication**: Add entry to `src/lib/data/publications.yaml` under `preprints` or `peer_reviewed`.

**New talk**: Add entry to `src/lib/data/talks.yaml`.
