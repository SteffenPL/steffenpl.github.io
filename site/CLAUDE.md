# CLAUDE.md

## Project Overview

Personal academic webpage for Steffen Plunder. SvelteKit 5 static site deployed to GitHub Pages.

## Stack

- **SvelteKit 5** (Svelte 5 runes syntax) + **TypeScript**
- **Tailwind CSS 4** with `@tailwindcss/vite`
- **mdsvex** for markdown blog posts (with custom KaTeX preprocessor for math)
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
- `/` — Home (hero + projects grid + selected publications)
- `/research` — Research project listing (active/completed)
- `/coding` — Software project listing (active/completed)
- `/publications` — Full publication list (peer-reviewed, preprints, theses)
- `/blog` — Blog listing
- `/blog/[slug]` — Individual blog posts (mdsvex markdown)
- `/talks` — Talks grouped by year
- `/cv` — Curriculum vitae

### Data & Cross-referencing

All structured data lives in `src/lib/data/` as YAML files (imported via `@rollup/plugin-yaml`). Content is linked by **slug strings** — human-readable keys that make cross-references self-documenting.

- `publications.yaml` — Sections: `theses`, `preprints`, `peer_reviewed`. Each entry has a unique `slug` (e.g. `plunder_2024_natcomms`, `guruciaga_2026_natmat`).
- `projects.yaml` — Sections: `research`, `coding`. Each entry has a `slug` and references publications by their slugs in the `publications` array. Also has `repos`, `links`, `blogs` arrays.
- `talks.yaml` — Talks with date, title, venue, optional URL/video.
- `cv.yaml` — Education, grants, teaching, software, organisation.

Project → Publication links resolve at render time: `ProjectCard` looks up publication slugs to display abbreviated journal names (NatMat, NatComms, etc.) linking to `/publications#slug`. `PublicationCard` renders with `id={pub.slug}` for anchor targeting with a highlight animation.

### Reusable Components

- `src/lib/components/publications/PublicationCard.svelte` — Single publication card (used on home, publications page, and in blog posts via `PublicationList`)
- `src/lib/components/publications/PublicationList.svelte` — Renders filtered publications by `slugs`, `section`, or `limit`. Usable in mdsvex blog posts.
- `src/lib/components/projects/ProjectCard.svelte` — Project card with `compact` (hero grid) and full (listing) variants. Resolves publication refs automatically.
- `src/lib/components/layout/` — Nav, Footer
- `src/lib/components/home/` — HeroCanvas (particle simulation)

### Styling

CSS variables for theming (defined in `src/app.css`). Two themes:
- **Dark** (default): Orange (`#f97316`) primary, lime (`#a3e635`) secondary
- **Light**: Lime (`#65a30d`) primary, orange (`#f97316`) secondary

Use `var(--accent)`, `var(--text)`, `var(--bg)`, etc. — not hardcoded colors.

## Adding Content

**New publication**: Add entry to `publications.yaml` with slug `firstauthor_year_venue`.

**New project**: Add entry to `projects.yaml` under `research` or `coding`. Reference publications by slug. Add thumbnail to `static/images/projects/`.

**New blog post**: Create `src/content/blog/my-post.md`. Can embed publications with `<PublicationList slugs={[...]} />`.

**New talk**: Add entry to `talks.yaml`.
