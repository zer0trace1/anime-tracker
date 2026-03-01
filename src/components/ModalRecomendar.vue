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

.valor{
  font-weight: 800;
  letter-spacing: 0.2px;
}

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
