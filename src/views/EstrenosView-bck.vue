<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePerfilesStore } from '@/stores/perfiles'
import { useSesionStore } from '@/stores/sesion'
import { useEstrenosStore } from '@/stores/estrenos'
import { resolverAvatar } from '@/assets/avatares'
import type { TipoContenido, Estreno } from '@/types/domain'
import ModalEstreno from '@/components/ModalEstreno.vue'
import { useToastsStore } from '@/stores/toasts'

const router = useRouter()
const perfiles = usePerfilesStore()
const sesion = useSesionStore()
const estrenos = useEstrenosStore()
const toasts = useToastsStore()

// --- Modo lectura (igual que en InicioView) ---
const modoLectura = computed(() => {
  if (!sesion.perfilPropioId) return false
  return sesion.perfilPropioId !== perfiles.perfilActivoId
})
const puedeEditar = computed(() => !modoLectura.value)

// --- Filtros / UI ---
const busqueda = ref('')
const tipoFiltro = ref<TipoContenido | 'todos'>('todos')
const orden = ref<'fecha_asc' | 'fecha_desc'>('fecha_asc')

const modalAbierto = ref(false)
const itemEditando = ref<Estreno | null>(null)

// Para actualizar la cuenta atrás sin recargar
const now = ref(Date.now())
let timer: number | null = null

onMounted(() => {
  timer = window.setInterval(() => (now.value = Date.now()), 60_000) // cada 1 min
})
onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})

// --- Helpers ---
function normaliza(s: string) {
  return (s ?? '').trim().toLowerCase()
}

function etiquetasDe(item: Estreno) {
  return (item.etiquetas ?? []).map((x) => normaliza(x)).filter(Boolean)
}

// admite: "terror" / "#terror" / "terror comedia"
function coincideBusqueda(item: Estreno, q: string) {
  if (!q) return true

  const tokens = q
    .split(/\s+/)
    .map(t => normaliza(t))
    .filter(Boolean)

  const titulo = normaliza(item.titulo)
  const tags = etiquetasDe(item)

  return tokens.every(tok => {
    const t = tok.startsWith('#') ? tok.slice(1) : tok
    if (!t) return true
    return titulo.includes(t) || tags.some(et => et.includes(t))
  })
}

function textoCuentaAtras(fechaEstreno: number) {
  const diff = fechaEstreno - now.value
  const abs = Math.abs(diff)

  const d = Math.floor(abs / 86400000)
  const h = Math.floor((abs % 86400000) / 3600000)
  const m = Math.floor((abs % 3600000) / 60000)

  if (diff > 0) return `Faltan ${d}d ${h}h ${m}m`
  return `Estrenado hace ${d}d`
}

function fechaBonita(ms: number) {
  return new Date(ms).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
}

function limpiarFiltros() {
  busqueda.value = ''
  tipoFiltro.value = 'todos'
  orden.value = 'fecha_asc'
}

// --- Datos ---
const listaBase = computed(() => estrenos.listaDelPerfilActivo)

const lista = computed(() => {
  const q = normaliza(busqueda.value)
  let arr = [...listaBase.value]

  if (tipoFiltro.value !== 'todos') {
    arr = arr.filter(x => x.tipo === tipoFiltro.value)
  }

  if (q) {
    arr = arr.filter(x => coincideBusqueda(x, q))
  }

  arr.sort((a, b) => {
    const diff = (a.fechaEstreno ?? 0) - (b.fechaEstreno ?? 0)
    return orden.value === 'fecha_asc' ? diff : -diff
  })

  return arr
})

const hayFiltros = computed(() => {
  return normaliza(busqueda.value).length > 0 || tipoFiltro.value !== 'todos' || orden.value !== 'fecha_asc'
})

const contadorTexto = computed(() => {
  const total = listaBase.value.length
  const visible = lista.value.length
  return hayFiltros.value ? `${visible}/${total}` : `${total}`
})

const nombresTipo: Record<TipoContenido, string> = {
  anime: 'Anime',
  serie: 'Serie',
  pelicula: 'Película',
  manga: 'Manga',
  manhwa: 'Manhwa',
}

// --- Navegación / acciones ---
async function logout() {
  await sesion.logout()
  toasts.info('Sesión cerrada')
  router.push('/acceso')
}

function irInicio() {
  router.push('/inicio')
}

function cambiarPerfil() {
  router.push('/')
}

function abrirAñadir() {
  if (!puedeEditar.value) return
  itemEditando.value = null
  modalAbierto.value = true
}

function editar(item: Estreno) {
  if (!puedeEditar.value) return
  itemEditando.value = item
  modalAbierto.value = true
}

function cerrarModal() {
  modalAbierto.value = false
  itemEditando.value = null
}

function eliminar(item: Estreno) {
  if (!puedeEditar.value) return
  estrenos.eliminar(perfiles.perfilActivoId, item.id)
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
          <div class="hola">Estrenos · {{ perfiles.perfilActivo?.nombre }}</div>
          <div v-if="modoLectura" class="tagLectura">Modo lectura</div>
          <div class="sub">Añade estrenos para ver la cuenta atrás 📅✨</div>
        </div>
      </div>

      <div class="accionesTop">
        <button class="btnCambio" type="button" @click="irInicio">Volver</button>
        <button class="btnCambio" type="button" @click="cambiarPerfil">Cambiar perfil</button>
        <button class="btnCambio" type="button" @click="logout">Cerrar sesión</button>
      </div>
    </header>

    <section class="bloque">
      <div class="cabBloque">
        <h2>Estrenos</h2>
        <span class="contador">{{ contadorTexto }}</span>
      </div>

      <!-- Controles -->
      <div class="controles">
        <label class="campoCtrl">
          <span class="labelCtrl">Buscar</span>
          <input
            v-model="busqueda"
            class="inputCtrl"
            placeholder="Busca por título o etiqueta (ej. terror o #terror)…"
          />
        </label>

        <label class="campoCtrl">
          <span class="labelCtrl">Tipo</span>
          <select v-model="tipoFiltro" class="inputCtrl">
            <option value="todos">Todos</option>
            <option value="anime">Anime</option>
            <option value="serie">Serie</option>
            <option value="pelicula">Película</option>
            <option value="manga">Manga</option>
            <option value="manhwa">Manhwa</option>
          </select>
        </label>

        <label class="campoCtrl">
          <span class="labelCtrl">Orden</span>
          <select v-model="orden" class="inputCtrl">
            <option value="fecha_asc">Próximos primero</option>
            <option value="fecha_desc">Más lejanos primero</option>
          </select>
        </label>

        <button v-if="hayFiltros" class="btnLimpiar" type="button" @click="limpiarFiltros">
          Limpiar
        </button>
      </div>

      <!-- Lista -->
      <div v-if="lista.length" class="grid">
        <article v-for="item in lista" :key="item.id" class="card">
          <div class="filaCard">
            <div class="left">
              <div class="titulo" :title="item.titulo">{{ item.titulo }}</div>

              <div class="meta">
                <span class="chip">{{ nombresTipo[item.tipo] }}</span>
                <span class="fecha">· {{ fechaBonita(item.fechaEstreno) }}</span>
              </div>

              <div class="cuenta">{{ textoCuentaAtras(item.fechaEstreno) }}</div>

              <div v-if="item.etiquetas?.length" class="tags">
                <span v-for="t in item.etiquetas" :key="t" class="tag">#{{ t }}</span>
              </div>

              <p v-if="item.comentario" class="comentario">{{ item.comentario }}</p>
            </div>

            <div class="accionesCard">
              <button
                v-if="puedeEditar"
                class="editar"
                type="button"
                @click="editar(item)"
                aria-label="Editar"
                title="Editar"
              >
                ✎
              </button>
              <button
                v-if="puedeEditar"
                class="borrar"
                type="button"
                @click="eliminar(item)"
                aria-label="Eliminar"
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          </div>
        </article>
      </div>

      <!-- Vacío -->
      <div v-else class="vacio">
        <div class="vacioCaja">
          <div class="vacioTitulo">Aún no hay estrenos.</div>
          <div class="vacioSub">Añade uno para ver la cuenta atrás.</div>
          <button v-if="puedeEditar" class="btnPri" type="button" @click="abrirAñadir">Añadir estreno</button>
          <div v-else class="vacioSub">Estás en modo lectura en este perfil. Cambia a tu perfil para añadir.</div>
        </div>
      </div>

      <!-- Botón inferior -->
      <div v-if="listaBase.length && puedeEditar" class="barraAñadir">
        <button class="btnAñadir" type="button" @click="abrirAñadir">
          <span class="plus" aria-hidden="true">
            <span class="v"></span>
            <span class="h"></span>
          </span>
          <span>Añadir estreno</span>
        </button>
      </div>
    </section>

    <ModalEstreno
      :abierto="modalAbierto"
      :editar="itemEditando"
      @cerrar="cerrarModal"
      @guardado="() => {}"
    />
  </div>
</template>

<style scoped>
.contenedor{
  max-width: 980px;
  margin: 0 auto;
  padding: 22px 18px 60px;
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

.logeado{ font-size: 12.5px; opacity: 0.72; }
.hola{ font-weight: 800; letter-spacing: 0.2px; }
.sub{ margin-top: 2px; font-size: 13px; opacity: 0.72; }

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

.accionesTop{
  display:flex;
  gap: 10px;
  align-items:center;
}

.btnCambio{
  border-radius: 999px;
  padding: 10px 12px;
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(255,255,255,0.55);
  cursor: pointer;
}

.bloque{ margin-top: 8px; }

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

.grid{
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
}

.filaCard{
  display:flex;
  justify-content:space-between;
  gap: 12px;
  padding: 12px;
  align-items:flex-start;
}

.left{ flex: 1; min-width: 0; }

.titulo{
  font-weight: 800;
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta{
  margin-top: 4px;
  font-size: 12.5px;
  opacity: 0.78;
  display:flex;
  align-items:center;
  gap: 8px;
  flex-wrap: wrap;
}

.chip{
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(31,42,36,0.10);
  background: rgba(255,255,255,0.55);
}

.fecha{ opacity: 0.72; }

.cuenta{
  margin-top: 8px;
  font-weight: 800;
  font-size: 13px;
  opacity: 0.9;
}

.tags{
  margin-top: 10px;
  display:flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag{
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(255,255,255,0.55);
  opacity: 0.9;
}

.comentario{
  margin: 10px 0 0;
  font-size: 12.5px;
  opacity: 0.78;
}

.accionesCard{
  display:flex;
  gap: 8px;
  align-items:flex-start;
}

.editar, .borrar{
  border: 0;
  background: transparent;
  cursor: pointer;
  opacity: 0.60;
  font-size: 14px;
  padding: 4px 6px;
}
.editar:hover, .borrar:hover{ opacity: 0.9; }

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

.barraAñadir{
  margin-top: 14px;
  display:flex;
  justify-content:center;
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

@media (max-width: 720px){
  .grid{ grid-template-columns: 1fr; }
  .controles{ grid-template-columns: 1fr; }
}

@media (max-width: 640px){

  .contenedor{
    padding: 14px 12px 90px;
  }

  .top{
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 10px;
  }

  .perfil{
    align-items: flex-start;
    gap: 10px;
    min-width: 0;
  }

  .avatar{
    width: 44px;
    height: 44px;
    border-radius: 14px;
  }

  .logeado{
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .accionesTop{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    align-items: stretch;
    width: 100%;
  }

  .btnCambio{
    width: 100%;
    justify-content: center;
    padding: 10px 12px;
    white-space: nowrap;
  }

  .controles{
    grid-template-columns: 1fr;
    gap: 10px;
    align-items: stretch;
  }

  .btnLimpiar{
    width: 100%;
  }

  .grid{
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .filaCard{
    padding: 10px;
    gap: 10px;
  }

  /* Botones más tocables */
  .editar, .borrar{
    padding: 8px 8px;
    font-size: 16px;
  }
}

.perfil{ min-width: 0; }
.left{ min-width: 0; }
.titulo{ max-width: 100%; }
</style>