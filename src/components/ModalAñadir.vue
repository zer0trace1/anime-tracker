<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { EstadoSeguimiento, TipoContenido } from '@/types/domain'
import { usePerfilesStore } from '@/stores/perfiles'
import { useSeguimientosStore } from '@/stores/seguimientos'
import type { Seguimiento } from '@/types/domain'
import { useToastsStore } from '@/stores/toasts'

const toasts = useToastsStore()

function parseEtiquetas(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[,;\n]+/g)         // separa por coma, ; o salto de línea
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => t.toLowerCase()) // normalizamos a minúsculas
    )
  )
}

const props = defineProps<{
  abierto: boolean
  tipoInicial: TipoContenido
  editar?: Seguimiento | null
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardado'): void
}>()

const perfiles = usePerfilesStore()
const seguimientos = useSeguimientosStore()

const form = reactive({
  tipo: props.tipoInicial as TipoContenido,
  titulo: '',
  estado: 'pendiente' as EstadoSeguimiento,
  progresoActual: 0,
  progresoTotal: undefined as number | undefined,
  nota: undefined as number | undefined,
  comentario: '',
  imagenUrl: '',
  etiquetasTexto: '',
})

const etiquetasPreview = computed(() => parseEtiquetas(form.etiquetasTexto))

const muestraProgreso = computed(() => form.tipo !== 'pelicula')

const etiquetaActual = computed(() => {
  if (form.tipo === 'anime' || form.tipo === 'serie') return 'Episodios vistos'
  return 'Capítulos leídos'
})

const etiquetaTotal = computed(() => {
  if (form.tipo === 'anime' || form.tipo === 'serie') return 'Episodios totales (opcional)'
  return 'Capítulos totales (opcional)'
})

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return

    if (props.editar) {
      const e = props.editar
      form.tipo = e.tipo
      form.titulo = e.titulo
      form.estado = e.estado
      form.progresoActual = e.progresoActual ?? 0
      form.progresoTotal = e.progresoTotal
      form.nota = e.nota
      form.comentario = e.comentario ?? ''
      form.imagenUrl = e.imagenUrl ?? ''
      form.etiquetasTexto = (e.etiquetas ?? []).join(', ')
      return
    }

    // reset al abrir (modo crear)
    form.tipo = props.tipoInicial
    form.titulo = ''
    form.estado = 'pendiente'
    form.progresoActual = 0
    form.progresoTotal = undefined
    form.nota = undefined
    form.comentario = ''
    form.imagenUrl = ''
    form.etiquetasTexto = ''
  }
)

function cerrar() {
  emit('cerrar')
}

function guardar() {
  const perfilId = perfiles.perfilActivoId

  const payload = {
    tipo: form.tipo,
    titulo: form.titulo.trim() || 'Sin título',
    estado: form.estado,
    progresoActual: muestraProgreso.value ? Number(form.progresoActual) || 0 : 0,
    progresoTotal: muestraProgreso.value && form.progresoTotal ? Number(form.progresoTotal) : undefined,
    nota: form.nota !== undefined && form.nota !== null && form.nota !== ('' as any) ? Number(form.nota) : undefined,
    comentario: form.comentario.trim() || undefined,
    imagenUrl: form.imagenUrl.trim() || undefined,
    etiquetas: etiquetasPreview.value,
  }

  if (props.editar) {
    seguimientos.actualizar(perfilId, props.editar.id, payload)
    toasts.success('Cambios guardados')
  } else {
    seguimientos.crear(perfilId, payload)
    toasts.success('Añadido a tu lista ✅')
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
            <h3>{{ props.editar ? 'Editar seguimiento' : 'Añadir seguimiento' }}</h3>
            <button class="cerrar" type="button" @click="cerrar" aria-label="Cerrar">✕</button>
          </div>

          <form class="contenido" @submit.prevent="guardar">
            <label class="campo">
              <span>Título</span>
              <input v-model="form.titulo" placeholder="Ej. Fullmetal Alchemist" />
            </label>

            <label class="campo">
              <span>Etiquetas (opcional)</span>
              <input
                v-model="form.etiquetasTexto"
                placeholder="Ej. terror, comedia, aventura"
              />

              <div v-if="etiquetasPreview.length" class="chips">
                <span v-for="t in etiquetasPreview" :key="t" class="chip">{{ t }}</span>
              </div>
            </label>

            <div class="fila">
              <label class="campo">
                <span>Sección</span>
                <select v-model="form.tipo">
                    <option value="anime">Animes</option>
                    <option value="serie">Series</option>
                    <option value="pelicula">Películas</option>
                    <option value="manga">Mangas</option>
                    <option value="manhwa">Manhwas</option>
                </select>
              </label>

              <label class="campo">
                <span>Estado</span>
                <select v-model="form.estado">
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="terminado">Terminado</option>
                  <option value="en_pausa">En pausa</option>
                  <option value="abandonado">Abandonado</option>
                </select>
              </label>
            </div>

            <div v-if="muestraProgreso" class="fila">
              <label class="campo">
                <span>{{ etiquetaActual }}</span>
                <input type="number" min="0" v-model.number="form.progresoActual" />
              </label>

              <label class="campo">
                <span>{{ etiquetaTotal }}</span>
                <input type="number" min="0" v-model.number="form.progresoTotal" />
              </label>
            </div>

            <div class="fila">
              <label class="campo">
                <span>Nota (0-10, opcional)</span>
                <input type="number" min="0" max="10" step="0.5" v-model.number="form.nota" />
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
  z-index: 50;
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

input:focus, select:focus, textarea:focus{
  border-color: rgba(31,42,36,0.20);
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
  border: 1px solid rgba(31,42,36,0.12);
  background: rgba(255,255,255,0.55);
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