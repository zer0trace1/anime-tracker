<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { TipoContenido, Estreno } from '@/types/domain'
import { usePerfilesStore } from '@/stores/perfiles'
import { useEstrenosStore } from '@/stores/estrenos'

const props = defineProps<{
  abierto: boolean
  editar?: Estreno | null
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardado'): void
}>()

const perfiles = usePerfilesStore()
const estrenos = useEstrenosStore()

const form = reactive({
  tipo: 'anime' as TipoContenido,
  titulo: '',
  fecha: '', // YYYY-MM-DD
  comentario: '',
  imagenUrl: '',
  etiquetasTexto: '', // "terror, comedia, shounen"
})

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return

    if (props.editar) {
      const e = props.editar
      form.tipo = e.tipo
      form.titulo = e.titulo
      form.fecha = new Date(e.fechaEstreno).toISOString().slice(0, 10)
      form.comentario = e.comentario ?? ''
      form.imagenUrl = e.imagenUrl ?? ''
      form.etiquetasTexto = (e.etiquetas ?? []).join(', ')
      return
    }

    form.tipo = 'anime'
    form.titulo = ''
    form.fecha = ''
    form.comentario = ''
    form.imagenUrl = ''
    form.etiquetasTexto = ''
  }
)

const etiquetasNormalizadas = computed(() => {
  const raw = form.etiquetasTexto
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)

  // sin duplicados
  return Array.from(new Set(raw))
})

function cerrar() {
  emit('cerrar')
}

function guardar() {
  const perfilId = perfiles.perfilActivoId

  if (!form.fecha) return // mínimo requerido

  // Guardamos a medianoche local:
  const fechaEstreno = new Date(form.fecha + 'T00:00:00').getTime()

  const payload = {
    tipo: form.tipo,
    titulo: form.titulo.trim() || 'Sin título',
    fechaEstreno,
    comentario: form.comentario.trim() || undefined,
    imagenUrl: form.imagenUrl.trim() || undefined,
    etiquetas: etiquetasNormalizadas.value.length ? etiquetasNormalizadas.value : undefined,
  }

  if (props.editar) {
    estrenos.actualizar(perfilId, props.editar.id, payload)
  } else {
    estrenos.crear(perfilId, payload)
  }

  emit('guardado')
  cerrar()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="abierto" class="fondo" @click.self="cerrar" role="dialog" aria-modal="true">
        <div class="modal">
          <div class="cabecera">
            <h3>{{ props.editar ? 'Editar estreno' : 'Añadir estreno' }}</h3>
            <button class="cerrar" type="button" @click="cerrar" aria-label="Cerrar">✕</button>
          </div>

          <form class="contenido" @submit.prevent="guardar">
            <label class="campo">
              <span>Título</span>
              <input v-model="form.titulo" placeholder="Ej. Kimetsu no Yaiba (S4)" />
            </label>

            <div class="fila">
              <label class="campo">
                <span>Tipo</span>
                <select v-model="form.tipo">
                  <option value="anime">Anime</option>
                  <option value="serie">Serie</option>
                  <option value="pelicula">Película</option>
                  <option value="manga">Manga</option>
                  <option value="manhwa">Manhwa</option>
                </select>
              </label>

              <label class="campo">
                <span>Fecha de estreno</span>
                <input type="date" v-model="form.fecha" />
              </label>
            </div>

            <div class="fila">
              <label class="campo">
                <span>Etiquetas (separadas por coma)</span>
                <input v-model="form.etiquetasTexto" placeholder="terror, comedia, aventura" />
              </label>

              <label class="campo">
                <span>URL de imagen (opcional)</span>
                <input v-model="form.imagenUrl" placeholder="https://..." />
              </label>
            </div>

            <label class="campo">
              <span>Comentario (opcional)</span>
              <textarea v-model="form.comentario" rows="3" />
            </label>

            <div class="acciones">
              <button type="button" class="btnSec" @click="cerrar">Cancelar</button>
              <button type="submit" class="btnPri">Guardar</button>
            </div>
          </form>
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
  box-shadow: var(--sombra), var(--glow);
  backdrop-filter: blur(14px);
  overflow: hidden;

  max-height: calc(100dvh - 32px);
  display:flex;
  flex-direction: column;
}

.cabecera{
  flex: 0 0 auto;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--suave);
}

.cabecera h3{ margin: 0; font-size: 16px; letter-spacing: 0.2px; }

.cerrar{
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  opacity: 0.8;
  color: var(--texto);
}
.cerrar:hover{ opacity: 1; }

.contenido{
  flex: 1 1 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;

  padding: 14px 16px 16px;
  display:grid;
  gap: 12px;
}

.fila{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.campo{
  display:grid;
  gap: 6px;
  font-size: 13px;
}
.campo span{ opacity: 0.82; }

/* ✅ Inputs visibles en modo oscuro */
input, select, textarea{
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  color: var(--texto);
  padding: 10px 12px;
  outline: none;
}
input::placeholder, textarea::placeholder{ color: rgba(235,245,255,0.55); }

input:focus, select:focus, textarea:focus{
  border-color: rgba(0,229,255,0.55);
  box-shadow: 0 0 0 3px rgba(0,229,255,0.12);
}

.chips{
  display:flex;
  flex-wrap:wrap;
  gap: 8px;
  margin-top: 6px;
}

.chip{
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  opacity: 0.92;
}

.acciones{
  display:flex;
  justify-content:flex-end;
  gap: 10px;
  margin-top: 6px;
}

.btnPri, .btnSec{
  border-radius: 999px;
  padding: 10px 14px;
  border: 1px solid rgba(255,255,255,0.14);
  cursor: pointer;
}

.btnPri{
  background: var(--btn);
  border-color: var(--btn-borde);
  color: var(--btn-texto);
  box-shadow: var(--glow);
}

.btnSec{
  background: rgba(255,255,255,0.06);
  color: var(--texto);
}

@media (max-width: 640px){
  .fila{ grid-template-columns: 1fr; }
  .modal{ border-radius: 18px; max-height: calc(100dvh - 24px); }
}
</style>
