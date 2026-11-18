<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

const focusMain = () => document.getElementById('main')?.focus()
</script>

<template>
  <a class="skip" href="#main" @click.prevent="focusMain">Μετάβαση στο περιεχόμενο</a>
  <header class="head">
    <nav aria-label="Κύρια πλοήγηση" class="head-nav"><RouterLink to="/#services" class="link">Υπηρεσίες</RouterLink><RouterLink to="/#team" class="link">Ομάδα</RouterLink></nav>
    <RouterLink to="/" class="logo">Kalypso</RouterLink>
    <div class="head-right"><span class="demo">Demo concept</span><RouterLink to="/book" class="link">Ραντεβού</RouterLink></div>
  </header>
  <div class="hair"></div>
  <main id="main" tabindex="-1"><RouterView /></main>
  <footer class="foot">
    <span class="logo-sm">Kalypso</span>
    <span>Φανταστική επιχείρηση · Τα ραντεβού δεν είναι πραγματικά · <RouterLink to="/staff" class="link">Προσωπικό</RouterLink> · <RouterLink to="/privacy" class="link">Απόρρητο και cookies</RouterLink><br />Σχεδιασμός και υλοποίηση: Βασίλειος Βαρβέρογλου · Οι φωτογραφίες είναι δημιουργημένες με AI και ενδεικτικές.</span>
  </footer>
</template>
