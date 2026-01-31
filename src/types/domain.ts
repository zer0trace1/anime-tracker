export type AvatarId = 'ghibli-1' | 'ghibli-2' | 'ghibli-3' | 'ghibli-4' | 'ghibli-5' | 'ghibli-6'

export interface PerfilUsuario {
  id: string
  nombre: string
  avatarId: AvatarId
  avatarPersonalizado?: string | null // dataURL (image/webp o jpeg)
}

export type TipoContenido = 'anime' | 'serie' | 'pelicula' | 'manga' | 'manhwa'

export type EstadoSeguimiento =
  | 'pendiente'
  | 'en_progreso'
  | 'terminado'
  | 'en_pausa'
  | 'abandonado'

export interface Seguimiento {
  id: string
  perfilId: string

  tipo: TipoContenido
  titulo: string
  estado: EstadoSeguimiento

  // Para series/mangas/manhwas (en pelis lo dejamos opcional y normalmente vacío)
  progresoActual: number
  progresoTotal?: number

  nota?: number // 0-10
  comentario?: string
  imagenUrl?: string
  etiquetas?: string[]

  createdAt: number
  updatedAt: number
}

export type EstadoRecomendacion = 'pendiente' | 'aceptada' | 'rechazada'

export interface Recomendacion {
  id: string
  fromPerfilId: string
  toPerfilId: string

  tipo: TipoContenido
  titulo: string
  imagenUrl?: string
  mensaje?: string

  estado: EstadoRecomendacion
  createdAt: number

  // opcional: por si quieres enlazar con un seguimiento existente
  origenSeguimientoId?: string
}

