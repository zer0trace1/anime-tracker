import { defineStore } from 'pinia'
import type { PerfilUsuario, AvatarId } from '@/types/domain'
import { cargarJSON, guardarJSON } from '@/services/storage'

type EstadoPerfiles = {
  perfiles: PerfilUsuario[]
  perfilActivoId: string
}

const KEY = 'track-anime:perfiles:v1'
const AVATARES: AvatarId[] = ['ghibli-1', 'ghibli-2', 'ghibli-3', 'ghibli-4', 'ghibli-5', 'ghibli-6']

function semilla(): EstadoPerfiles {
  const pablo: PerfilUsuario = { id: crypto.randomUUID(), nombre: 'Pablo', avatarId: 'ghibli-2', avatarPersonalizado: null }
  const celia: PerfilUsuario = { id: crypto.randomUUID(), nombre: 'Celia', avatarId: 'ghibli-1', avatarPersonalizado: null }
  return { perfiles: [pablo, celia], perfilActivoId: pablo.id }
}

export const usePerfilesStore = defineStore('perfiles', {
  state: (): EstadoPerfiles => cargarJSON(KEY, semilla()),

  getters: {
    perfilActivo(state) {
      return state.perfiles.find(p => p.id === state.perfilActivoId)
    },
  },

  actions: {
    seleccionarPerfil(id: string) {
      this.perfilActivoId = id
    },

    cambiarAvatar(id: string) {
      const p = this.perfiles.find(x => x.id === id)
      if (!p) return

      const idx = AVATARES.indexOf(p.avatarId)
      const safeIdx = idx === -1 ? 0 : idx
      const next = AVATARES[(safeIdx + 1) % AVATARES.length]!
      p.avatarId = next
    },

    establecerAvatarPersonalizado(id: string, dataUrl: string) {
      const p = this.perfiles.find(x => x.id === id)
      if (!p) return
      p.avatarPersonalizado = dataUrl
    },

    quitarAvatarPersonalizado(id: string) {
      const p = this.perfiles.find(x => x.id === id)
      if (!p) return
      p.avatarPersonalizado = null
    },
  },
})

export function iniciarPersistenciaPerfiles(store = usePerfilesStore()) {
  store.$subscribe((_m, state) => guardarJSON(KEY, state))
}
