// Pure booking logic for the demo reservation form. No DOM access, so it can be unit tested.
// Dates are plain "YYYY-MM-DD" strings handled as calendar days. Nothing here uses
// toISOString() or local-time arithmetic on instants, so DST and time zones cannot shift a day.

export const MIN_NIGHTS = 2

// Example fees for the demo. They are not real prices.
export const DEMO_FEES = { cleaning: 95, taxRate: 0.1, depositRate: 0.5 }

export const CABINS = {
  'whispering-willows': { name: 'Whispering Willows', rate: 280, sleeps: 6 },
  'pine-haven': { name: 'Pine Haven', rate: 220, sleeps: 4 },
  'forest-ridge': { name: 'Forest Ridge', rate: 340, sleeps: 8 },
  'cedar-creek': { name: 'Cedar Creek', rate: 195, sleeps: 2 },
  'maple-grove': { name: 'Maple Grove', rate: 265, sleeps: 7 },
  'birch-haven': { name: 'Birch Haven', rate: 245, sleeps: 4 },
}

const has = (object, key) => Object.hasOwn(object, key)

const DAY_MS = 24 * 60 * 60 * 1000
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

// Returns a UTC midnight timestamp for a real calendar date, or null.
const toUtcDay = (iso) => {
  const match = ISO_DATE.exec(iso || '')
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const time = Date.UTC(year, month - 1, day)
  const check = new Date(time)
  const valid =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
  return valid ? time : null
}

const fromUtcDay = (time) => new Date(time).toISOString().slice(0, 10)

export const isValidDate = (iso) => toUtcDay(iso) !== null

// Today's calendar date in the visitor's local time zone.
export const todayLocal = (now = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export const addDays = (iso, days) => {
  const time = toUtcDay(iso)
  return time === null ? null : fromUtcDay(time + days * DAY_MS)
}

export const nightsBetween = (checkIn, checkOut) => {
  const start = toUtcDay(checkIn)
  const end = toUtcDay(checkOut)
  if (start === null || end === null || end <= start) return 0
  return Math.round((end - start) / DAY_MS)
}

export const formatDate = (iso) => {
  const time = toUtcDay(iso)
  if (time === null) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(time))
}

// Accepts a ?cabin= value and returns a known cabin slug, or '' when it is not one.
export const resolveCabinParam = (value) => {
  const slug = String(value || '')
    .trim()
    .toLowerCase()
  return has(CABINS, slug) ? slug : ''
}

export const guestOptionsFor = (slug) => {
  const max = has(CABINS, slug) ? CABINS[slug].sleeps : 8
  return Array.from({ length: max }, (_, i) => i + 1)
}

export const priceQuote = (slug, nights) => {
  if (!has(CABINS, slug) || nights < 1) {
    return { nightly: 0, nights: 0, subtotal: 0, cleaning: 0, tax: 0, total: 0, deposit: 0 }
  }
  const nightly = CABINS[slug].rate
  const subtotal = nightly * nights
  const cleaning = DEMO_FEES.cleaning
  const tax = Math.round((subtotal + cleaning) * DEMO_FEES.taxRate)
  const total = subtotal + cleaning + tax
  const deposit = Math.round(total * DEMO_FEES.depositRate)
  return { nightly, nights, subtotal, cleaning, tax, total, deposit }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Returns { fieldId: message }. An empty object means the booking is valid.
export const validateBooking = (values, today = todayLocal()) => {
  const errors = {}
  const text = (key) => String(values[key] || '').trim()

  if (!text('firstName')) errors.firstName = 'Enter your first name.'
  if (!text('lastName')) errors.lastName = 'Enter your last name.'

  if (!text('email')) errors.email = 'Enter your email address.'
  else if (!EMAIL.test(text('email')))
    errors.email = 'Enter an email address like name@example.com.'

  const phoneDigits = text('phone').replace(/\D/g, '')
  if (!text('phone')) errors.phone = 'Enter your phone number.'
  else if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    errors.phone = 'Enter a phone number with 10 to 15 digits.'
  }

  const cabin = text('cabin')
  if (!cabin) errors.cabin = 'Choose a cabin.'
  else if (!has(CABINS, cabin)) errors.cabin = 'Choose a cabin from the list.'

  const checkIn = text('checkIn')
  const checkOut = text('checkOut')
  if (!checkIn) errors.checkIn = 'Choose a check-in date.'
  else if (!isValidDate(checkIn)) errors.checkIn = 'Enter a real check-in date.'
  else if (checkIn < today) errors.checkIn = 'Check-in cannot be in the past.'

  if (!checkOut) errors.checkOut = 'Choose a check-out date.'
  else if (!isValidDate(checkOut)) errors.checkOut = 'Enter a real check-out date.'
  else if (!errors.checkIn && nightsBetween(checkIn, checkOut) < MIN_NIGHTS) {
    errors.checkOut = `Check-out must be at least ${MIN_NIGHTS} nights after check-in.`
  }

  const guests = Number(text('guests'))
  if (!text('guests')) errors.guests = 'Choose how many guests.'
  else if (!Number.isInteger(guests) || guests < 1) errors.guests = 'Choose a guest count.'
  else if (!errors.cabin && guests > CABINS[cabin].sleeps) {
    errors.guests = `${CABINS[cabin].name} sleeps up to ${CABINS[cabin].sleeps} guests.`
  }

  return errors
}
