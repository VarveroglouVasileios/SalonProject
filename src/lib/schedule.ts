/** Pure appointment logic: working windows, durations, buffers and overlap-free start times. */

export interface Service {
  id: string
  name: string
  minutes: number
  price: number
  blurb: string
  image: string
}
export interface Specialist {
  id: string
  name: string
  role: string
  serviceIds: string[]
  /** JS weekday numbers, 0 = Sunday. */
  days: number[]
  hours: [string, string]
  /** Optional shorter hours on Saturday. */
  saturday?: [string, string]
  breaks?: [string, string][]
}
export type BookingStatus = 'booked' | 'done' | 'cancelled'
export interface Booking {
  id: string
  ref: string
  serviceId: string
  specialistId: string
  date: string // YYYY-MM-DD
  start: string // HH:MM
  end: string
  name: string
  phone: string
  status: BookingStatus
  createdAt: number
}

export const STEP = 15 // start times every 15 minutes
export const BUFFER = 10 // cleaning time kept free after each appointment
export const LEAD_MIN = 60 // same-day bookings need an hour of notice

export const pad = (n: number): string => String(n).padStart(2, '0')
export const toMin = (t: string): number => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
export const fromMin = (m: number): string => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
export const toISO = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseISO = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (iso: string, n: number): string => {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

/** Half-open intervals: back-to-back appointments do not overlap. */
export const overlaps = (aS: number, aE: number, bS: number, bE: number): boolean => aS < bE && bS < aE

export function workingWindow(sp: Specialist, iso: string): [number, number] | null {
  const day = parseISO(iso).getDay()
  if (!sp.days.includes(day)) return null
  const h = day === 6 && sp.saturday ? sp.saturday : sp.hours
  return [toMin(h[0]), toMin(h[1])]
}

export interface Slot {
  time: string
  specialistIds: string[]
}

export function startsFor(opts: {
  sp: Specialist
  service: Service
  date: string
  bookings: Booking[]
  now: Date
}): string[] {
  const { sp, service, date, bookings, now } = opts
  if (!sp.serviceIds.includes(service.id)) return []
  const win = workingWindow(sp, date)
  if (!win) return []
  const today = toISO(now)
  if (date < today) return []
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const taken = bookings.filter((b) => b.specialistId === sp.id && b.date === date && b.status !== 'cancelled')
  const out: string[] = []
  for (let s = win[0]; s + service.minutes <= win[1]; s += STEP) {
    const e = s + service.minutes
    if (date === today && s < nowMin + LEAD_MIN) continue
    if ((sp.breaks ?? []).some(([bs, be]) => overlaps(s, e, toMin(bs), toMin(be)))) continue
    // The cleaning buffer applies after an appointment, so widen the existing bookings by BUFFER.
    if (taken.some((b) => overlaps(s, e, toMin(b.start), toMin(b.end) + BUFFER))) continue
    out.push(fromMin(s))
  }
  return out
}

export function availableSlots(opts: {
  specialists: Specialist[]
  service: Service
  specialistId: string | 'any'
  date: string
  bookings: Booking[]
  now: Date
}): Slot[] {
  const pool = opts.specialistId === 'any' ? opts.specialists : opts.specialists.filter((s) => s.id === opts.specialistId)
  const map = new Map<string, string[]>()
  for (const sp of pool) {
    for (const time of startsFor({ sp, service: opts.service, date: opts.date, bookings: opts.bookings, now: opts.now })) {
      map.set(time, [...(map.get(time) ?? []), sp.id])
    }
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([time, specialistIds]) => ({ time, specialistIds }))
}

/** For "any specialist", pick the one with the lightest day so the work is spread out. */
export function pickSpecialist(candidates: string[], date: string, bookings: Booking[]): string | undefined {
  const load = (id: string) => bookings.filter((b) => b.specialistId === id && b.date === date && b.status !== 'cancelled').length
  return [...candidates].sort((a, b) => load(a) - load(b))[0]
}

/** Days with at least one free start, looking ahead from today. */
export function openDays(opts: { specialists: Specialist[]; service: Service; specialistId: string | 'any'; bookings: Booking[]; now: Date; count: number; horizon?: number }): string[] {
  const out: string[] = []
  const today = toISO(opts.now)
  for (let i = 0; i < (opts.horizon ?? 45) && out.length < opts.count; i++) {
    const date = addDays(today, i)
    if (availableSlots({ ...opts, date }).length) out.push(date)
  }
  return out
}

export type BookingErrors = Partial<Record<'name' | 'phone' | 'slot', string>>
export const normalizePhone = (raw: string): string => raw.replace(/[\s\-().]/g, '').replace(/^(\+30|0030)/, '')

export function validateBooking(input: { name: string; phone: string; time: string }): BookingErrors {
  const e: BookingErrors = {}
  if (input.name.trim().length < 2) e.name = 'Συμπληρώστε το όνομά σας.'
  if (!/^69\d{8}$/.test(normalizePhone(input.phone))) e.phone = 'Συμπληρώστε ελληνικό κινητό με 10 ψηφία, που αρχίζει από 69.'
  if (!input.time) e.slot = 'Επιλέξτε ώρα.'
  return e
}

export const makeRef = (n: number): string => `KS-${String(n).padStart(4, '0')}`
export const formatEuro = (n: number): string => `${n.toFixed(2).replace('.', ',')} €`
