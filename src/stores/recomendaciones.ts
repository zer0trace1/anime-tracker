import { defineStore } from 'pinia'
import type { Recomendacion, EstadoRecomendacion, TipoContenido } from '@/types/domain'
import { cargarJSON, guardarJSON } from '@/services/storage'
import { usePerfilesStore } from '@/stores/perfiles'
import { auth } from '@/services/firebase'

import type { FirestoreError } from 'firebase/firestore'

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

type EstadoRecs = {
  porDestino: Record<string, Recomendacion[]>
}

const KEY = 'track-anime:recomendaciones:v1'
const COL = collection(db, 'pareja', 'anime-tracker', 'recomendaciones')

let off: Unsubscribe | null = null

function isPermDenied(e: unknown) {
  return (e as FirestoreError)?.code === 'permission-denied'
}

export const useRecomendacionesStore = defineStore('recomendaciones', {
  state: (): EstadoRecs => cargarJSON(KEY, { porDestino: {} }),

  getters: {
    listaDelPerfilActivo(state): Recomendacion[] {
      const perfiles = usePerfilesStore()
      const id = perfiles.perfilActivoId
      return state.porDestino[id] ?? []
    },

    pendientesDelPerfilActivo(): Recomendacion[] {
      return this.listaDelPerfilActivo.filter(r => r.estado === 'pendiente')
    },

    contadorPendientes(): number {
      return this.pendientesDelPerfilActivo.length
    },
  },

  actions: {
    // --- Firebase realtime ---
    conectarFirebase() {
      if (off) return
      if (!auth.currentUser) return
      const q = query(COL, orderBy('createdAt', 'desc'))
      off = onSnapshot(
        q,
        (snap) => {
          const nuevo: Record<string, Recomendacion[]> = {}

          snap.forEach((d) => {
            const data = d.data() as Omit<Recomendacion, 'id'>
            const item: Recomendacion = { ...data, id: d.id } as Recomendacion

            const to = item.toPerfilId
            if (!nuevo[to]) nuevo[to] = []
            nuevo[to].push(item)
          })

          this.porDestino = nuevo
        },
        (err) => {
          if (isPermDenied(err)) {
            this.desconectarFirebase()
            return
          }
          console.error('[Firestore][recomendaciones] onSnapshot error:', err)
        }
      )
    },

    desconectarFirebase() {
      off?.()
      off = null
    },

    asegurarDestino(toPerfilId: string) {
      if (!this.porDestino[toPerfilId]) this.porDestino[toPerfilId] = []
    },

    enviar(args: {
      fromPerfilId: string
      toPerfilId: string
      tipo: TipoContenido
      titulo: string
      imagenUrl?: string
      mensaje?: string
      origenSeguimientoId?: string
    }) {
      this.asegurarDestino(args.toPerfilId)

      const id = crypto.randomUUID()
      const rec: Recomendacion = {
        id,
        fromPerfilId: args.fromPerfilId,
        toPerfilId: args.toPerfilId,
        tipo: args.tipo,
        titulo: args.titulo.trim() || 'Sin título',
        imagenUrl: args.imagenUrl?.trim() || undefined,
        mensaje: args.mensaje?.trim() || undefined,
        origenSeguimientoId: args.origenSeguimientoId,
        estado: 'pendiente',
        createdAt: Date.now(),
      }

      // Optimista
      this.porDestino[args.toPerfilId]!.unshift(rec)

      void setDoc(doc(COL, id), rec).catch((e) =>
        console.error('[Firestore][recomendaciones] enviar error:', e)
      )

      return id
    },

    marcarEstado(toPerfilId: string, id: string, estado: EstadoRecomendacion) {
      this.asegurarDestino(toPerfilId)
      const lista = this.porDestino[toPerfilId] ?? (this.porDestino[toPerfilId] = [])
      const idx = lista.findIndex(r => r.id === id)
      if (idx === -1) return
      const actual = lista[idx]
      if (!actual) return

      // Optimista
      lista[idx] = { ...actual, estado }

      void updateDoc(doc(COL, id), { estado }).catch((e) =>
        console.error('[Firestore][recomendaciones] marcarEstado error:', e)
      )
    },

    eliminar(toPerfilId: string, id: string) {
      this.asegurarDestino(toPerfilId)
      const lista = this.porDestino[toPerfilId] ?? (this.porDestino[toPerfilId] = [])
      this.porDestino[toPerfilId] = lista.filter(r => r.id !== id)

      void deleteDoc(doc(COL, id)).catch((e) =>
        console.error('[Firestore][recomendaciones] eliminar error:', e)
      )
    },
  },
})

// Caché local opcional
export function iniciarPersistenciaRecomendaciones(store = useRecomendacionesStore()) {
  store.$subscribe((_m, state) => guardarJSON(KEY, state))
}