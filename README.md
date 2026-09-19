# Scenic Forests

Portfolio-ready multi-page cabin rental website built with semantic HTML, modern CSS, and
lightweight JavaScript. No backend, no env vars.

## Features

- Accessibility: skip links, keyboard-friendly mobile nav, visible focus styles, clear form labels
- SEO: canonical tags, Open Graph/Twitter metadata, JSON-LD schema, `robots.txt`, `sitemap.xml`
- Reservation flow with client-side date logic, live nightly subtotal estimates, inline
  success/error messaging
- Interactive cabin discovery: filter by guests, budget, pet-friendliness, and sort controls
- FAQ instant search
- Homepage trust proof strip and rotating testimonial carousel
- Sticky booking prompt with dismiss state and lightweight event analytics (`window.dataLayer`
  plus a local queue; no external analytics script)

## Tech

- HTML5, CSS3, JavaScript (ES modules)
- Vite (multi-page build)
- Biome for lint/format
- pnpm

## Run locally

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm preview   # preview the build
```

## Project structure

- `index.html` homepage, `cabins.html` cabin collection, `reservations.html` reservation
  request, `faq.html` FAQ page
- `index.css` shared design system and global styles; `sub.css` sub-page layouts
- `index.js` nav interactions, reveal animations, form behavior
- `public/` static assets, including `robots.txt` and `sitemap.xml`
- `images/` site images

See `CLAUDE.md` for the full layout, conventions, and gotchas.

## Deployment note

If deploying to a different domain, update the canonical URLs, Open Graph URLs, and
`sitemap.xml` URLs (currently hardcoded to `scenicforests.com`).
