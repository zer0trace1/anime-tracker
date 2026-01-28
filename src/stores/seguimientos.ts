import { defineStore } from 'pinia'
import type { Seguimiento, TipoContenido } from '@/types/domain'
import { cargarJSON, guardarJSON } from '@/services/storage'
import { usePerfilesStore } from '@/stores/perfiles'

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
    asegurarPerfil(perfilId: string) {
      if (!this.porPerfil[perfilId]) this.porPerfil[perfilId] = []
    },

    crear(
        perfilId: string,
        datos: Omit<Seguimiento, 'id' | 'perfilId' | 'createdAt' | 'updatedAt'>
        ) {
        this.asegurarPerfil(perfilId)

        const lista = this.porPerfil[perfilId] ?? (this.porPerfil[perfilId] = [])

        const ahora = Date.now()
        const nuevo: Seguimiento = {
            id: crypto.randomUUID(),
            perfilId,
            createdAt: ahora,
            updatedAt: ahora,
            ...datos,
        }

        lista.unshift(nuevo)
        return nuevo.id
    },

    eliminar(perfilId: string, id: string) {
        this.asegurarPerfil(perfilId)

        const lista = this.porPerfil[perfilId] ?? (this.porPerfil[perfilId] = [])
        this.porPerfil[perfilId] = lista.filter(x => x.id !== id)
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

        lista[idx] = next
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

      lista[idx] = {
        ...actual,
        progresoActual: nuevo,
        updatedAt: Date.now(),
      }
    },
  },
})

export function iniciarPersistenciaSeguimientos(store = useSeguimientosStore()) {
  store.$subscribe((_m, state) => guardarJSON(KEY, state))
}
