import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(__dirname)
const pages = readdirSync(root).filter((f) => f.endsWith('.html'))

// The site is not deployed and scenicforests.com does not resolve, so pages
// must not advertise an absolute URL for themselves.
describe('host-less metadata (site not deployed)', () => {
  it('finds the html pages', () => {
    expect(pages.length).toBeGreaterThanOrEqual(4)
  })

  it.each(pages)('%s does not reference scenicforests.com in metadata', (page) => {
    const html = readFileSync(resolve(root, page), 'utf8').replace(/mailto:[^"]+/g, '')
    expect(html).not.toMatch(/https?:\/\/scenicforests\.com/)
  })

  it.each(pages)('%s canonical, og:url and images are relative', (page) => {
    const html = readFileSync(resolve(root, page), 'utf8')
    const refs = [
      ...html.matchAll(/<link rel="canonical" href="([^"]+)"/g),
      ...html.matchAll(/<meta property="og:(?:url|image)" content="([^"]+)"/g),
      ...html.matchAll(/<meta name="twitter:image" content="([^"]+)"/g),
    ].map((m) => m[1])
    expect(refs.length).toBeGreaterThan(0)
    for (const ref of refs) expect(ref.startsWith('/')).toBe(true)
  })

  it('robots.txt has no dead sitemap and no sitemap.xml ships', () => {
    const robots = readFileSync(resolve(root, 'public/robots.txt'), 'utf8')
    expect(robots).not.toContain('scenicforests.com')
    expect(existsSync(resolve(root, 'public/sitemap.xml'))).toBe(false)
    expect(existsSync(resolve(root, 'sitemap.xml'))).toBe(false)
  })
})
