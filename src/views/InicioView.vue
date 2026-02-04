<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePerfilesStore } from '@/stores/perfiles'
import { useSeguimientosStore } from '@/stores/seguimientos'
import { useSesionStore } from '@/stores/sesion'
import type { TipoContenido, EstadoSeguimiento, Seguimiento } from '@/types/domain'
import { resolverAvatar } from '@/assets/avatares'
import ModalAñadir from '@/components/ModalAñadir.vue'
import { useRecomendacionesStore } from '@/stores/recomendaciones'
import ModalRecomendar from '@/components/ModalRecomendar.vue'
import ModalRecomendaciones from '@/components/ModalRecomendaciones.vue'
import ModalDetalleSeguimiento from '@/components/ModalDetalleSeguimiento.vue'
import { useToastsStore } from '@/stores/toasts'

const router = useRouter()
const perfiles = usePerfilesStore()
const seguimientos = useSeguimientosStore()
const sesion = useSesionStore()
const modalDetalleAbierto = ref(false)
const itemDetalle = ref<Seguimiento | null>(null)
const toasts = useToastsStore()

const seccion = ref<TipoContenido>('anime')

const modalAbierto = ref(false)
const itemEditando = ref<Seguimiento | null>(null)

const busqueda = ref('')
const estadoFiltro = ref<EstadoSeguimiento | 'todos'>('todos')
const orden = ref<'recientes' | 'alfabetico' | 'nota_desc' | 'progreso_desc'>('recientes')

const comentariosAbiertos = ref<Record<string, boolean>>({})

const nombresSeccion: Record<TipoContenido, string> = {
  anime: 'Animes',
  serie: 'Series',
  pelicula: 'Películas',
  manga: 'Mangas',
  manhwa: 'Manhwas',
}

const nombresEstado: Record<EstadoSeguimiento, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  terminado: 'Terminado',
  en_pausa: 'En pausa',
  abandonado: 'Abandonado',
}

const recs = useRecomendacionesStore()

const modalBuzonAbierto = ref(false)
const modalRecomendarAbierto = ref(false)
const itemParaRecomendar = ref<Seguimiento | null>(null)

const otroPerfil = computed(() => perfiles.perfiles.find(p => p.id !== perfiles.perfilActivoId) ?? null)

const modoLectura = computed(() => {
  // Si no sabemos quién es el usuario (perfilPropioId null), no bloqueamos.
  if (!sesion.perfilPropioId) return false
  return sesion.perfilPropioId !== perfiles.perfilActivoId
})

const puedeEditar = computed(() => !modoLectura.value)

function abrirDetalle(item: Seguimiento) {
  itemDetalle.value = item
  modalDetalleAbierto.value = true
}

function cerrarDetalle() {
  modalDetalleAbierto.value = false
  itemDetalle.value = null
}

function abrirBuzon() {
  if (!puedeEditar.value) return
  modalBuzonAbierto.value = true
}

function abrirRecomendar(item: Seguimiento) {
  if (!puedeEditar.value) return
  if (!otroPerfil.value) return
  itemParaRecomendar.value = item
  modalRecomendarAbierto.value = true
}

const listaBase = computed(() => seguimientos.listaPorTipo(seccion.value))

const hayFiltros = computed(() => {
  return busqueda.value.trim().length > 0 || estadoFiltro.value !== 'todos'
})

/*const lista = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  let arr = [...listaBase.value]

  if (q) {
    arr = arr.filter(x => (x.titulo ?? '').toLowerCase().includes(q))
  }

  if (estadoFiltro.value !== 'todos') {
    arr = arr.filter(x => x.estado === estadoFiltro.value)
  }

  switch (orden.value) {
    case 'alfabetico':
      arr.sort((a, b) => (a.titulo ?? '').localeCompare(b.titulo ?? '', 'es', { sensitivity: 'base' }))
      break

    case 'nota_desc':
      arr.sort((a, b) => (b.nota ?? -1) - (a.nota ?? -1))
      break

    case 'progreso_desc': {
      const score = (x: Seguimiento) => {
        if (x.tipo === 'pelicula') return -1
        if (x.progresoTotal && x.progresoTotal > 0) return x.progresoActual / x.progresoTotal
        return x.progresoActual > 0 ? 0.001 : -1
      }
      arr.sort((a, b) => score(b) - score(a))
      break
    }

    default:
      arr.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  }

  return arr
})*/
const norm = (s: string) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const lista = computed(() => {
  const raw = busqueda.value.trim()
  const q = norm(raw.startsWith('#') ? raw.slice(1) : raw)

  let arr = [...listaBase.value]

  if (q) {
    arr = arr.filter(x => {
      const titulo = norm(x.titulo ?? '')
      const comentario = norm(x.comentario ?? '')
      const etiquetas = (x.etiquetas ?? []).map(norm)

      return (
        titulo.includes(q) ||
        comentario.includes(q) ||
        etiquetas.some(t => t.includes(q))
      )
    })
  }

  if (estadoFiltro.value !== 'todos') {
    arr = arr.filter(x => x.estado === estadoFiltro.value)
  }

  switch (orden.value) {
    case 'alfabetico':
      arr.sort((a, b) => (a.titulo ?? '').localeCompare(b.titulo ?? '', 'es', { sensitivity: 'base' }))
      break

    case 'nota_desc':
      arr.sort((a, b) => (b.nota ?? -1) - (a.nota ?? -1))
      break

    case 'progreso_desc': {
      const score = (x: Seguimiento) => {
        if (x.tipo === 'pelicula') return -1
        if (x.progresoTotal && x.progresoTotal > 0) return x.progresoActual / x.progresoTotal
        return x.progresoActual > 0 ? 0.001 : -1
      }
      arr.sort((a, b) => score(b) - score(a))
      break
    }

    default:
      arr.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  }

  return arr
})

const contadorTexto = computed(() => {
  const total = listaBase.value.length
  const visible = lista.value.length
  return hayFiltros.value ? `${visible}/${total}` : `${total}`
})

const stats = computed(() => {
  const counts: Record<EstadoSeguimiento, number> = {
    pendiente: 0,
    en_progreso: 0,
    terminado: 0,
    en_pausa: 0,
    abandonado: 0,
  }
  for (const item of lista.value) counts[item.estado]++
  return counts
})

async function logout() {
  await sesion.logout()
  toasts.info('Sesión cerrada')
  router.push('/acceso') // o { name: 'acceso' } si tienes ruta con name
}

function abrirAñadir() {
  if (!puedeEditar.value) return
  itemEditando.value = null
  modalAbierto.value = true
}

function esCampoDeTexto(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false

  const tag = el.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (el.isContentEditable) return true

  return false
}

function onKeydown(e: KeyboardEvent) {
  // No interferir con atajos del navegador o del sistema
  if (e.ctrlKey || e.metaKey || e.altKey) return

  // Si estás escribiendo, no hacer nada
  if (esCampoDeTexto(e.target)) return

  // Solo si puedes editar (no modo lectura)
  if (!puedeEditar.value) return

  // No abrir si ya está abierto
  if (modalAbierto.value) return

  // Tecla A
  if (e.key.toLowerCase() === 'a') {
    e.preventDefault()
    abrirAñadir()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

function editar(item: Seguimiento) {
  if (!puedeEditar.value) return
  itemEditando.value = item
  modalAbierto.value = true
}

function cerrarModal() {
  modalAbierto.value = false
  itemEditando.value = null
}

function eliminar(item: Seguimiento) {
  if (!puedeEditar.value) return
  seguimientos.eliminar(perfiles.perfilActivoId, item.id)
  toasts.info('Eliminado')
}

function ajustar(item: Seguimiento, delta: number) {
  if (!puedeEditar.value) return
  seguimientos.ajustarProgreso(perfiles.perfilActivoId, item.id, delta)
}

function cambiarPerfil() {
  router.push('/')
}

function toggleComentario(id: string) {
  comentariosAbiertos.value[id] = !comentariosAbiertos.value[id]
}

function limpiarFiltros() {
  busqueda.value = ''
  estadoFiltro.value = 'todos'
  orden.value = 'recientes'
}

function inicial(titulo: string) {
  const t = (titulo ?? '').trim()
  return t ? t[0]!.toUpperCase() : '•'
}

function estiloPortada(item: Seguimiento) {
  if (item.imagenUrl) return undefined

  const paletas: Record<TipoContenido, [string, string]> = {
    anime: ['#B7D3C6', '#FDE9B4'],
    serie: ['#E9F2FF', '#F6F1E7'],
    pelicula: ['#ECC6AD', '#EAF3ED'],
    manga: ['#E98EAB', '#F6F1E7'],
    manhwa: ['#0B889E', '#E5E4DD'],
  }

  const [a, b] = paletas[item.tipo] ?? paletas.anime
  return { background: `linear-gradient(135deg, ${a}, ${b})` }
}
</script>

<template>
  <div class="contenedor">
    <header class="top">
      <div class="perfil">
        <img
          v-if="perfiles.perfilActivo"
          class="avatar"
          :src="resolverAvatar(perfiles.perfilActivo.avatarId, perfiles.perfilActivo.avatarPersonalizado)"
          alt="Avatar"
        />
        <div class="saludo">
          <div class="logeado">Estás logeado como: <strong>{{ sesion.nombreLogeado }}</strong></div>
          <div class="hola">Hola, {{ perfiles.perfilActivo?.nombre }}</div>
          <div v-if="modoLectura" class="tagLectura">Modo lectura</div>
          <div class="sub">Tu rincón cozy para llevar el seguimiento ✨</div>
        </div>
      </div>

      <div class="accionesTop">
        <button class="btnRecs" type="button" @click="abrirBuzon" :disabled="modoLectura" :title="modoLectura ? 'Estás en modo lectura en este perfil' : 'Ver recomendaciones'">
          Recomendaciones
          <span v-if="recs.contadorPendientes" class="badge">{{ recs.contadorPendientes }}</span>
        </button>

        <button class="btnCambio" type="button" @click="cambiarPerfil">
          Cambiar perfil
        </button>

        <button class="btnCambio" type="button" @click="logout">
          Cerrar sesión
        </button>

        <button class="btnCambio" type="button" @click="router.push('/estrenos')">
          Estrenos
        </button>
      </div>
    </header>

    <nav class="tabs" aria-label="Secciones">
      <button :class="['tab', seccion==='anime' && 'activa']" @click="seccion='anime'">Animes</button>
      <button :class="['tab', seccion==='serie' && 'activa']" @click="seccion='serie'">Series</button>
      <button :class="['tab', seccion==='pelicula' && 'activa']" @click="seccion='pelicula'">Películas</button>
      <button :class="['tab', seccion==='manga' && 'activa']" @click="seccion='manga'">Mangas</button>
      <button :class="['tab', seccion==='manhwa' && 'activa']" @click="seccion='manhwa'">Manhwas</button>
    </nav>

    <section class="bloque">
      <div class="cabBloque">
        <h2>{{ nombresSeccion[seccion] }}</h2>
        <span class="contador">{{ contadorTexto }}</span>
      </div>

      <!-- Controles -->
      <div class="controles">
        <label class="campoCtrl">
          <span class="labelCtrl">Buscar</span>
          <input v-model="busqueda" class="inputCtrl" placeholder="Busca por título o etiqueta (ej. terror o #terror)..." />
        </label>

        <label class="campoCtrl">
          <span class="labelCtrl">Estado</span>
          <select v-model="estadoFiltro" class="inputCtrl">
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="terminado">Terminado</option>
            <option value="en_pausa">En pausa</option>
            <option value="abandonado">Abandonado</option>
          </select>
        </label>

        <label class="campoCtrl">
          <span class="labelCtrl">Orden</span>
          <select v-model="orden" class="inputCtrl">
            <option value="recientes">Más recientes</option>
            <option value="alfabetico">A-Z</option>
            <option value="nota_desc">Mejor nota</option>
            <option value="progreso_desc">Más progreso</option>
          </select>
        </label>

        <button v-if="hayFiltros" class="btnLimpiar" type="button" @click="limpiarFiltros">
          Limpiar
        </button>
      </div>

      <!-- Stats -->
      <div v-if="listaBase.length" class="stats">
        <span v-if="stats.en_progreso" class="chip estado estado--en_progreso">En progreso: {{ stats.en_progreso }}</span>
        <span v-if="stats.pendiente" class="chip estado estado--pendiente">Pendiente: {{ stats.pendiente }}</span>
        <span v-if="stats.terminado" class="chip estado estado--terminado">Terminado: {{ stats.terminado }}</span>
        <span v-if="stats.en_pausa" class="chip estado estado--en_pausa">En pausa: {{ stats.en_pausa }}</span>
        <span v-if="stats.abandonado" class="chip estado estado--abandonado">Abandonado: {{ stats.abandonado }}</span>
      </div>

      <!-- Lista -->
      <TransitionGroup v-if="lista.length" name="cards" tag="div" class="grid">
        <!--<article v-for="item in lista" :key="item.id" class="card">-->
        <article v-for="item in lista" :key="item.id" class="card" @click="abrirDetalle(item)">
          <div class="filaCard">
            <div class="portada" :style="estiloPortada(item)" :class="{ conImagen: !!item.imagenUrl }">
              <img v-if="item.imagenUrl" :src="item.imagenUrl" alt="" />
              <div v-else class="portadaDefault">{{ inicial(item.titulo) }}</div>
            </div>

            <div class="info">
              <div class="titulo" :title="item.titulo">{{ item.titulo }}</div>

              <div class="meta">
                <span class="estado" :class="`estado--${item.estado}`">
                  {{ nombresEstado[item.estado] }}
                </span>

                <span v-if="seccion !== 'pelicula' && (item.progresoTotal || item.progresoActual)">
                  · {{ item.progresoActual }} / {{ item.progresoTotal ?? '—' }}

                  <span class="progresoCtrl">
                    <button
                      type="button"
                      class="miniBtn"
                      @click.stop="ajustar(item, -1)"
                      :disabled="!puedeEditar || item.progresoActual <= 0"
                      aria-label="Restar 1"
                    >
                      −1
                    </button>

                    <button
                      type="button"
                      class="miniBtn"
                      @click.stop="ajustar(item, +1)"
                      :disabled="!puedeEditar || (!!item.progresoTotal && item.progresoActual >= item.progresoTotal)"
                      aria-label="Sumar 1"
                    >
                      +1
                    </button>
                  </span>
                </span>
                <span v-if="item.nota !== undefined"> · ⭐ {{ item.nota }}</span>
              </div>
              <div v-if="item.etiquetas?.length" class="tags">
                <button
                  v-for="t in item.etiquetas.slice(0, 6)"
                  :key="t"
                  class="tag"
                  type="button"
                  @click.stop="busqueda = t"
                  :title="`Filtrar por ${t}`"
                >
                  #{{ t }}
                </button>

                <span v-if="item.etiquetas.length > 6" class="tag tag--more">
                  +{{ item.etiquetas.length - 6 }}
                </span>
              </div>
              <p
                v-if="item.comentario"
                class="comentario"
                :class="{ abierto: comentariosAbiertos[item.id] }"
              >
                {{ item.comentario }}
              </p>

              <button
                v-if="item.comentario && item.comentario.length > 90"
                type="button"
                class="verMas"
                @click.stop="toggleComentario(item.id)"
              >
                {{ comentariosAbiertos[item.id] ? 'Ver menos' : 'Ver más' }}
              </button>
            </div>

            <div class="accionesCard">
              <button
                v-if="puedeEditar && otroPerfil"
                class="recomendar"
                type="button"
                @click.stop="abrirRecomendar(item)"
                aria-label="Recomendar"
                title="Recomendar"
              >
                ✨
              </button>
              <a
                v-if="item.urlInteres"
                class="verLink"
                :href="item.urlInteres"
                target="_blank"
                rel="noopener noreferrer"
                @click.stop
                title="Abrir enlace"
              >
                🔗
              </a>
              <button v-if="puedeEditar" class="editar" type="button" @click.stop="editar(item)" aria-label="Editar" title="Editar">✎</button>
              <button v-if="puedeEditar" class="borrar" type="button" @click.stop="eliminar(item)" aria-label="Eliminar" title="Eliminar">✕</button>
            </div>
          </div>
        </article>
      </TransitionGroup>

      <!-- Vacío -->
      <div v-else class="vacio">
        <div v-if="listaBase.length === 0" class="vacioCaja">
          <div class="vacioTitulo">Aún no hay nada aquí.</div>
          <div class="vacioSub">
            Pulsa “Añadir” para empezar tu lista de {{ nombresSeccion[seccion].toLowerCase() }}.
          </div>
          <button v-if="puedeEditar" class="btnPri" type="button" @click="abrirAñadir">Añadir</button>
          <div v-else class="vacioSub">Estás en modo lectura en este perfil. Cambia a tu perfil para añadir.</div>
        </div>

        <div v-else class="vacioCaja">
          <div class="vacioTitulo">No hay resultados.</div>
          <div class="vacioSub">Prueba a cambiar la búsqueda o los filtros.</div>
          <button class="btnPri" type="button" @click="limpiarFiltros">Quitar filtros</button>
        </div>
      </div>

      <!-- Botón debajo (solo si ya hay items en la sección) -->
      <div v-if="listaBase.length && puedeEditar" class="fabAñadir">
        <button class="btnAñadir" type="button" @click="abrirAñadir" aria-label="Añadir">
          <span class="plus" aria-hidden="true">
            <span class="v"></span>
            <span class="h"></span>
          </span>
          <span>Añadir</span>
        </button>
      </div>
    </section>

    <ModalAñadir
      :abierto="modalAbierto"
      :tipo-inicial="seccion"
      :editar="itemEditando"
      @cerrar="cerrarModal"
      @guardado="() => {}"
    />
  </div>

  <ModalRecomendar
    :abierto="modalRecomendarAbierto"
    :item="itemParaRecomendar"
    :to-perfil-id="otroPerfil?.id ?? null"
    @cerrar="() => { modalRecomendarAbierto = false; itemParaRecomendar = null }"
    @enviado="() => {}"
  />

  <ModalRecomendaciones
    :abierto="modalBuzonAbierto"
    @cerrar="() => (modalBuzonAbierto = false)"
  />

  <ModalDetalleSeguimiento
    :abierto="modalDetalleAbierto"
    :item="itemDetalle"
    :modo-lectura="modoLectura"
    @cerrar="cerrarDetalle"
  />
</template>

<style scoped>
.contenedor{
  max-width: 980px;
  margin: 0 auto;
  padding: 22px 18px 110px;
}

.top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.perfil{
  display:flex;
  align-items:center;
  gap: 12px;
}

.avatar{
  width: 52px;
  height: 52px;
  border-radius: 16px;
  border: 1px solid rgba(31,42,36,0.10);
  background: rgba(255,255,255,0.45);
  object-fit: cover;
}

.logeado{
  font-size: 12.5px;
  opacity: 0.72;
}

.tagLectura{
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  width: fit-content;
  gap: 8px;
  font-size: 12px;
  opacity: 0.86;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(230, 170, 60, 0.12);
}

.hola{
  font-weight: 700;
  letter-spacing: 0.2px;
}

.sub{
  margin-top: 2px;
  font-size: 13px;
  opacity: 0.72;
}

.btnCambio{
  border-radius: 999px;
  padding: 10px 12px;
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(255,255,255,0.55);
  cursor: pointer;
}

.tabs{
  display:flex;
  gap: 8px;
  padding: 8px;
  border: 1px solid rgba(31,42,36,0.10);
  border-radius: 999px;
  background: rgba(255,255,255,0.45);
  backdrop-filter: blur(8px);
}

.tab{
  border: 0;
  background: transparent;
  padding: 10px 12px;
  border-radius: 999px;
  cursor: pointer;
  opacity: 0.78;
  transition: opacity .15s ease, background .15s ease;
}

.tab.activa{
  opacity: 1;
  background: rgba(31,42,36,0.10);
}

.bloque{ margin-top: 16px; }

.cabBloque{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin: 10px 2px 12px;
}

.cabBloque h2{
  margin: 0;
  font-size: 16px;
  letter-spacing: 0.2px;
}

.contador{
  font-size: 12.5px;
  opacity: 0.70;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(31,42,36,0.10);
  background: rgba(255,255,255,0.55);
}

.controles{
  display:grid;
  grid-template-columns: 1.4fr 1fr 1fr auto;
  gap: 10px;
  align-items:end;
  margin: 10px 0 12px;
}

.campoCtrl{ display:grid; gap: 6px; }
.labelCtrl{ font-size: 12px; opacity: 0.70; }

.inputCtrl{
  border-radius: 14px;
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(255,255,255,0.60);
  padding: 10px 12px;
  outline: none;
}

.inputCtrl:focus{ border-color: rgba(31,42,36,0.22); }

.btnLimpiar{
  border-radius: 999px;
  padding: 10px 12px;
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(255,255,255,0.55);
  cursor: pointer;
}

.stats{
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.chip{ font-size: 12.5px; }

.grid{
  position: relative;
  display:grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.card{
  border-radius: 18px;
  border: 1px solid rgba(31,42,36,0.10);
  background: rgba(255,255,255,0.55);
  box-shadow: 0 14px 34px rgba(0,0,0,0.08);
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.card{ cursor: pointer; }
.card:hover{ box-shadow: 0 18px 44px rgba(0,0,0,0.10); }

.filaCard{
  display:flex;
  gap: 12px;
  padding: 12px;
  align-items:flex-start;
}

.portada{
  width: 56px;
  height: 56px;
  border-radius: 16px;
  border: 1px solid rgba(31,42,36,0.08);
  overflow:hidden;
  flex: 0 0 auto;
  display:grid;
  place-items:center;
}

.portada img{
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portadaDefault{
  width: 100%;
  height: 100%;
  display:grid;
  place-items:center;
  font-weight: 800;
  letter-spacing: 0.2px;
  opacity: 0.82;
}

.info{ flex: 1; min-width: 0; }

.titulo{
  font-weight: 700;
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta{
  margin-top: 4px;
  font-size: 12.5px;
  opacity: 0.72;
}

.estado{
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(31,42,36,0.10);
  background: rgba(255,255,255,0.55);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Colores suaves por estado */
.estado--pendiente{
  background: rgba(120, 120, 120, 0.10);
  border-color: rgba(120, 120, 120, 0.18);
}
.estado--en_progreso{
  background: rgba(70, 130, 180, 0.12);
  border-color: rgba(70, 130, 180, 0.22);
}
.estado--terminado{
  background: rgba(60, 160, 90, 0.14);
  border-color: rgba(60, 160, 90, 0.24);
}
.estado--en_pausa{
  background: rgba(230, 170, 60, 0.16);
  border-color: rgba(230, 170, 60, 0.28);
}
.estado--abandonado{
  background: rgba(200, 70, 70, 0.14);
  border-color: rgba(200, 70, 70, 0.24);
}

.comentario{
  margin: 8px 0 0;
  font-size: 12.5px;
  opacity: 0.78;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.comentario.abierto{
  display: block;
  line-clamp: unset;
  -webkit-line-clamp: unset;
  overflow: visible;
}

.verMas{
  margin-top: 6px;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 12.5px;
  opacity: 0.78;
  text-decoration: underline;
  text-underline-offset: 3px;
  padding: 0;
}

.accionesCard{
  display:flex;
  gap: 6px;
  align-items:flex-start;
}

.editar, .borrar{
  border: 0;
  background: transparent;
  cursor: pointer;
  opacity: 0.55;
  font-size: 14px;
  padding: 4px 6px;
}
.editar:hover, .borrar:hover{ opacity: 0.85; }

.vacio{
  margin-top: 14px;
  padding: 18px;
  border-radius: 18px;
  border: 1px dashed rgba(31,42,36,0.18);
  background: rgba(255,255,255,0.40);
}

.vacioCaja{ text-align:center; padding: 22px 14px; }
.vacioTitulo{ font-weight: 800; letter-spacing: 0.2px; }
.vacioSub{ margin-top: 8px; opacity: 0.74; font-size: 13px; }

.btnPri{
  margin-top: 14px;
  border-radius: 999px;
  padding: 10px 14px;
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(31,42,36,0.92);
  color: #fff;
  cursor: pointer;
}

.btnAñadir{
  display:flex;
  align-items:center;
  gap: 10px;
  border-radius: 999px;
  padding: 12px 16px;
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(31,42,36,0.92);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 18px 44px rgba(0,0,0,0.16);
  transition: transform .16s ease, box-shadow .16s ease;
}

.btnAñadir:hover{
  transform: translateY(-1px);
  box-shadow: 0 22px 54px rgba(0,0,0,0.20);
}

.plus{
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  position: relative;
  background: rgba(255,255,255,0.14);
  border: 1px solid rgba(255,255,255,0.18);
}

.plus .v,
.plus .h{
  position: absolute;
  background: rgba(255,255,255,0.92);
  border-radius: 999px;
}
.plus .v{ width: 2px; height: 12px; }
.plus .h{ width: 12px; height: 2px; }

/* Animaciones cards */
.cards-enter-active,
.cards-leave-active{
  transition: opacity .18s ease, transform .18s ease;
}

.cards-enter-from{
  opacity: 0;
  transform: translateY(6px) scale(0.99);
}

.cards-leave-to{
  opacity: 0;
  transform: translateY(6px) scale(0.99);
}

.cards-leave-active{
  position: absolute;
}

.cards-move{
  transition: transform .18s ease;
}

@media (max-width: 720px){
  .grid{ grid-template-columns: 1fr; }
  .controles{ grid-template-columns: 1fr; }
}

.progresoCtrl{
  display:inline-flex;
  gap: 6px;
  margin-left: 10px;
  vertical-align: middle;
}

.miniBtn{
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(255,255,255,0.55);
  cursor: pointer;

  display:grid;
  place-items:center;

  font-size: 14px;
  line-height: 1;
  opacity: 0.88;

  transition: transform .12s ease, opacity .12s ease;
}

.miniBtn:hover{
  transform: translateY(-0.5px);
  opacity: 1;
}

.miniBtn:disabled{
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
}

.accionesTop{
  display:flex;
  gap: 10px;
  align-items:center;
}

.btnRecs{
  border-radius: 999px;
  padding: 10px 12px;
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(255,255,255,0.55);
  cursor: pointer;
  display:flex;
  align-items:center;
  gap: 8px;
}

.btnRecs:disabled{
  opacity: 0.45;
  cursor: not-allowed;
}

.badge{
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  display:grid;
  place-items:center;
  font-size: 12px;
  background: rgba(31,42,36,0.92);
  color: #fff;
  padding: 0 6px;
}

.recomendar{
  border: 0;
  background: transparent;
  cursor: pointer;
  opacity: 0.60;
  font-size: 14px;
  padding: 4px 6px;
}
.recomendar:hover{ opacity: 0.90; }

.tags{
  display:flex;
  flex-wrap:wrap;
  gap: 6px;
  margin-top: 8px;
}

.tag{
  border: 1px solid rgba(31,42,36,0.10);
  background: rgba(255,255,255,0.50);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0.82;
}

.tag:hover{ opacity: 1; }

.tag--more{
  cursor: default;
  opacity: 0.65;
}
.verLink{
  text-decoration: none;
  opacity: 0.6;
  padding: 4px 6px;
  border-radius: 10px;
}
.verLink:hover{ opacity: 0.9; }

.fabAñadir{
  position: fixed;
  right: 20px;
  bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: 50;
}

@media (max-width: 720px){
  .fabAñadir{
    right: 14px;
    bottom: calc(14px + env(safe-area-inset-bottom));
  }
}

@media (max-width: 640px){

  .contenedor{
    padding: 14px 12px 100px; /* deja hueco para el botón flotante */
  }

  /* Header apilado */
  .top{
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 10px;
  }

  .perfil{
    align-items: flex-start;
    gap: 10px;
  }

  .perfil{ min-width: 0; }
  .saludo{ min-width: 0; }
  .hola, .sub, .logeado{
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 640px){
    .logeado{ white-space: nowrap; }
  }

  @media (max-width: 640px){
    .tabs{
      display: flex;
      flex-wrap: nowrap;
    }
  }

  .avatar{
    width: 44px;
    height: 44px;
    border-radius: 14px;
  }

  .logeado{ font-size: 12px; }
  .hola{ font-size: 16px; }
  .sub{ font-size: 12.5px; }

  /* Botones del header en grid 2x2 (evita desbordes) */
  .accionesTop{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    align-items: stretch;
  }

  .btnRecs, .btnCambio{
    width: 100%;
    justify-content: center;
    padding: 10px 12px;
  }

  /* Tabs en scroll horizontal */
  .tabs{
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    max-width: 100%;
  }
  .tabs::-webkit-scrollbar{ display:none; }

  .tab{
    white-space: nowrap;
    flex: 0 0 auto;
  }

  /* Controles en columna */
  .controles{
    grid-template-columns: 1fr;
    gap: 10px;
    align-items: stretch;
  }

  .btnLimpiar{
    width: 100%;
  }

  /* Chips (En progreso / Pendiente / Terminado) que no revienten */
  .stats{
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 2px;
  }
  .stats::-webkit-scrollbar{ display:none; }
  .chip{ white-space: nowrap; }

  /* Grid de cards a 1 columna */
  .grid{
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .filaCard{
    padding: 10px;
    gap: 10px;
  }

  .portada{
    width: 52px;
    height: 52px;
    border-radius: 14px;
  }

  /* Meta en varias líneas, más legible */
  .meta{
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    line-height: 1.3;
  }

  /* Botones de acciones más “tocables” */
  .editar, .borrar, .recomendar{
    padding: 8px 8px;
    font-size: 16px;
  }
}

@media (max-width: 640px){
  .accionesTop{
    width: 100%;
  }
  .btnRecs, .btnCambio{
    min-width: 0;
    white-space: nowrap;
  }
}
</style>
