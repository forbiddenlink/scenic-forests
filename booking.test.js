import { describe, expect, it } from 'vitest'
import {
  addDays,
  formatDate,
  guestOptionsFor,
  nightsBetween,
  priceQuote,
  resolveCabinParam,
  todayLocal,
  validateBooking,
} from './booking.js'

const valid = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '(555) 123-4567',
  cabin: 'pine-haven',
  checkIn: '2027-03-05',
  checkOut: '2027-03-08',
  guests: '4',
}

describe('dates', () => {
  it('counts nights across the US spring-forward DST change', () => {
    expect(nightsBetween('2027-03-13', '2027-03-15')).toBe(2)
    expect(nightsBetween('2027-03-13', '2027-03-14')).toBe(1)
  })

  it('counts nights across the US fall-back DST change', () => {
    expect(nightsBetween('2027-11-06', '2027-11-08')).toBe(2)
  })

  it('handles month and year ends, including leap day', () => {
    expect(nightsBetween('2027-01-31', '2027-02-02')).toBe(2)
    expect(nightsBetween('2028-02-28', '2028-03-01')).toBe(2)
    expect(nightsBetween('2027-12-30', '2028-01-02')).toBe(3)
    expect(addDays('2027-01-31', 1)).toBe('2027-02-01')
    expect(addDays('2027-12-31', 2)).toBe('2028-01-02')
  })

  it('returns 0 nights for reversed, equal, or invalid input', () => {
    expect(nightsBetween('2027-03-08', '2027-03-05')).toBe(0)
    expect(nightsBetween('2027-03-05', '2027-03-05')).toBe(0)
    expect(nightsBetween('2027-02-30', '2027-03-05')).toBe(0)
    expect(nightsBetween('', '2027-03-05')).toBe(0)
  })

  it('uses the local calendar day, not UTC, for today', () => {
    // 9pm local time on Mar 5 is already Mar 6 in UTC for UTC-5 and west; local must win.
    const evening = new Date(2027, 2, 5, 21, 30)
    expect(todayLocal(evening)).toBe('2027-03-05')
    const justAfterMidnight = new Date(2027, 2, 6, 0, 5)
    expect(todayLocal(justAfterMidnight)).toBe('2027-03-06')
  })

  it('formats a date without shifting the day', () => {
    expect(formatDate('2027-03-14')).toBe('Mar 14, 2027')
    expect(formatDate('2027-01-01')).toBe('Jan 1, 2027')
  })
})

describe('cabins and price', () => {
  it('only accepts known cabin slugs from the URL', () => {
    expect(resolveCabinParam('cedar-creek')).toBe('cedar-creek')
    expect(resolveCabinParam(' Cedar-Creek ')).toBe('cedar-creek')
    expect(resolveCabinParam('toString')).toBe('')
    expect(resolveCabinParam('nope')).toBe('')
    expect(resolveCabinParam(null)).toBe('')
  })

  it('limits guest options to the cabin capacity', () => {
    expect(guestOptionsFor('cedar-creek')).toEqual([1, 2])
    expect(guestOptionsFor('forest-ridge')).toHaveLength(8)
    expect(guestOptionsFor('')).toHaveLength(8)
  })

  it('computes subtotal, fees, tax, total, and deposit', () => {
    // 3 nights x $220 = 660; + 95 cleaning = 755; tax 10% = 76 (75.5 rounds up); total 831; deposit 416
    expect(priceQuote('pine-haven', 3)).toEqual({
      nightly: 220,
      nights: 3,
      subtotal: 660,
      cleaning: 95,
      tax: 76,
      total: 831,
      deposit: 416,
    })
  })

  it('returns zeros when the cabin or nights are missing', () => {
    expect(priceQuote('', 3).total).toBe(0)
    expect(priceQuote('pine-haven', 0).total).toBe(0)
  })
})

describe('validateBooking', () => {
  const today = '2027-03-01'

  it('accepts a complete valid booking', () => {
    expect(validateBooking(valid, today)).toEqual({})
  })

  it('rejects empty and malformed fields', () => {
    const errors = validateBooking(
      { ...valid, firstName: ' ', email: 'ada@', phone: '12345', cabin: 'x' },
      today
    )
    expect(Object.keys(errors).sort()).toEqual(['cabin', 'email', 'firstName', 'phone'])
  })

  it('rejects more guests than the cabin sleeps', () => {
    const errors = validateBooking({ ...valid, cabin: 'cedar-creek', guests: '8' }, today)
    expect(errors.guests).toMatch(/sleeps up to 2/)
  })

  it('rejects past check-in and short or reversed stays', () => {
    expect(validateBooking({ ...valid, checkIn: '2027-02-28' }, today).checkIn).toBeDefined()
    expect(validateBooking({ ...valid, checkOut: '2027-03-06' }, today).checkOut).toBeDefined()
    expect(validateBooking({ ...valid, checkOut: '2027-03-01' }, today).checkOut).toBeDefined()
  })

  it('allows check-in today', () => {
    expect(validateBooking({ ...valid, checkIn: today, checkOut: '2027-03-03' }, today)).toEqual({})
  })

  it('rejects impossible calendar dates', () => {
    expect(validateBooking({ ...valid, checkIn: '2027-02-30' }, today).checkIn).toBeDefined()
  })
})
