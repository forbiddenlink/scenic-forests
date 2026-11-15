import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname)
const files = [
  ...readdirSync(root).filter((f) => f.endsWith('.html')),
  ...readdirSync(resolve(root, 'public')).map((f) => `public/${f}`),
]

// scenicforests.com is not owned, so mail sent there goes nowhere.
describe('contact email', () => {
  it('finds files to scan', () => {
    expect(files.length).toBeGreaterThanOrEqual(4)
  })

  it.each(files)('%s does not reference scenicforests.com', (file) => {
    expect(readFileSync(resolve(root, file), 'utf8')).not.toMatch(/scenicforests\.com/i)
  })
})
