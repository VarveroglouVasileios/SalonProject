import { ref, watch } from 'vue'
import { load, save } from './storage'
import {
  addDays, availableSlots, fromMin, makeRef, parseISO, pickSpecialist, toISO, toMin, validateBooking,
  type Booking, type BookingErrors, type BookingStatus,
} from './schedule'
import { services, specialists } from '@/data/studio'

const KEYS = { bookings: 'kalypso.bookings.v1', seq: 'kalypso.seq.v1' }

function seed(now: Date): Booking[] {
  const out: Booking[] = []
  const names = ['Μαρία Κ.', 'Ιωάννα Π.', 'Νίκη Α.', 'Κατερίνα Σ.', 'Σοφία Δ.', 'Έλενα Μ.', 'Άννα Τ.']
  let n = 0
  for (let i = 0; i < 8; i++) {
    const date = addDays(toISO(now), i)
    const day = parseISO(date).getDay()
    for (const sp of specialists) {
      if (!sp.days.includes(day)) continue
      const service = services.find((s) => s.id === sp.serviceIds[(i + n) % sp.serviceIds.length])!
      for (const startAt of ['10:30', '12:00', '16:00'].slice(0, 1 + ((i + sp.id.length) % 3))) {
        const s = toMin(startAt)
        const win = sp.hours
        if (s + service.minutes > toMin(win[1]) || (sp.breaks ?? []).some(([bs, be]) => s < toMin(be) && toMin(bs) < s + service.minutes)) continue
        n += 1
        out.push({
          id: `seed-${n}`, ref: makeRef(n), serviceId: service.id, specialistId: sp.id, date, start: startAt, end: fromMin(s + service.minutes),
          name: names[n % names.length], phone: '6900000000', status: 'booked', createdAt: now.getTime() - n * 1000,
        })
      }
    }
  }
  return out
}

export const bookings = ref<Booking[]>(load<Booking[]>(KEYS.bookings, []))
if (!bookings.value.length) bookings.value = seed(new Date())
let seq = load<number>(KEYS.seq, bookings.value.length)
watch(bookings, (v) => save(KEYS.bookings, v), { deep: true })

export interface BookInput { serviceId: string; specialistId: string | 'any'; date: string; time: string; name: string; phone: string }

export function book(input: BookInput): { booking?: Booking; errors: BookingErrors; taken?: boolean } {
  const errors = validateBooking(input)
  if (Object.keys(errors).length) return { errors }
  const service = services.find((s) => s.id === input.serviceId)
  if (!service) return { errors: { slot: 'Επιλέξτε υπηρεσία.' } }
  // Re-check against the latest bookings: the time may have been taken since the page was opened.
  const slot = availableSlots({ specialists, service, specialistId: input.specialistId, date: input.date, bookings: bookings.value, now: new Date() })
    .find((s) => s.time === input.time)
  if (!slot) return { errors: { slot: 'Η ώρα μόλις κλείστηκε. Επιλέξτε άλλη.' }, taken: true }
  const specialistId = pickSpecialist(slot.specialistIds, input.date, bookings.value)!
  seq += 1
  save(KEYS.seq, seq)
  const b: Booking = {
    id: `b-${Date.now()}`, ref: makeRef(seq), serviceId: service.id, specialistId, date: input.date, start: input.time,
    end: fromMin(toMin(input.time) + service.minutes), name: input.name.trim(), phone: input.phone, status: 'booked', createdAt: Date.now(),
  }
  bookings.value = [...bookings.value, b]
  return { booking: b, errors }
}
export const findBooking = (ref: string): Booking | undefined => bookings.value.find((b) => b.ref === ref)
export const setStatus = (id: string, status: BookingStatus): void => {
  bookings.value = bookings.value.map((b) => (b.id === id ? { ...b, status } : b))
}
export function resetDemo(): void {
  bookings.value = seed(new Date())
  seq = bookings.value.length
  save(KEYS.seq, seq)
}
