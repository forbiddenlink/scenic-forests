import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname)
const pages = readdirSync(root).filter((f) => f.endsWith('.html'))

// Six cabins share three photos, so an alt text that names one cabin is wrong
// for the others. Alt text must describe the photo, and be the same wherever
// the same file appears.
function cabinImages() {
  const found = []
  for (const page of pages) {
    const html = readFileSync(resolve(root, page), 'utf8')
    for (const m of html.matchAll(/<img\b[^>]*>/g)) {
      const src = m[0].match(/\bsrc="([^"]*images\/(cabin\d+\.jpg))"/)
      const alt = m[0].match(/\balt="([^"]*)"/)
      if (src) found.push({ page, file: src[2], alt: alt ? alt[1] : null })
    }
  }
  return found
}

const CABIN_NAMES = [
  'Whispering Willows',
  'Pine Haven',
  'Forest Ridge',
  'Cedar Creek',
  'Maple Grove',
  'Birch Haven',
]

describe('cabin photo alt text', () => {
  const images = cabinImages()

  it('finds the cabin photos', () => {
    expect(images.length).toBeGreaterThanOrEqual(6)
  })

  it('every cabin photo has non-empty alt text', () => {
    for (const img of images) expect(img.alt, `${img.page} ${img.file}`).toBeTruthy()
  })

  it('the same photo has the same alt text on every card and page', () => {
    const byFile = new Map()
    for (const img of images) {
      if (!byFile.has(img.file)) byFile.set(img.file, new Set())
      byFile.get(img.file).add(img.alt)
    }
    for (const [file, alts] of byFile) expect([...alts], file).toHaveLength(1)
  })

  it('alt text does not name a cabin, because the photo is shared between cabins', () => {
    for (const img of images) {
      for (const name of CABIN_NAMES) {
        expect(img.alt, `${img.page} ${img.file}`).not.toContain(name)
      }
    }
  })
})
