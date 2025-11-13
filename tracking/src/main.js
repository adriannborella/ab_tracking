import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Notifications from '@kyvg/vue3-notification'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Notifications)

// Inicializar autenticación antes de montar la app
// handleRedirectResult() ahora se llama dentro de initAuth() antes de configurar el listener
const authStore = useAuthStore()
authStore.initAuth().then(() => {
  app.mount('#app')
})
