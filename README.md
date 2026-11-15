# Scenic Forests

A fictional cabin rental website, built as a front-end portfolio piece with semantic HTML, modern CSS and lightweight JavaScript. It is for portfolio reviewers, not real guests. No backend, no env vars.

Live: there is no deployment. The repo has no homepage set and `scenicforests.com` does not resolve.

## Features

- Accessibility: skip links, keyboard-friendly mobile nav, visible focus styles, clear form labels
- SEO: canonical tags, Open Graph/Twitter metadata, JSON-LD schema and `robots.txt` (the sitemap is removed until there is a real host, see Deployment note)
- Demo booking preview: per-field validation, cabin capacity limits, `?cabin=` prefill,
  timezone-safe date logic (`booking.js`, unit tested), price estimate (nightly rate, $95 cleaning fee, 10% tax, 50% deposit; `DEMO_FEES` in `booking.js`, minimum 2 nights), and a demo confirmation
  screen. Nothing is sent: there is no backend and no form service
- Demo labelling: banner on the form, footer notice on every page, example contact details
- Interactive cabin discovery: filter by guests, budget, pet-friendliness, and sort controls
- FAQ instant search
- Homepage trust proof strip and rotating testimonial carousel
- Sticky booking prompt with dismiss state and lightweight event analytics (`window.dataLayer`
  plus a local queue; no external analytics script, the dead PostHog snippet was removed)

## Tech

- HTML5, CSS3, JavaScript (ES modules)
- Vite (multi-page build)
- Biome for lint/format
- pnpm

## Run locally

Prerequisites: Node and pnpm (pinned by `packageManager` in `package.json`).

```bash
pnpm install
pnpm dev
```

## Test, check and build

```bash
pnpm test      # vitest run (booking.test.js, cabin-alt-text.test.js, contact-email.test.js, host-metadata.test.js)
pnpm biome:check
pnpm check     # biome check, tests and build together
pnpm build
pnpm preview   # preview the build
```

## Project structure

- `index.html` homepage, `cabins.html` cabin collection, `reservations.html` reservation
  request, `faq.html` FAQ page
- `index.css` shared design system and global styles; `sub.css` sub-page layouts
- `index.js` nav interactions, reveal animations, form behavior
- `booking.js` booking validation, capacity limits and price estimate; `*.test.js` Vitest specs next to the code
- `public/` static assets, including `robots.txt` and `sitemap.xml`
- `images/` site images

See `CLAUDE.md` for the full layout, conventions, and gotchas.

## Deployment note

The site is not deployed and `scenicforests.com` does not resolve, so canonicals, og:url and og:image are
relative and `sitemap.xml` is removed (sitemaps and the `robots.txt` Sitemap line need absolute URLs).
After the first real deploy, add absolute URLs for the production host in the HTML heads, restore
`public/sitemap.xml` and add a `Sitemap:` line to `public/robots.txt`.

## License

MIT. See `LICENSE`.
