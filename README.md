# Scenic Forests

Scenic Forests is a portfolio-ready multi-page cabin rental website built with semantic HTML, modern CSS, and lightweight JavaScript.

## What Was Improved

- Full visual redesign with a stronger brand system (typography, spacing, color, hierarchy)
- Accessibility upgrades: skip links, keyboard-friendly mobile nav, better focus styles, clearer form labels
- Performance upgrades: removed GSAP dependency, lazy-loaded non-critical images, reduced-motion support
- SEO upgrades: canonical tags, Open Graph/Twitter metadata, JSON-LD schema, `robots.txt`, and `sitemap.xml`
- UX copy refresh across all pages for clearer value proposition and stronger CTAs
- Reservation flow upgrades with client-side date logic, live nightly subtotal estimates, and inline success/error messaging
- Interactive cabin discovery tools: filter by guests, budget, pet-friendliness, and sort controls
- FAQ instant search to quickly surface matching policy answers
- Homepage trust proof strip and rotating testimonial carousel
- Sticky booking prompt with dismiss state and lightweight event analytics (`window.dataLayer` + local queue)

## Tech

- HTML5
- CSS3
- JavaScript (ES modules)
- Vite

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Project Structure

- `index.html` homepage
- `cabins.html` cabin collection page
- `reservations.html` reservation request page
- `faq.html` FAQ page
- `index.css` shared design system and global styles
- `sub.css` sub-page layouts (cabins/faq/reservations)
- `index.js` nav interactions, reveal animations, and form behavior
- `robots.txt` crawler directives
- `sitemap.xml` sitemap entries

## Deployment Note

If deploying to a different domain, update canonical URLs, Open Graph URLs, and sitemap URLs accordingly.
