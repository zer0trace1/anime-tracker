import { defineStore } from 'pinia'
import type { Seguimiento, TipoContenido } from '@/types/domain'
import { cargarJSON, guardarJSON } from '@/services/storage'
import { usePerfilesStore } from '@/stores/perfiles'
import { auth } from '@/services/firebase'

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/services/firebase'

type EstadoSeguimientos = {
  porPerfil: Record<string, Seguimiento[]>
}

type PatchSeguimiento = Partial<
  Pick<
    Seguimiento,
    'tipo' | 'titulo' | 'estado' | 'progresoActual' | 'progresoTotal' | 'nota' | 'comentario' | 'imagenUrl'
  >
>

const KEY = 'track-anime:seguimientos:v1'

// Ruta compartida para los dos
const COL = collection(db, 'pareja', 'anime-tracker', 'seguimientos')

let off: Unsubscribe | null = null

export const useSeguimientosStore = defineStore('seguimientos', {
  state: (): EstadoSeguimientos => cargarJSON(KEY, { porPerfil: {} }),

  getters: {
    listaDelPerfilActivo(state): Seguimiento[] {
      const perfiles = usePerfilesStore()
      const id = perfiles.perfilActivoId
      return state.porPerfil[id] ?? []
    },

    listaPorTipo(): (tipo: TipoContenido) => Seguimiento[] {
      return (tipo) => this.listaDelPerfilActivo.filter(x => x.tipo === tipo)
    },
  },

  actions: {
    // --- Firebase realtime ---
    conectarFirebase() {
      if (off) return
      if (!auth.currentUser) return
      const q = query(COL, orderBy('updatedAt', 'desc'))
      off = onSnapshot(
        q,
        (snap) => {
          const nuevo: Record<string, Seguimiento[]> = {}

          snap.forEach((d) => {
            const data = d.data() as Omit<Seguimiento, 'id'>
            const item: Seguimiento = { ...data, id: d.id } as Seguimiento

            const pid = item.perfilId
            if (!nuevo[pid]) nuevo[pid] = []
            nuevo[pid].push(item)
          })

          this.porPerfil = nuevo
        },
        (err) => {
          console.error('[Firestore][seguimientos] onSnapshot error:', err)
        }
      )
    },

    desconectarFirebase() {
      off?.()
      off = null
    },

    // --- Local helpers ---
    asegurarPerfil(perfilId: string) {
      if (!this.porPerfil[perfilId]) this.porPerfil[perfilId] = []
    },

    // --- CRUD (optimista local + escritura Firestore) ---
    crear(
      perfilId: string,
      datos: Omit<Seguimiento, 'id' | 'perfilId' | 'createdAt' | 'updatedAt'>
    ) {
      this.asegurarPerfil(perfilId)

      const lista = this.porPerfil[perfilId] ?? (this.porPerfil[perfilId] = [])
      const ahora = Date.now()

      const id = crypto.randomUUID()
      const nuevo: Seguimiento = {
        id,
        perfilId,
        createdAt: ahora,
        updatedAt: ahora,
        ...datos,
      }

      // Optimista
      lista.unshift(nuevo)

      // Firestore (mismo id para no romper tu UI)
      void setDoc(doc(COL, id), nuevo).catch((e) =>
        console.error('[Firestore][seguimientos] crear error:', e)
      )

      return id
    },

    eliminar(perfilId: string, id: string) {
      this.asegurarPerfil(perfilId)
      const lista = this.porPerfil[perfilId] ?? (this.porPerfil[perfilId] = [])

      // Optimista
      this.porPerfil[perfilId] = lista.filter(x => x.id !== id)

      void deleteDoc(doc(COL, id)).catch((e) =>
        console.error('[Firestore][seguimientos] eliminar error:', e)
      )
    },

    actualizar(perfilId: string, id: string, patch: PatchSeguimiento) {
      this.asegurarPerfil(perfilId)
      const lista = this.porPerfil[perfilId] ?? (this.porPerfil[perfilId] = [])

      const idx = lista.findIndex(x => x.id === id)
      if (idx === -1) return
      const actual = lista[idx]
      if (!actual) return

      const next: Seguimiento = {
        ...actual,
        ...patch,
        updatedAt: Date.now(),
      }

      // Optimista
      lista[idx] = next

      // Firestore (no hace falta mandar todo)
      void updateDoc(doc(COL, id), { ...patch, updatedAt: next.updatedAt }).catch((e) =>
        console.error('[Firestore][seguimientos] actualizar error:', e)
      )
    },

    ajustarProgreso(perfilId: string, id: string, delta: number) {
      this.asegurarPerfil(perfilId)
      const lista = this.porPerfil[perfilId] ?? (this.porPerfil[perfilId] = [])

      const idx = lista.findIndex(x => x.id === id)
      if (idx === -1) return

      const actual = lista[idx]
      if (!actual) return
      if (actual.tipo === 'pelicula') return

      const total = actual.progresoTotal
      let nuevo = (actual.progresoActual ?? 0) + delta

      if (nuevo < 0) nuevo = 0
      if (typeof total === 'number' && total > 0) nuevo = Math.min(nuevo, total)

      const updatedAt = Date.now()

      // Optimista
      lista[idx] = {
        ...actual,
        progresoActual: nuevo,
        updatedAt,
      }

      void updateDoc(doc(COL, id), { progresoActual: nuevo, updatedAt }).catch((e) =>
        console.error('[Firestore][seguimientos] ajustarProgreso error:', e)
      )
    },
  },
})

// Puedes dejarlo como caché local (opcional)
export function iniciarPersistenciaSeguimientos(store = useSeguimientosStore()) {
  store.$subscribe((_m, state) => guardarJSON(KEY, state))
}