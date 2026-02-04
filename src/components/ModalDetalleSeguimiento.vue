<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue'
import type { Seguimiento, TipoContenido, EstadoSeguimiento } from '@/types/domain'

const props = defineProps<{
  abierto: boolean
  item: Seguimiento | null
  modoLectura?: boolean
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
}>()

function cerrar() {
  emit('cerrar')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') cerrar()
}

watch(
  () => props.abierto,
  (v) => {
    if (v) window.addEventListener('keydown', onKey)
    else window.removeEventListener('keydown', onKey)
  },
  { immediate: true }
)

onUnmounted(() => window.removeEventListener('keydown', onKey))

const nombresSeccion: Record<TipoContenido, string> = {
  anime: 'Anime',
  serie: 'Serie',
  pelicula: 'Película',
  manga: 'Manga',
  manhwa: 'Manhwa',
}

const nombresEstado: Record<EstadoSeguimiento, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  terminado: 'Terminado',
  en_pausa: 'En pausa',
  abandonado: 'Abandonado',
}

const muestraProgreso = computed(() => (props.item?.tipo ?? 'pelicula') !== 'pelicula')

const etiquetaActual = computed(() => {
  const t = props.item?.tipo
  if (t === 'anime' || t === 'serie') return 'Episodios vistos'
  return 'Capítulos leídos'
})

const etiquetaTotal = computed(() => {
  const t = props.item?.tipo
  if (t === 'anime' || t === 'serie') return 'Episodios totales'
  return 'Capítulos totales'
})

const updated = computed(() => {
  const ts = props.item?.updatedAt
  return ts ? new Date(ts).toLocaleString('es-ES') : null
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="abierto" class="fondo" @click.self="cerrar" role="dialog" aria-modal="true">
        <div class="modal">
          <div class="cabecera">
            <div class="cabIzq">
              <div class="titulo">{{ item?.titulo }}</div>
              <div class="sub">
                <span class="pill">{{ item ? nombresSeccion[item.tipo] : '' }}</span>
                <span v-if="item" class="pill" :class="`pill--${item.estado}`">
                  {{ nombresEstado[item.estado] }}
                </span>
                <span v-if="modoLectura" class="pill pill--lectura">Modo lectura</span>
              </div>
            </div>

            <button class="cerrar" type="button" @click="cerrar" aria-label="Cerrar">✕</button>
          </div>

          <div v-if="item" class="contenido">
            <div class="gridTop">
              <div class="portada">
                <img v-if="item.imagenUrl" :src="item.imagenUrl" alt="" />
                <div v-else class="portadaVacia">📺</div>
              </div>

              <div class="datos">
                <div v-if="muestraProgreso" class="linea">
                  <div class="label">{{ etiquetaActual }}</div>
                  <div class="value">{{ item.progresoActual ?? 0 }}</div>
                </div>

                <div v-if="muestraProgreso" class="linea">
                  <div class="label">{{ etiquetaTotal }}</div>
                  <div class="value">{{ item.progresoTotal ?? '—' }}</div>
                </div>

                <div class="linea">
                  <div class="label">Nota</div>
                  <div class="value">{{ item.nota ?? '—' }}</div>
                </div>

                <div v-if="updated" class="linea">
                  <div class="label">Última actualización</div>
                  <div class="value">{{ updated }}</div>
                </div>
                <a v-if="item.urlInteres" class="btnLink" :href="item.urlInteres" target="_blank" rel="noopener noreferrer">
                  Abrir URL de interés
                </a>
              </div>
            </div>

            <div v-if="item.etiquetas?.length" class="tags">
              <span v-for="t in item.etiquetas" :key="t" class="tag">#{{ t }}</span>
            </div>

            <div v-if="item.comentario" class="comentario">
              <div class="label">Comentario</div>
              <p>{{ item.comentario }}</p>
            </div>

            <div v-if="!item.comentario && !(item.etiquetas?.length)" class="vacio">
              Sin comentario ni etiquetas.
            </div>

            <div class="acciones">
              <button class="btn" type="button" @click="cerrar">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .16s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.fondo{
  position: fixed;
  inset: 0;
  background: rgba(20, 24, 22, 0.30);

  /* clave: que el fondo sea scrollable */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  /* mejor para móvil: arriba y con padding */
  display: flex;
  justify-content: center;
  align-items: flex-start;

  padding: 16px 12px;
  z-index: 1000; /* por encima del botón flotante */
  overscroll-behavior: contain;
}

.modal{
  width: min(720px, 100%);
  max-height: calc(100dvh - 32px); /* dvh = viewport real en móvil */
  overflow: hidden;                /* el scroll lo llevará .contenido */
  border-radius: 22px;
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(255,255,255,0.72);
  box-shadow: 0 24px 70px rgba(0,0,0,0.18);
  backdrop-filter: blur(10px);
}

.cabecera{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: 14px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(31,42,36,0.10);
}

.titulo{
  font-weight: 800;
  letter-spacing: 0.2px;
  font-size: 16px;
}

.sub{
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.pill{
  display:inline-flex;
  align-items:center;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  border: 1px solid rgba(31,42,36,0.10);
  background: rgba(255,255,255,0.55);
  opacity: 0.9;
}
.pill--lectura{
  background: rgba(230, 170, 60, 0.14);
  border-color: rgba(230, 170, 60, 0.28);
}

.pill--pendiente{ background: rgba(120,120,120,0.10); border-color: rgba(120,120,120,0.18); }
.pill--en_progreso{ background: rgba(70,130,180,0.12); border-color: rgba(70,130,180,0.22); }
.pill--terminado{ background: rgba(60,160,90,0.14); border-color: rgba(60,160,90,0.24); }
.pill--en_pausa{ background: rgba(230,170,60,0.16); border-color: rgba(230,170,60,0.28); }
.pill--abandonado{ background: rgba(200,70,70,0.14); border-color: rgba(200,70,70,0.24); }

.cerrar{
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.75;
}

.contenido{
  padding: 14px 16px 16px;
  display: grid;
  gap: 12px;

  overflow: auto; /* <- clave */
  max-height: calc(100dvh - 120px); /* ajusta según tu header/botones */
  -webkit-overflow-scrolling: touch;
}

.gridTop{
  display:grid;
  grid-template-columns: 180px 1fr;
  gap: 14px;
}

.portada{
  width: 180px;
  height: 180px;
  border-radius: 18px;
  border: 1px solid rgba(31,42,36,0.08);
  overflow:hidden;
  background: rgba(255,255,255,0.55);
  display:grid;
  place-items:center;
}
.portada img{
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.portadaVacia{ font-size: 28px; opacity: 0.7; }

.datos{
  display:grid;
  gap: 10px;
  align-content:start;
}

.linea{
  display:grid;
  grid-template-columns: 220px 1fr;
  gap: 10px;
  align-items: baseline;
}
.label{ font-size: 12.5px; opacity: 0.72; }
.value{ font-size: 13.5px; font-weight: 600; opacity: 0.9; }

.tags{
  display:flex;
  flex-wrap:wrap;
  gap: 8px;
}

.tag{
  border: 1px solid rgba(31,42,36,0.10);
  background: rgba(255,255,255,0.55);
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  opacity: 0.84;
}

.comentario .label{ margin-bottom: 6px; }
.comentario p{
  margin: 0;
  line-height: 1.45;
  opacity: 0.86;
}

.vacio{
  text-align:center;
  opacity: 0.72;
  padding: 14px 0;
}

.acciones{
  display:flex;
  justify-content:flex-end;
}

.btn{
  border-radius: 999px;
  padding: 10px 14px;
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(31,42,36,0.92);
  color: #fff;
  cursor: pointer;
}

@media (max-width: 720px){
  .gridTop{ grid-template-columns: 1fr; }
  .portada{ width: 100%; height: 220px; }
  .linea{ grid-template-columns: 1fr; }
}

.btnLink{
  font-size: 12.5px;
  opacity: 0.72;
  color:rgba(37, 167, 243, 0.966);
  font-weight: bold;
}
</style>