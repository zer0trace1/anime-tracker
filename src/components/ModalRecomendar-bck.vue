<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import type { Seguimiento } from '@/types/domain'
import { usePerfilesStore } from '@/stores/perfiles'
import { useRecomendacionesStore } from '@/stores/recomendaciones'

const props = defineProps<{
  abierto: boolean
  item: Seguimiento | null
  toPerfilId: string | null
}>()

const emit = defineEmits<{ (e: 'cerrar'): void; (e: 'enviado'): void }>()

const perfiles = usePerfilesStore()
const recs = useRecomendacionesStore()

const toPerfil = computed(() => perfiles.perfiles.find(p => p.id === props.toPerfilId) ?? null)

const form = reactive({
  mensaje: '',
})

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return
    form.mensaje = ''
  }
)

function cerrar() {
  emit('cerrar')
}

function enviar() {
  if (!props.item || !props.toPerfilId) return

  recs.enviar({
    fromPerfilId: perfiles.perfilActivoId,
    toPerfilId: props.toPerfilId,
    tipo: props.item.tipo,
    titulo: props.item.titulo,
    imagenUrl: props.item.imagenUrl,
    mensaje: form.mensaje,
    origenSeguimientoId: props.item.id,
  })

  emit('enviado')
  cerrar()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="abierto" class="fondo" @click.self="cerrar" role="dialog" aria-modal="true">
        <div class="modal">
          <div class="cabecera">
            <h3>Recomendar</h3>
            <button class="cerrar" type="button" @click="cerrar" aria-label="Cerrar">✕</button>
          </div>

          <div class="contenido" v-if="item">
            <div class="linea">
              <div class="label">Para</div>
              <div class="valor">{{ toPerfil?.nombre ?? '—' }}</div>
            </div>

            <div class="linea">
              <div class="label">Título</div>
              <div class="valor strong">{{ item.titulo }}</div>
            </div>

            <label class="campo">
              <span>Mensaje (opcional)</span>
              <textarea v-model="form.mensaje" rows="3" placeholder="Ej. Creo que te va a encantar por..." />
            </label>

            <div class="acciones">
              <button class="btnSec" type="button" @click="cerrar">Cancelar</button>
              <button class="btnPri" type="button" @click="enviar">Enviar</button>
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
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 20px;
  z-index: 60;
}

.modal{
  width: min(560px, 100%);
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
.cerrar{ border: 0; background: transparent; cursor: pointer; font-size: 16px; opacity: 0.75; }

.contenido{ padding: 14px 16px 16px; display:grid; gap: 12px; }

.linea{ display:flex; justify-content:space-between; gap: 10px; }
.label{ opacity: 0.70; font-size: 13px; }
.valor{ font-size: 13.5px; }
.strong{ font-weight: 700; }

.campo{ display:grid; gap: 6px; font-size: 13px; }
.campo span{ opacity: 0.78; }

textarea{
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
  margin-top: 4px;
}

.btnPri, .btnSec{
  border-radius: 999px;
  padding: 10px 14px;
  border: 1px solid rgba(31,42,36,0.12);
  cursor: pointer;
}

.btnPri{ background: rgba(31,42,36,0.92); color: #fff; }
.btnSec{ background: rgba(255,255,255,0.65); }
</style>
