# Projects — Data Structure

Projects are stored in `site/src/lib/data/projects.yaml` with two top-level categories:
- `research:` — Research projects (computational biology, applied math)
- `coding:` — Software projects (Julia packages, web tools)

## Schema per project

```yaml
- slug: my-project                      # URL slug
  type: research | coding               # auto-inferred from top-level key
  title: "Project Title"
  desc: "Short one-liner description."
  image: /images/projects/my-img.png    # square image, placeholder.svg if none
  tags: [Tag1, Tag2, Tag3]
  status: active | completed
  year: "2023"                          # start year
  end: "2025"                           # optional, for completed projects
  publications: [5, 6]                  # IDs from publications.yaml
  repos:
    - label: RepoName
      url: https://github.com/SteffenPL/RepoName
  links:
    - label: Link Label
      url: https://example.com
  blogs: []                             # blog post slugs
```

## Pages

| Route | Content |
|-------|---------|
| `/` (hero) | 3 research + 3 coding in compact two-column grid |
| `/research` | Full research project listing (active / completed) |
| `/coding` | Full software project listing (active / completed) |

## Research Projects

| Slug | Title | Status | Publications |
|------|-------|--------|--------------|
| epiblast-orientation | Nematic orientation maps in epiblast formation | active | #11, #10 |
| limb-morphogenesis | Modelling digit organoids | active | #13 |
| epithelial-to-mesenchymal | Epithelial-to-mesenchymal transitions | completed | #5, #6, #9 |
| cell-migration-model | Cell migration model for plithotaxis | active | #5, #9 |
| germinal-centers | Germinal center morphology | active | — |
| tlt-model | Tertiary lymphoid tissue modelling | active | — |
| eht-model | Endothelial-to-hematopoietic transition | active | — |
| position-based-dynamics | First-order position-based dynamics | active | #11 |
| anisotropic-particles | Anisotropic particle simulations | completed | #8 |
| constraints-mean-field | Mean-field limit for constrained particles | completed | #1, #3 |

## Software Projects

| Slug | Title | Status |
|------|-------|--------|
| spatial-hash-tables | SpatialHashTables.jl | active |
| bounded-degree-graphs | BoundedDegreeGraphs.jl | active |
| semtor-web | sEMTor — online EMT simulator | completed |
| ink-reveal | InkReveal | completed |
| differential-inclusions | DifferentialInclusions.jl | completed |
| delayed-sweeping | Sweeping processes with memory effects | completed |

## TODO
- [ ] Replace placeholder images with real project thumbnails
- [ ] Add individual project detail pages (`/research/[slug]`, `/coding/[slug]`)
- [ ] Link blog posts to projects via the `blogs` field
