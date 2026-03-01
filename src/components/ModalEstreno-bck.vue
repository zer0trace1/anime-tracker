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
  background: rgba(20, 24, 22, 0.30);
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 20px;
  z-index: 60;
}

.modal{
  width: min(720px, 100%);
  border-radius: 22px;
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(255,255,255,0.72);
  box-shadow: 0 24px 70px rgba(0,0,0,0.18);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.cabecera{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(31,42,36,0.10);
}

.cabecera h3{ margin: 0; font-size: 16px; letter-spacing: 0.2px; }
.cerrar{
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.75;
}

.contenido{
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

.campo span{ opacity: 0.78; }
input, select, textarea{
  border-radius: 14px;
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(255,255,255,0.70);
  padding: 10px 12px;
  outline: none;
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
  border: 1px solid rgba(31,42,36,0.12);
  cursor: pointer;
}

.btnPri{
  background: rgba(31,42,36,0.92);
  color: #fff;
}

.btnSec{
  background: rgba(255,255,255,0.65);
}

@media (max-width: 640px){
  .fila{ grid-template-columns: 1fr; }
}
</style>