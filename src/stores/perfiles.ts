import { defineStore } from 'pinia'
import type { PerfilUsuario, AvatarId } from '@/types/domain'
import { cargarJSON, guardarJSON } from '@/services/storage'

type EstadoPerfiles = {
  perfiles: PerfilUsuario[]
  perfilActivoId: string
}

const KEY = 'track-anime:perfiles:v1'
const AVATARES: AvatarId[] = ['ghibli-1', 'ghibli-2', 'ghibli-3', 'ghibli-4', 'ghibli-5', 'ghibli-6']

// IDs fijos (muy importante para sincronizar en Firebase)
export const PERFIL_PABLO_ID = 'pablo'
export const PERFIL_CELIA_ID = 'celia'

function semilla(): EstadoPerfiles {
  const pablo: PerfilUsuario = {
    id: PERFIL_PABLO_ID,
    nombre: 'Pablo',
    avatarId: 'ghibli-2',
    avatarPersonalizado: null,
  }

  const celia: PerfilUsuario = {
    id: PERFIL_CELIA_ID,
    nombre: 'Celia',
    avatarId: 'ghibli-1',
    avatarPersonalizado: null,
  }

  return { perfiles: [pablo, celia], perfilActivoId: PERFIL_PABLO_ID }
}

/**
 * Migra perfiles antiguos (con UUID) a ids fijos ('pablo'/'celia')
 * intentando conservar avatar/avatarPersonalizado.
 */
function normalizarEstado(input: EstadoPerfiles): EstadoPerfiles {
  const porNombre = new Map<string, PerfilUsuario>()
  for (const p of input.perfiles ?? []) {
    porNombre.set(p.nombre.toLowerCase().trim(), p)
  }

  const viejoPablo = porNombre.get('pablo')
  const viejoCelia = porNombre.get('celia')

  const pablo: PerfilUsuario = {
    id: PERFIL_PABLO_ID,
    nombre: 'Pablo',
    avatarId: viejoPablo?.avatarId ?? 'ghibli-2',
    avatarPersonalizado: viejoPablo?.avatarPersonalizado ?? null,
  }

  const celia: PerfilUsuario = {
    id: PERFIL_CELIA_ID,
    nombre: 'Celia',
    avatarId: viejoCelia?.avatarId ?? 'ghibli-1',
    avatarPersonalizado: viejoCelia?.avatarPersonalizado ?? null,
  }

  // Mantén el perfil activo si antes era Pablo/Celia (por nombre).
  const activoAnterior = input.perfiles.find(p => p.id === input.perfilActivoId)
  const nombreActivo = activoAnterior?.nombre?.toLowerCase().trim()

  const perfilActivoId =
    nombreActivo === 'celia' ? PERFIL_CELIA_ID
    : PERFIL_PABLO_ID

  return { perfiles: [pablo, celia], perfilActivoId }
}

export const usePerfilesStore = defineStore('perfiles', {
  state: (): EstadoPerfiles => {
    const raw = cargarJSON(KEY, semilla())
    // Si ya está en formato correcto, se quedará igual; si no, migra.
    const yaOk =
      raw.perfiles?.some(p => p.id === PERFIL_PABLO_ID) &&
      raw.perfiles?.some(p => p.id === PERFIL_CELIA_ID)

    return yaOk ? raw : normalizarEstado(raw)
  },

  getters: {
    perfilActivo(state) {
      return state.perfiles.find(p => p.id === state.perfilActivoId)
    },
  },

  actions: {
    seleccionarPerfil(id: string) {
      // Solo permitimos ids fijos, por si acaso
      if (id !== PERFIL_PABLO_ID && id !== PERFIL_CELIA_ID) return
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