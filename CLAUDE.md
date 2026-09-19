# Scenic Forests

Portfolio-ready multi-page cabin rental website. Static HTML/CSS/JS (no
framework), built with Vite. No backend, no env vars.

## Stack

- HTML5, CSS3, vanilla JavaScript (ES modules)
- Vite 8 (multi-page build)
- Biome 2 for lint/format
- pnpm (`pnpm@10.34.5`)

## Commands

```bash
pnpm dev              # vite dev server
pnpm build             # vite build
pnpm preview           # preview the build
pnpm biome:check        # biome check .
pnpm biome:fix          # biome check . --write
pnpm biome:format       # biome format . --write
pnpm check             # biome:check then build
pnpm audit              # pnpm audit --audit-level high
```

Note: the README's quickstart uses the npm CLI, but the repo pins
`packageManager: pnpm@10.34.5` and ships `pnpm-lock.yaml`. Use pnpm.

## Layout

Four pages, each a standalone HTML entry point declared in
`vite.config.js`'s `rollupOptions.input`:

- `index.html`: homepage
- `cabins.html`: cabin collection page
- `reservations.html`: reservation request page
- `faq.html`: FAQ page
- `index.css`: shared design system and global styles
- `sub.css`: sub-page layouts (cabins/faq/reservations)
- `index.js`: nav interactions, reveal animations, form behavior
- `public/`, `images/`: static assets
- `robots.txt`, `sitemap.xml`: crawler directives

## Conventions

- No build framework beyond Vite's multi-page mode; adding a page means
  adding both the `.html` file and an entry in `vite.config.js`.
- SEO: canonical tags, Open Graph/Twitter metadata, JSON-LD schema per page.
- Accessibility: skip links, keyboard-friendly mobile nav, visible focus
  styles.
- Lightweight client-side analytics via `window.dataLayer` plus a local
  queue (see `index.js`); no external analytics script.

## Gotchas

- If deploying to a different domain, update canonical URLs, Open Graph
  URLs, and `sitemap.xml` URLs (they're hardcoded per the README).
- `.gitleaksignore` allow-lists one line in `index.js` where a
  `localStorage` key name shape-matches gitleaks' generic-api-key rule; it's
  not a real credential.
