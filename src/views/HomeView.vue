<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { services, specialists } from '@/data/studio'
import { availableSlots, formatEuro, addDays, toISO } from '@/lib/schedule'
import { img } from '@/lib/storage'
import { bookings } from '@/lib/store'

const next = computed(() => {
  const now = new Date()
  for (let i = 1; i < 14; i++) {
    const date = addDays(toISO(now), i)
    const slots = availableSlots({ specialists, service: services[0], specialistId: 'any', date, bookings: bookings.value, now })
    if (slots.length) return { date, slots: slots.slice(0, 8) }
  }
  return null
})
const dayLabel = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' })
</script>

<template>
  <div class="wrap">
    <section class="hero" aria-labelledby="h">
      <div class="orb" aria-hidden="true"></div>
      <div class="hero-copy">
        <p class="eyebrow">Περιποίηση · Μασάζ · Νύχια · Καβάλα</p>
        <h1 id="h">Ξαπο<i>στάστε.</i></h1>
        <p class="lead">Ραντεβού που κλείνετε εσείς, στην ώρα σας. Χωρίς τηλέφωνα, χωρίς αναμονή.</p>
        <p><RouterLink class="btn" to="/book">Δείτε διαθέσιμες ώρες</RouterLink></p>
      </div>
      <img :src="img('hero')" alt="Χώρος περιποίησης με ροζ τοίχους, κεριά και θέα στη θάλασσα" width="1024" height="576" />
    </section>

    <section id="services" aria-labelledby="sv">
      <div class="sec-h"><h2 id="sv">Υπηρεσίες</h2><p class="hint">Οι τιμές είναι ενδεικτικές [ΤΙΜΟΚΑΤΑΛΟΓΟΣ]</p></div>
      <RouterLink v-for="(s, i) in services" :key="s.id" :to="{ path: '/book', query: { service: s.id } }" class="svc">
        <img :src="img(s.image)" alt="" />
        <span class="hint" style="font-size: .9rem">{{ String(i + 1).padStart(2, '0') }}</span>
        <span class="nm">{{ s.name }}</span>
        <span class="meta"><span>{{ s.minutes }} λεπτά</span><b style="font-weight: 500; text-align: right; font-size: 1.15rem">{{ formatEuro(s.price) }}</b></span>
      </RouterLink>
    </section>
  </div>

  <section class="band">
    <div class="wrap band-grid">
      <h2>Ελεύθερες ώρες<br /><i>{{ next ? dayLabel(next.date) : 'σύντομα' }}</i></h2>
      <div v-if="next" class="chips">
        <RouterLink v-for="(s, i) in next.slots" :key="s.time" :to="{ path: '/book', query: { service: services[0].id, date: next.date, time: s.time } }" class="chip" :style="{ animationDelay: i * 0.1 + 's' }">{{ s.time }}</RouterLink>
      </div>
    </div>
  </section>

  <div class="wrap">
    <section id="team" class="team" aria-label="Η ομάδα">
      <div v-for="sp in specialists.slice(0, 3)" :key="sp.id"><p class="eyebrow">Η ομάδα</p><h3>{{ sp.name }}</h3><p>{{ sp.role }}</p></div>
      <div class="hours"><p class="eyebrow">Ωράριο</p><p style="margin: 0; line-height: 2">Δευτέρα έως Παρασκευή<br />10:00 – 20:00<br />Σάββατο 10:00 – 16:00<br />Κυριακή κλειστά</p></div>
    </section>
  </div>
</template>
