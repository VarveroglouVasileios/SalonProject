import '@fontsource/cardo/greek-400.css'
import '@fontsource/cardo/latin-400.css'
import '@fontsource/cardo/greek-700.css'
import '@fontsource/cardo/latin-700.css'
import '@fontsource/cardo/greek-400-italic.css'
import '@fontsource/cardo/latin-400-italic.css'
import '@fontsource-variable/manrope/wght.css'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './style.css'

createApp(App).use(router).mount('#app')
