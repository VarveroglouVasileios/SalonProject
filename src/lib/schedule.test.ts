import { describe, expect, it } from 'vitest'
import {
  addDays, availableSlots, openDays, overlaps, pickSpecialist, startsFor, validateBooking, workingWindow,
  type Booking, type Service, type Specialist,
} from './schedule'

const massage: Service = { id: 'massage', name: 'Μασάζ', minutes: 60, price: 50, blurb: '', image: '' }
const nails: Service = { id: 'nails', name: 'Μανικιούρ', minutes: 45, price: 18, blurb: '', image: '' }
const eleni: Specialist = { id: 'eleni', name: 'Ελένη', role: '', serviceIds: ['massage'], days: [1, 3, 5], hours: ['10:00', '20:00'], breaks: [['14:00', '15:00']] }
const dimitra: Specialist = { id: 'dimitra', name: 'Δήμητρα', role: '', serviceIds: ['nails'], days: [2, 3, 4, 5, 6], hours: ['10:00', '18:00'], saturday: ['10:00', '16:00'] }
const irini: Specialist = { id: 'irini', name: 'Ειρήνη', role: '', serviceIds: ['massage'], days: [3], hours: ['12:00', '16:00'] }

// 2026-08-17 is a Monday, 2026-08-19 Wednesday, 2026-08-22 Saturday, 2026-08-23 Sunday.
const MON = '2026-08-17', WED = '2026-08-19', SAT = '2026-08-22', SUN = '2026-08-23'
const early = new Date('2026-08-10T08:00:00')
const booking = (over: Partial<Booking>): Booking => ({
  id: 'b', ref: 'KS-0001', serviceId: 'massage', specialistId: 'eleni', date: MON, start: '10:00', end: '11:00',
  name: 'Τ', phone: '6900000000', status: 'booked', createdAt: 0, ...over,
})

describe('working windows', () => {
  it('knows working days, Saturday hours and Sundays off', () => {
    expect(workingWindow(eleni, MON)).toEqual([600, 1200])
    expect(workingWindow(eleni, SUN)).toBeNull()
    expect(workingWindow(dimitra, SAT)).toEqual([600, 960])
    expect(workingWindow(dimitra, MON)).toBeNull()
  })
})

describe('start times', () => {
  it('offers every 15 minutes while the whole service fits in the window', () => {
    const s = startsFor({ sp: eleni, service: massage, date: MON, bookings: [], now: early })
    expect(s[0]).toBe('10:00')
    expect(s).toContain('13:00') // ends 14:00, exactly at the break
    expect(s).not.toContain('13:15') // would run into the 14:00 break
    expect(s).not.toContain('14:00') // inside the break
    expect(s).toContain('15:00')
    expect(s[s.length - 1]).toBe('19:00') // 60 minutes must end by 20:00
  })

  it('offers nothing to a specialist who does not perform the service or is off', () => {
    expect(startsFor({ sp: eleni, service: nails, date: MON, bookings: [], now: early })).toEqual([])
    expect(startsFor({ sp: eleni, service: massage, date: SUN, bookings: [], now: early })).toEqual([])
  })

  it('removes overlapping times and keeps a cleaning buffer after an appointment', () => {
    const s = startsFor({ sp: eleni, service: massage, date: MON, bookings: [booking({})], now: early })
    expect(s).not.toContain('10:00')
    expect(s).not.toContain('10:45') // would overlap 10:00–11:00
    expect(s).not.toContain('11:00') // inside the 10 minute buffer
    expect(s).toContain('11:15') // first start after 11:00 + 10 minutes
  })

  it('ignores cancelled bookings', () => {
    const s = startsFor({ sp: eleni, service: massage, date: MON, bookings: [booking({ status: 'cancelled' })], now: early })
    expect(s).toContain('10:00')
  })

  it('needs an hour of notice on the same day and nothing in the past', () => {
    const now = new Date('2026-08-17T11:20:00')
    const s = startsFor({ sp: eleni, service: massage, date: MON, bookings: [], now })
    expect(s[0]).toBe('12:30') // 11:20 + 60 = 12:20, rounded up to the next 15 minute step
    expect(startsFor({ sp: eleni, service: massage, date: MON, bookings: [], now: new Date('2026-08-18T08:00:00') })).toEqual([])
  })

  it('treats back-to-back intervals as non-overlapping', () => {
    expect(overlaps(600, 660, 660, 720)).toBe(false)
    expect(overlaps(600, 661, 660, 720)).toBe(true)
  })
})

describe('any specialist', () => {
  it('merges the times of everyone who can do the service', () => {
    const slots = availableSlots({ specialists: [eleni, irini, dimitra], service: massage, specialistId: 'any', date: WED, bookings: [], now: early })
    const at1200 = slots.find((x) => x.time === '12:00')
    expect(at1200?.specialistIds.sort()).toEqual(['eleni', 'irini'])
    expect(slots.find((x) => x.time === '10:00')?.specialistIds).toEqual(['eleni'])
  })

  it('picks the specialist with the lighter day', () => {
    const b = [booking({ date: WED, specialistId: 'eleni' }), booking({ id: 'c', date: WED, specialistId: 'eleni', start: '16:00', end: '17:00' })]
    expect(pickSpecialist(['eleni', 'irini'], WED, b)).toBe('irini')
  })

  it('finds open days and skips days with no free time', () => {
    const days = openDays({ specialists: [irini], service: massage, specialistId: 'irini', bookings: [], now: early, count: 3 })
    expect(days).toEqual([addDays(WED, -7), WED, addDays(WED, 7)]) // every Wednesday from the 12th
  })
})

describe('validation', () => {
  it('requires name, a Greek mobile and a time', () => {
    expect(validateBooking({ name: '', phone: '123', time: '' })).toEqual({ name: expect.any(String), phone: expect.any(String), slot: expect.any(String) })
    expect(validateBooking({ name: 'Μαρία', phone: '+30 691 234 5678', time: '10:00' })).toEqual({})
  })
})
