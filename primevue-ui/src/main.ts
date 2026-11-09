import './assets/main.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Lara from '@primeuix/themes/lara'
import { definePreset, palette } from '@primeuix/themes'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

import App from './App.vue'
import router from './router'

// Lara with its built-in cyan palette as the primary color.
const LaraCyan = definePreset(Lara, {
  semantic: {
    primary: palette('{cyan}'),
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  // PrimeUI Community License key — set VITE_PRIMEUI_LICENSE in .env.local (dev)
  // or pass PRIMEUI_LICENSE as a Docker build arg (see docker-compose.yaml).
  license: import.meta.env.VITE_PRIMEUI_LICENSE,
  theme: {
    preset: LaraCyan,
    options: {
      darkModeSelector: '.app-dark',
    },
  },
})
app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')
