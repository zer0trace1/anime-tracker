<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePerfilesStore } from '@/stores/perfiles'
import { useSeguimientosStore } from '@/stores/seguimientos'
import type { TipoContenido, EstadoSeguimiento, Seguimiento } from '@/types/domain'
import { resolverAvatar } from '@/assets/avatares'
import ModalAñadir from '@/components/ModalAñadir.vue'

const router = useRouter()
const perfiles = usePerfilesStore()
const seguimientos = useSeguimientosStore()

const seccion = ref<TipoContenido>('anime')
const modalAbierto = ref(false)

const lista = computed(() => seguimientos.listaPorTipo(seccion.value))

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

const comentariosAbiertos = ref<Record<string, boolean>>({})

const itemEditando = ref<Seguimiento | null>(null)

function editar(item: Seguimiento) {
  itemEditando.value = item
  modalAbierto.value = true
}

function toggleComentario(id: string) {
  comentariosAbiertos.value[id] = !comentariosAbiertos.value[id]
}

function abrirAñadir() {
  modalAbierto.value = true
}

function cerrarModal() {
  modalAbierto.value = false
  itemEditando.value = null
}

function cambiarPerfil() {
  router.push('/') // vuelve a la landing tipo Netflix
}

function eliminar(item: Seguimiento) {
  seguimientos.eliminar(perfiles.perfilActivoId, item.id)
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
          <div class="hola">Hola, {{ perfiles.perfilActivo?.nombre }}</div>
          <div class="sub">Tu rincón cozy para llevar el seguimiento ✨</div>
        </div>
      </div>

      <button class="btnCambio" type="button" @click="cambiarPerfil">
        Cambiar perfil
      </button>
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
        <span class="contador">{{ lista.length }}</span>
      </div>

      <div v-if="lista.length" class="grid">
        <article v-for="item in lista" :key="item.id" class="card">
          <div class="filaCard">
            <div class="portada" :class="{ conImagen: !!item.imagenUrl }">
              <img v-if="item.imagenUrl" :src="item.imagenUrl" alt="" />
            </div>

            <div class="info">
              <div class="titulo" :title="item.titulo">{{ item.titulo }}</div>

              <div class="meta">
                <span class="estado" :class="`estado--${item.estado}`">
                  {{ nombresEstado[item.estado] }}
                </span>

                <span v-if="seccion !== 'pelicula' && (item.progresoTotal || item.progresoActual)">
                  · {{ item.progresoActual }} / {{ item.progresoTotal ?? '—' }}
                </span>

                <span v-if="item.nota !== undefined"> · ⭐ {{ item.nota }}</span>
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
                @click="toggleComentario(item.id)"
              >
                {{ comentariosAbiertos[item.id] ? 'Ver menos' : 'Ver más' }}
              </button>
            </div>

            <div class="accionesCard">
              <button class="editar" type="button" @click="editar(item)" aria-label="Editar">✎</button>
              <button class="borrar" type="button" @click="eliminar(item)" aria-label="Eliminar">✕</button>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="vacio">
        <div class="vacioCaja">
          <div class="vacioTitulo">Aún no hay nada aquí.</div>
          <div class="vacioSub">Pulsa “Añadir” para empezar tu lista de {{ nombresSeccion[seccion].toLowerCase() }}.</div>
          <button class="btnPri" type="button" @click="abrirAñadir">Añadir</button>
        </div>
      </div>
    </section>

    <button class="fab" type="button" @click="abrirAñadir" aria-label="Añadir">
      +
    </button>

    <ModalAñadir
      :abierto="modalAbierto"
      :tipo-inicial="seccion"
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
  padding: 22px 18px 90px;
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
  overflow: hidden;
}

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
  background: rgba(31,42,36,0.08);
  border: 1px solid rgba(31,42,36,0.08);
  overflow:hidden;
  flex: 0 0 auto;
}

.portada img{
  width: 100%;
  height: 100%;
  object-fit: cover;
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

/* Colores suaves (cozy) */
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
  line-clamp: 2;            /* <- estándar (para el warning) */
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

.fab{
  position: fixed;
  right: 18px;
  bottom: 18px;
  width: 56px;
  height: 56px;
  border-radius: 999px;
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(31,42,36,0.92);
  color: #fff;
  font-size: 28px;
  line-height: 0;
  cursor: pointer;
  box-shadow: 0 20px 52px rgba(0,0,0,0.20);
}

@media (max-width: 720px){
  .grid{ grid-template-columns: 1fr; }
}
</style>