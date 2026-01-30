import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './assets/main.css'

import { iniciarPersistenciaPerfiles } from '@/stores/perfiles'
import { iniciarPersistenciaSeguimientos } from '@/stores/seguimientos'
import { iniciarPersistenciaRecomendaciones } from '@/stores/recomendaciones'

import { iniciarSyncFirebase } from '@/services/syncFirebase'
import { useSesionStore } from '@/stores/sesion'
import { usePerfilesStore } from '@/stores/perfiles'

const app = createApp(App)

// ✅ 1) Pinia en variable
const pinia = createPinia()
app.use(pinia)

app.use(router)

// ✅ 2) Iniciar sesión (onAuthStateChanged)
useSesionStore(pinia).iniciar()

// ✅ 3) Iniciar sync Firebase (conecta snapshots según login)
iniciarSyncFirebase()

const perfiles = usePerfilesStore()
perfiles.iniciarSyncFirestore()

app.mount('#app')

// ✅ 4) Persistencia local (opcional, como caché)
iniciarPersistenciaPerfiles()
iniciarPersistenciaSeguimientos()
iniciarPersistenciaRecomendaciones()