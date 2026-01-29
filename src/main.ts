import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './assets/main.css'
import { iniciarPersistenciaPerfiles } from '@/stores/perfiles'
import { iniciarPersistenciaSeguimientos } from '@/stores/seguimientos'

import { iniciarPersistenciaRecomendaciones } from '@/stores/recomendaciones'


const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

iniciarPersistenciaPerfiles()
iniciarPersistenciaSeguimientos()
iniciarPersistenciaRecomendaciones()

