<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { services, specialists } from '@/data/studio'
import { formatEuro, parseISO } from '@/lib/schedule'
import { findBooking, setStatus } from '@/lib/store'

const route = useRoute()
const b = computed(() => findBooking(String(route.params.ref)))
const service = computed(() => services.find((s) => s.id === b.value?.serviceId))
const sp = computed(() => specialists.find((s) => s.id === b.value?.specialistId))
const when = computed(() => (b.value ? parseISO(b.value.date).toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''))
</script>

<template>
  <div class="wrap">
    <div v-if="!b" style="padding-block: 3rem"><p>Το ραντεβού δεν βρέθηκε σε αυτόν τον browser.</p><RouterLink class="btn" to="/">Αρχική</RouterLink></div>
    <article v-else class="receipt" aria-labelledby="r">
      <h1 id="r">{{ b.status === 'cancelled' ? 'Το ραντεβού ακυρώθηκε' : 'Σας περιμένουμε.' }}</h1>
      <p class="big">{{ when }}<br />{{ b.start }}</p>
      <p><b>{{ service?.name }}</b> με {{ sp?.name }} · {{ service?.minutes }} λεπτά · {{ service ? formatEuro(service.price) : '' }}</p>
      <p class="hint">Κωδικός {{ b.ref }} · Ενδεικτικό demo: δεν έγινε πραγματικό ραντεβού.</p>
      <p style="display: flex; gap: .8rem; justify-content: center; flex-wrap: wrap; margin-top: 1.6rem">
        <button v-if="b.status === 'booked'" class="btn btn-line" @click="setStatus(b.id, 'cancelled')">Ακύρωση ραντεβού</button>
        <RouterLink class="btn" to="/book">Νέο ραντεβού</RouterLink>
      </p>
    </article>
  </div>
</template>
