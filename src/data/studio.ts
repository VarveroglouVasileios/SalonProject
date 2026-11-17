import type { Service, Specialist } from '@/lib/schedule'

// Prices and hours are illustrative.
export const services: Service[] = [
  { id: 'facial', name: 'Περιποίηση προσώπου', minutes: 60, price: 45, image: 'facial', blurb: 'Καθαρισμός, ενυδάτωση και μασάζ προσώπου.' },
  { id: 'massage', name: 'Μασάζ χαλάρωσης', minutes: 60, price: 50, image: 'massage', blurb: 'Ολικό μασάζ με ζεστές πέτρες και αιθέρια έλαια.' },
  { id: 'manicure', name: 'Μανικιούρ ημιμόνιμο', minutes: 45, price: 25, image: 'nails', blurb: 'Με μεγάλη γκάμα αποχρώσεων και φροντίδα επωνυχίων.' },
  { id: 'pedicure', name: 'Πεντικιούρ', minutes: 60, price: 28, image: 'nails', blurb: 'Απλό ή με ημιμόνιμο, με μασάζ ποδιών.' },
]

export const specialists: Specialist[] = [
  { id: 'eleni', name: 'Ελένη', role: 'Περιποίηση προσώπου και μασάζ', serviceIds: ['facial', 'massage'], days: [1, 3, 5], hours: ['10:00', '20:00'], breaks: [['14:00', '15:00']] },
  { id: 'irini', name: 'Ειρήνη', role: 'Μασάζ και περιποίηση προσώπου', serviceIds: ['facial', 'massage'], days: [2, 4, 6], hours: ['10:00', '18:00'], saturday: ['10:00', '16:00'] },
  { id: 'dimitra', name: 'Δήμητρα', role: 'Μανικιούρ και πεντικιούρ', serviceIds: ['manicure', 'pedicure'], days: [2, 3, 4, 5, 6], hours: ['10:00', '18:00'], saturday: ['10:00', '16:00'] },
]

export const weekdayShort = ['Κυρ', 'Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ']
