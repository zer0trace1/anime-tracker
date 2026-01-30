import { defineStore } from 'pinia'
import type { PerfilUsuario, AvatarId } from '@/types/domain'
import { cargarJSON, guardarJSON } from '@/services/storage'
import { collection, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase' // <-- ajusta si tu ruta real es distinta

type EstadoPerfiles = {
  perfiles: PerfilUsuario[]
  perfilActivoId: string
}

export const PERFIL_PABLO_ID = 'pablo'
export const PERFIL_CELIA_ID = 'celia'
export type PerfilId = typeof PERFIL_PABLO_ID | typeof PERFIL_CELIA_ID

const KEY = 'track-anime:perfiles:v1'
const AVATARES: AvatarId[] = ['ghibli-1', 'ghibli-2', 'ghibli-3', 'ghibli-4', 'ghibli-5', 'ghibli-6']

// IDs estables (importante para sincronización)
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

    // ---------- Firestore sync ----------
    iniciarSyncFirestore() {
      // Escucha en tiempo real los perfiles en Firestore y los mete en el store
      const colRef = collection(db, 'pareja', 'anime-tracker', 'perfiles')

      onSnapshot(colRef, (snap) => {
        const porId = new Map(this.perfiles.map(p => [p.id, p]))

        snap.docs.forEach(d => {
          const data = d.data() as Partial<PerfilUsuario>
          const id = d.id

          const existente = porId.get(id)
          if (existente) {
            // mutamos para mantener reactividad
            if (typeof data.nombre === 'string') existente.nombre = data.nombre
            if (typeof data.avatarId === 'string') existente.avatarId = data.avatarId as AvatarId
            // importante: en Firestore guardamos null, no undefined
            if ('avatarPersonalizado' in data) {
              existente.avatarPersonalizado = (data as any).avatarPersonalizado ?? null
            }
          } else {
            this.perfiles.push({
              id,
              nombre: (data.nombre as string) ?? id,
              avatarId: (data.avatarId as AvatarId) ?? 'ghibli-1',
              avatarPersonalizado: (data as any).avatarPersonalizado ?? null,
            })
          }
        })

        // guarda también en local (por si recargas rápido / offline)
        guardarJSON(KEY, { perfiles: this.perfiles, perfilActivoId: this.perfilActivoId })
      })
    },

    async guardarPerfilEnFirestore(id: string) {
      const p = this.perfiles.find(x => x.id === id)
      if (!p) return

      const ref = doc(db, 'pareja', 'anime-tracker', 'perfiles', id)

      // OJO: Firestore NO acepta undefined, usamos null
      await setDoc(
        ref,
        {
          nombre: p.nombre,
          avatarId: p.avatarId,
          avatarPersonalizado: p.avatarPersonalizado ?? null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    },

    // ---------- acciones de UI ----------
    async cambiarAvatar(id: string) {
      const p = this.perfiles.find(x => x.id === id)
      if (!p) return

      const idx = AVATARES.indexOf(p.avatarId)
      const safeIdx = idx === -1 ? 0 : idx
      const next = AVATARES[(safeIdx + 1) % AVATARES.length]!
      p.avatarId = next

      await this.guardarPerfilEnFirestore(id)
    },

    async establecerAvatarPersonalizado(id: string, dataUrl: string) {
      const p = this.perfiles.find(x => x.id === id)
      if (!p) return
      p.avatarPersonalizado = dataUrl

      await this.guardarPerfilEnFirestore(id)
    },

    async quitarAvatarPersonalizado(id: string) {
      const p = this.perfiles.find(x => x.id === id)
      if (!p) return
      p.avatarPersonalizado = null

      await this.guardarPerfilEnFirestore(id)
    },
  },
})

export function iniciarPersistenciaPerfiles(store = usePerfilesStore()) {
  store.$subscribe((_m, state) => guardarJSON(KEY, state))
}