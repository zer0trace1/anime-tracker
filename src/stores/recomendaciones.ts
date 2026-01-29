import { defineStore } from 'pinia'
import type { Recomendacion, EstadoRecomendacion, TipoContenido } from '@/types/domain'
import { cargarJSON, guardarJSON } from '@/services/storage'
import { usePerfilesStore } from '@/stores/perfiles'

type EstadoRecs = {
  porDestino: Record<string, Recomendacion[]>
}

const KEY = 'track-anime:recomendaciones:v1'

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

      const rec: Recomendacion = {
        id: crypto.randomUUID(),
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

      this.porDestino[args.toPerfilId]!.unshift(rec)
      return rec.id
    },

    marcarEstado(toPerfilId: string, id: string, estado: EstadoRecomendacion) {
      this.asegurarDestino(toPerfilId)
      const lista = this.porDestino[toPerfilId] ?? (this.porDestino[toPerfilId] = [])
      const idx = lista.findIndex(r => r.id === id)
      if (idx === -1) return
      const actual = lista[idx]
      if (!actual) return

      lista[idx] = { ...actual, estado }
    },

    eliminar(toPerfilId: string, id: string) {
      this.asegurarDestino(toPerfilId)
      const lista = this.porDestino[toPerfilId] ?? (this.porDestino[toPerfilId] = [])
      this.porDestino[toPerfilId] = lista.filter(r => r.id !== id)
    },
  },
})

export function iniciarPersistenciaRecomendaciones(store = useRecomendacionesStore()) {
  store.$subscribe((_m, state) => guardarJSON(KEY, state))
}
