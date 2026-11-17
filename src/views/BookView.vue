<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { services, specialists, weekdayShort } from '@/data/studio'
import { availableSlots, formatEuro, openDays, parseISO, type BookingErrors } from '@/lib/schedule'
import { book, bookings } from '@/lib/store'

const route = useRoute()
const router = useRouter()
const q = (k: string) => (typeof route.query[k] === 'string' ? (route.query[k] as string) : '')
const serviceId = ref(services.find((s) => s.id === q('service'))?.id ?? '')
const specialistId = ref<string>('any')
const date = ref(q('date'))
const time = ref(q('time'))
const form = reactive({ name: '', phone: '' })
const errors = ref<BookingErrors>({})
const now = ref(new Date())

const service = computed(() => services.find((s) => s.id === serviceId.value))
const eligible = computed(() => specialists.filter((s) => !service.value || s.serviceIds.includes(service.value.id)))
const days = computed(() => (service.value ? openDays({ specialists, service: service.value, specialistId: specialistId.value, bookings: bookings.value, now: now.value, count: 10 }) : []))
const slots = computed(() => (service.value && date.value ? availableSlots({ specialists, service: service.value, specialistId: specialistId.value, date: date.value, bookings: bookings.value, now: now.value }) : []))

watch(serviceId, () => {
  if (specialistId.value !== 'any' && !eligible.value.some((s) => s.id === specialistId.value)) specialistId.value = 'any'
  date.value = ''; time.value = ''
})
watch(specialistId, () => { if (!days.value.includes(date.value)) date.value = ''; time.value = '' })
watch(days, (d) => { if (date.value && !d.includes(date.value)) { date.value = '' } })
watch(date, () => { if (!slots.value.some((s) => s.time === time.value)) time.value = '' })

const dayParts = (iso: string) => { const d = parseISO(iso); return { w: weekdayShort[d.getDay()], n: d.getDate() } }
const longDate = (iso: string) => parseISO(iso).toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' })
const who = computed(() => (specialistId.value === 'any' ? 'Όποιος είναι διαθέσιμος' : specialists.find((s) => s.id === specialistId.value)?.name))

function submit() {
  now.value = new Date()
  if (!service.value) { errors.value = { slot: 'Επιλέξτε υπηρεσία.' }; return }
  const res = book({ serviceId: service.value.id, specialistId: specialistId.value, date: date.value, time: time.value, name: form.name, phone: form.phone })
  errors.value = res.errors
  if (res.taken) time.value = ''
  if (res.booking) router.push({ name: 'appointment', params: { ref: res.booking.ref } })
}
</script>

<template>
  <div class="wrap">
    <h1 class="page-h">Κλείστε <i>ραντεβού</i></h1>
    <form class="bk" novalidate @submit.prevent="submit">
      <div>
        <section class="step" aria-labelledby="s1">
          <h2 id="s1"><span>01</span> Υπηρεσία</h2>
          <div role="radiogroup" aria-labelledby="s1">
            <button v-for="s in services" :key="s.id" type="button" role="radio" class="opt" :aria-checked="serviceId === s.id" @click="serviceId = s.id">
              <span>{{ s.name }}<small>{{ s.minutes }} λεπτά</small></span><b style="font-weight: 500">{{ formatEuro(s.price) }}</b>
            </button>
          </div>
        </section>

        <section v-if="service" class="step" aria-labelledby="s2">
          <h2 id="s2"><span>02</span> Ειδικός</h2>
          <div class="pills" role="radiogroup" aria-labelledby="s2">
            <button type="button" role="radio" class="pill" :aria-checked="specialistId === 'any'" @click="specialistId = 'any'">Όποιος είναι διαθέσιμος</button>
            <button v-for="sp in eligible" :key="sp.id" type="button" role="radio" class="pill" :aria-checked="specialistId === sp.id" @click="specialistId = sp.id">{{ sp.name }}</button>
          </div>
        </section>

        <section v-if="service" class="step" aria-labelledby="s3">
          <h2 id="s3"><span>03</span> Ημέρα και ώρα</h2>
          <div class="dayrow" role="group" aria-label="Ημέρα">
            <button v-for="d in days" :key="d" type="button" class="day" :aria-pressed="date === d" @click="date = d"><span>{{ dayParts(d).w }}</span><b>{{ dayParts(d).n }}</b></button>
          </div>
          <p v-if="!days.length" class="err">Δεν υπάρχουν διαθέσιμες ημέρες για αυτή την επιλογή.</p>
          <div v-if="date" class="chips" role="group" aria-label="Ώρα">
            <button v-for="s in slots" :key="s.time" type="button" class="chip" :aria-pressed="time === s.time" @click="time = s.time">{{ s.time }}</button>
          </div>
          <p v-if="date && !slots.length" class="err">Δεν υπάρχουν ελεύθερες ώρες αυτή την ημέρα.</p>
          <p v-if="errors.slot" class="err" role="alert">{{ errors.slot }}</p>
          <p class="hint">Οι ώρες υπολογίζονται με τη διάρκεια της υπηρεσίας και {{ 10 }} λεπτά καθαρισμού μετά από κάθε ραντεβού.</p>
        </section>

        <section v-if="service" class="step" aria-labelledby="s4">
          <h2 id="s4"><span>04</span> Τα στοιχεία σας</h2>
          <div class="f-row">
            <div class="f"><label for="n">Όνομα</label><input id="n" v-model="form.name" autocomplete="name" :aria-invalid="!!errors.name" /><p v-if="errors.name" class="err" role="alert">{{ errors.name }}</p></div>
            <div class="f"><label for="p">Κινητό</label><input id="p" v-model="form.phone" inputmode="tel" autocomplete="tel" :aria-invalid="!!errors.phone" /><p v-if="errors.phone" class="err" role="alert">{{ errors.phone }}</p></div>
          </div>
        </section>
      </div>

      <aside class="sum" aria-label="Το ραντεβού σας">
        <h2>Το ραντεβού σας</h2>
        <p v-if="!service" style="color: #cfc9d6">Διαλέξτε μια υπηρεσία για να ξεκινήσετε.</p>
        <template v-else>
          <p style="margin: 0; font-size: 1.2rem; font-weight: 700">{{ service.name }}</p>
          <p style="margin: .2rem 0 0; color: #cfc9d6">{{ who }} · {{ service.minutes }} λεπτά</p>
          <p class="when">{{ date && time ? `${longDate(date)}, ${time}` : 'Επιλέξτε ημέρα και ώρα' }}</p>
          <div class="tot"><span>Σύνολο</span><span>{{ formatEuro(service.price) }}</span></div>
          <button class="btn" :disabled="!time">Επιβεβαίωση ραντεβού</button>
          <p class="hint" style="color: #cfc9d6; text-align: center">Πληρωμή στο studio. Δωρεάν ακύρωση έως 24 ώρες πριν.</p>
        </template>
      </aside>
    </form>
  </div>
</template>
