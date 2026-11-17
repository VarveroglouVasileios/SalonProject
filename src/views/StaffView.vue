<script setup lang="ts">
import { computed, ref } from 'vue'
import { services, specialists } from '@/data/studio'
import { addDays, fromMin, parseISO, toISO, toMin, workingWindow } from '@/lib/schedule'
import { bookings, resetDemo, setStatus } from '@/lib/store'

const authed = ref(false)
const pw = ref('')
const wrong = ref(false)
const login = () => { authed.value = pw.value === 'demo'; wrong.value = !authed.value }
const date = ref(toISO(new Date()))
const shift = (n: number) => { date.value = addDays(date.value, n) }
const longDate = computed(() => parseISO(date.value).toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' }))
const sName = (id: string) => services.find((s) => s.id === id)?.name ?? id

const hours = computed(() => {
  const wins = specialists.map((s) => workingWindow(s, date.value)).filter((w): w is [number, number] => !!w)
  if (!wins.length) return []
  const from = Math.floor(Math.min(...wins.map((w) => w[0])) / 60)
  const to = Math.ceil(Math.max(...wins.map((w) => w[1])) / 60)
  return Array.from({ length: to - from }, (_, i) => (from + i) * 60)
})
const dayBookings = computed(() => bookings.value.filter((b) => b.date === date.value && b.status !== 'cancelled'))
const inHour = (spId: string, h: number) => dayBookings.value.filter((b) => b.specialistId === spId && toMin(b.start) >= h && toMin(b.start) < h + 60)
const isOff = (spId: string, h: number) => { const w = workingWindow(specialists.find((s) => s.id === spId)!, date.value); return !w || h + 60 <= w[0] || h >= w[1] }
const reset = () => { if (confirm('Να επανέλθουν τα αρχικά δοκιμαστικά ραντεβού;')) resetDemo() }
</script>

<template>
  <div class="wrap">
    <h1 class="page-h">Ημερολόγιο <i>προσωπικού</i></h1>
    <form v-if="!authed" style="max-width: 24rem; padding-block: 1.5rem 4rem" @submit.prevent="login">
      <div class="f"><label for="pw">Κωδικός πρόσβασης</label><input id="pw" v-model="pw" type="password" /><p class="hint">Κωδικός demo: demo</p><p v-if="wrong" class="err" role="alert">Ο κωδικός δεν είναι σωστός.</p></div>
      <button class="btn">Είσοδος</button>
    </form>
    <div v-else style="padding-block: 1.5rem 5rem">
      <p style="display: flex; gap: .6rem; align-items: center; flex-wrap: wrap">
        <button class="mini alt" aria-label="Προηγούμενη ημέρα" @click="shift(-1)">←</button>
        <b style="min-width: 14rem; text-align: center; font: 400 1.6rem 'Cardo', serif">{{ longDate }}</b>
        <button class="mini alt" aria-label="Επόμενη ημέρα" @click="shift(1)">→</button>
        <span class="hint">{{ dayBookings.length }} ραντεβού</span>
      </p>
      <div v-if="!hours.length" class="free" style="margin-top: 1rem">Το studio είναι κλειστό αυτή την ημέρα.</div>
      <div v-else class="cal" :style="{ gridTemplateColumns: `5rem repeat(${specialists.length}, minmax(10rem, 1fr))` }">
        <div class="h"></div>
        <div v-for="sp in specialists" :key="sp.id" class="h">{{ sp.name }}</div>
        <template v-for="h in hours" :key="h">
          <div class="time">{{ fromMin(h) }}</div>
          <div v-for="sp in specialists" :key="sp.id + h" class="cell">
            <p v-if="isOff(sp.id, h)" class="off" style="margin: 0">—</p>
            <template v-else>
              <div v-for="b in inHour(sp.id, h)" :key="b.id" class="ev" :class="{ done: b.status === 'done' }">
                <b>{{ b.start }}–{{ b.end }} · {{ b.name }}</b>{{ sName(b.serviceId) }}
                <span style="display: flex; gap: .4rem; margin-top: .4rem; flex-wrap: wrap">
                  <button v-if="b.status === 'booked'" class="mini" @click="setStatus(b.id, 'done')">Ολοκληρώθηκε</button>
                  <button class="mini alt" @click="setStatus(b.id, 'cancelled')">Ακύρωση</button>
                </span>
              </div>
              <p v-if="!inHour(sp.id, h).length" class="free" style="margin: 0">Ελεύθερη ώρα</p>
            </template>
          </div>
        </template>
      </div>
      <p style="margin-top: 1.5rem"><button class="btn btn-line" @click="reset">Επαναφορά demo</button> <button class="btn btn-line" @click="authed = false">Έξοδος</button></p>
    </div>
  </div>
</template>
