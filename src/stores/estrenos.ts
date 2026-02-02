import { defineStore } from 'pinia'
import type { Estreno, TipoContenido } from '@/types/domain'
import { cargarJSON, guardarJSON } from '@/services/storage'
import { usePerfilesStore } from '@/stores/perfiles'
import { auth, db } from '@/services/firebase'

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

type EstadoEstrenos = {
  porPerfil: Record<string, Estreno[]>
}

type PatchEstreno = Partial<
  Pick<Estreno, 'tipo' | 'titulo' | 'fechaEstreno' | 'comentario' | 'imagenUrl' | 'etiquetas'>
>

const KEY = 'track-anime:estrenos:v1'
const COL = collection(db, 'pareja', 'anime-tracker', 'estrenos')

let off: Unsubscribe | null = null

function isPermDenied(e: unknown) {
  return (e as FirestoreError)?.code === 'permission-denied'
}

export const useEstrenosStore = defineStore('estrenos', {
  state: (): EstadoEstrenos => cargarJSON(KEY, { porPerfil: {} }),

  getters: {
    listaDelPerfilActivo(state): Estreno[] {
      const perfiles = usePerfilesStore()
      const id = perfiles.perfilActivoId
      return state.porPerfil[id] ?? []
    },
  },

  actions: {
    conectarFirebase() {
      if (off) return
      if (!auth.currentUser) return

      const q = query(COL, orderBy('fechaEstreno', 'asc'))
      off = onSnapshot(
        q,
        (snap) => {
          const nuevo: Record<string, Estreno[]> = {}

          snap.forEach((d) => {
            const data = d.data() as Omit<Estreno, 'id'>
            const item: Estreno = { ...data, id: d.id } as Estreno

            const pid = item.perfilId
            if (!nuevo[pid]) nuevo[pid] = []
            nuevo[pid].push(item)
          })

          this.porPerfil = nuevo
        },
        (err) => {
          if (isPermDenied(err)) {
            this.desconectarFirebase()
            return
          }
          console.error('[Firestore][estrenos] onSnapshot error:', err)
        }
      )
    },

    desconectarFirebase() {
      off?.()
      off = null
    },

    asegurarPerfil(perfilId: string) {
      if (!this.porPerfil[perfilId]) this.porPerfil[perfilId] = []
    },

    crear(perfilId: string, datos: Omit<Estreno, 'id' | 'perfilId' | 'createdAt' | 'updatedAt'>) {
      this.asegurarPerfil(perfilId)

      const lista = this.porPerfil[perfilId] ?? (this.porPerfil[perfilId] = [])
      const ahora = Date.now()

      const id = crypto.randomUUID()
      const nuevo: Estreno = {
        id,
        perfilId,
        createdAt: ahora,
        updatedAt: ahora,
        ...datos,
      }

      lista.unshift(nuevo)

      void setDoc(doc(COL, id), nuevo).catch((e) =>
        console.error('[Firestore][estrenos] crear error:', e)
      )

      return id
    },

    actualizar(perfilId: string, id: string, patch: PatchEstreno) {
      this.asegurarPerfil(perfilId)
      const lista = this.porPerfil[perfilId] ?? (this.porPerfil[perfilId] = [])

      const idx = lista.findIndex((x) => x.id === id)
      if (idx === -1) return

      const actual = lista[idx]
      if (!actual) return

      const next: Estreno = {
        ...actual,
        ...patch,
        updatedAt: Date.now(),
      }

      lista[idx] = next

      void updateDoc(doc(COL, id), { ...patch, updatedAt: next.updatedAt }).catch((e) =>
        console.error('[Firestore][estrenos] actualizar error:', e)
      )
    },

    eliminar(perfilId: string, id: string) {
      this.asegurarPerfil(perfilId)
      const lista = this.porPerfil[perfilId] ?? (this.porPerfil[perfilId] = [])
      this.porPerfil[perfilId] = lista.filter((x) => x.id !== id)

      void deleteDoc(doc(COL, id)).catch((e) =>
        console.error('[Firestore][estrenos] eliminar error:', e)
      )
    },
  },
})

export function iniciarPersistenciaEstrenos(store = useEstrenosStore()) {
  store.$subscribe((_m, state) => guardarJSON(KEY, state))
}