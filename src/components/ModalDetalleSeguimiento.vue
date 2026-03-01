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
  /*background: rgba(0,0,0,0.62);*/
  background:
  radial-gradient(900px 520px at 82% 20%, rgba(0, 255, 240, 0.10), transparent 60%),
  radial-gradient(900px 700px at 60% 95%, rgba(255, 0, 255, 0.08), transparent 55%),
  rgba(0,0,0,0.55);
  backdrop-filter: blur(2px);
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 16px;
  z-index: 60;
  overflow: auto;
}

.modal{
  width: min(720px, 100%);
  border-radius: 22px;
  border: 1px solid var(--tarjeta-borde);
  background: var(--tarjeta);
  box-shadow: var(--sombra);
  backdrop-filter: blur(12px);

  max-height: calc(100dvh - 32px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cabecera{
  flex: 0 0 auto;
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--suave-2);
}

.cerrar{
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.8;
  color: var(--texto);
}

.contenido{
  flex: 1 1 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;

  padding: 14px 16px 16px;
  display:grid;
  gap: 12px;
}

.titulo{
  font-weight: 900;
  letter-spacing: 0.2px;
  font-size: 16px;
  color: var(--texto);
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
  border: 1px solid var(--tarjeta-borde);
  background: var(--chip);
  color: var(--texto);
  opacity: 0.92;
}
.pill--lectura{
  border-color: rgba(255, 232, 120, 0.25);
  background: rgba(255, 232, 120, 0.10);
  color: rgba(255, 232, 120, 0.95);
}

.pill--pendiente{ border-color: rgba(180, 186, 200, 0.24); background: rgba(180,186,200,0.10); }
.pill--en_progreso{ border-color: rgba(0, 255, 240, 0.24); background: rgba(0,255,240,0.08); }
.pill--terminado{ border-color: rgba(0, 255, 150, 0.22); background: rgba(0,255,150,0.08); }
.pill--en_pausa{ border-color: rgba(255, 232, 120, 0.24); background: rgba(255,232,120,0.10); }
.pill--abandonado{ border-color: rgba(255, 84, 156, 0.26); background: rgba(255,84,156,0.10); }

.gridTop{
  display:grid;
  grid-template-columns: 180px 1fr;
  gap: 14px;
}

.portada{
  width: 180px;
  height: 180px;
  border-radius: 18px;
  border: 1px solid var(--tarjeta-borde);
  overflow:hidden;
  background: var(--chip);
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
.label{ font-size: 12.5px; opacity: 0.78; }
.value{ font-size: 13.5px; font-weight: 700; opacity: 0.95; }

.tags{
  display:flex;
  flex-wrap:wrap;
  gap: 8px;
}

.tag{
  border: 1px solid var(--tarjeta-borde);
  background: var(--chip);
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  opacity: 0.9;
  color: var(--texto);
}

.comentario .label{ margin-bottom: 6px; }
.comentario p{
  margin: 0;
  line-height: 1.45;
  opacity: 0.9;
}

.vacio{
  text-align:center;
  opacity: 0.72;
  padding: 14px 0;
}

.acciones{
  display:flex;
  justify-content:flex-end;
  margin-top: 6px;
}

.btn{
  border-radius: 999px;
  padding: 10px 14px;
  border: 1px solid var(--tarjeta-borde);
  background: var(--btn);
  color: var(--btn-texto);
  cursor: pointer;
  box-shadow: 0 0 18px rgba(0, 255, 240, 0.10);
}

.btn:hover{
  box-shadow: 0 0 0 3px rgba(255, 0, 255, 0.12), 0 0 0 1px rgba(0, 255, 240, 0.20), 0 0 22px rgba(0, 255, 240, 0.12);
}

.btnLink{
  font-size: 12.5px;
  opacity: 0.9;
  color: var(--link);
  font-weight: 800;
}

@media (max-width: 720px){
  .gridTop{ grid-template-columns: 1fr; }
  .portada{ width: 100%; height: 220px; }
  .linea{ grid-template-columns: 1fr; }
}
</style>