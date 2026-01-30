import { defineStore } from 'pinia'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/services/firebase'
import { PERFIL_PABLO_ID, PERFIL_CELIA_ID } from '@/stores/perfiles'

type EstadoSesion = {
  uid: string | null
  email: string | null
  perfilPropioId: string | null
  cargando: boolean
}

const UID_PABLO = (import.meta.env.VITE_UID_PABLO as string | undefined) ?? ''
const UID_CELIA = (import.meta.env.VITE_UID_CELIA as string | undefined) ?? ''

function perfilPorUid(uid: string): string | null {
  if (UID_PABLO && uid === UID_PABLO) return PERFIL_PABLO_ID
  if (UID_CELIA && uid === UID_CELIA) return PERFIL_CELIA_ID
  return null
}

export const useSesionStore = defineStore('sesion', {
  state: (): EstadoSesion => ({
    uid: null,
    email: null,
    perfilPropioId: null,
    cargando: true,
  }),

  getters: {
    nombreLogeado(state): string {
      if (state.perfilPropioId === PERFIL_PABLO_ID) return 'Pablo'
      if (state.perfilPropioId === PERFIL_CELIA_ID) return 'Celia'
      return state.email ?? '—'
    },
  },

  actions: {
    iniciar() {
      onAuthStateChanged(auth, (user) => {
        this.cargando = false

        if (!user) {
          this.uid = null
          this.email = null
          this.perfilPropioId = null
          return
        }

        this.uid = user.uid
        this.email = user.email ?? null
        this.perfilPropioId = perfilPorUid(user.uid)
      })
    },
  },
})