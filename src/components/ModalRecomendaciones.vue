<script setup lang="ts">
import { computed } from 'vue'
import { usePerfilesStore } from '@/stores/perfiles'
import { useRecomendacionesStore } from '@/stores/recomendaciones'
import { useSeguimientosStore } from '@/stores/seguimientos'
import type { Recomendacion } from '@/types/domain'

const props = defineProps<{ abierto: boolean }>()
const emit = defineEmits<{ (e: 'cerrar'): void }>()

const perfiles = usePerfilesStore()
const recs = useRecomendacionesStore()
const seguimientos = useSeguimientosStore()

const pendientes = computed(() => recs.pendientesDelPerfilActivo)

function nombreDe(perfilId: string) {
  return perfiles.perfiles.find(p => p.id === perfilId)?.nombre ?? 'Alguien'
}

function cerrar() {
  emit('cerrar')
}

function aceptar(r: Recomendacion) {
  // Crea el seguimiento en tu lista
  // (OJO: Firestore no admite `undefined`, así que aquí evitamos mandar campos indefinidos)
  const comentario = r.mensaje
    ? `Recomendado por ${nombreDe(r.fromPerfilId)}: ${r.mensaje}`
    : `Recomendado por ${nombreDe(r.fromPerfilId)}`

  seguimientos.crear(perfiles.perfilActivoId, {
    tipo: r.tipo,
    titulo: r.titulo,
    estado: 'pendiente',
    ...(r.tipo !== 'pelicula' ? { progresoActual: 0 } : {}),
    ...(r.imagenUrl ? { imagenUrl: r.imagenUrl } : {}),
    ...(comentario ? { comentario } : {}),
  } as any)

  // Eliminamos la recomendación directamente (sin historial)
  recs.eliminar(perfiles.perfilActivoId, r.id)

  // Si ya no quedan pendientes, cerramos el modal
  if (pendientes.value.length <= 1) cerrar()
}

function rechazar(r: Recomendacion) {
  // Eliminamos la recomendación directamente
  recs.eliminar(perfiles.perfilActivoId, r.id)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="abierto" class="fondo" @click.self="cerrar" role="dialog" aria-modal="true">
        <div class="modal">
          <div class="cabecera">
            <h3>Recomendaciones</h3>
            <button class="cerrar" type="button" @click="cerrar" aria-label="Cerrar">✕</button>
          </div>

          <div class="contenido">
            <div v-if="!pendientes.length" class="vacio">
              No tienes recomendaciones pendientes 🙂
            </div>

            <div v-else class="lista">
              <div v-for="r in pendientes" :key="r.id" class="item">
                <div class="top">
                  <div class="titulo">{{ r.titulo }}</div>
                  <div class="de">de {{ nombreDe(r.fromPerfilId) }}</div>
                </div>

                <div v-if="r.mensaje" class="mensaje">“{{ r.mensaje }}”</div>

                <div class="acciones">
                  <button class="btnPri" type="button" @click="aceptar(r)">Añadir a mi lista</button>
                  <button class="btnSec" type="button" @click="rechazar(r)">Rechazar</button>
                </div>
              </div>
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
  width: min(780px, 100%);
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

.vacio{
  text-align:center;
  opacity: 0.85;
  padding: 18px 0;
}

.item{
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  padding: 12px 12px;
  display:flex;
  gap: 12px;
  align-items:flex-start;
}

.portada{
  width: 56px;
  height: 56px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.06);
  overflow:hidden;
  flex: 0 0 auto;
  display:grid;
  place-items:center;
}
.portada img{ width: 100%; height: 100%; object-fit: cover; }
.portadaVacia{ font-weight: 800; opacity: 0.85; }

.info{ flex: 1; min-width: 0; }

.titulo{
  font-weight: 800;
  letter-spacing: 0.2px;
}

.sub{
  margin-top: 2px;
  font-size: 12.5px;
  opacity: 0.78;
}

.mensaje{
  margin-top: 8px;
  font-size: 13px;
  opacity: 0.88;
  line-height: 1.35;
}

.meta{
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.70;
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items:center;
}

.pill{
  display:inline-flex;
  align-items:center;
  border-radius: 999px;
  padding: 4px 10px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
}

.acciones{
  display:flex;
  gap: 10px;
  align-items:center;
  justify-content:flex-end;
  margin-left: auto;
  flex: 0 0 auto;
}

.btnPri, .btnSec{
  border-radius: 999px;
  padding: 10px 14px;
  border: 1px solid rgba(255,255,255,0.14);
  cursor: pointer;
  white-space: nowrap;
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

.btnDanger{
  border-radius: 999px;
  padding: 10px 14px;
  border: 1px solid rgba(255,107,107,0.28);
  background: rgba(255,107,107,0.10);
  color: rgba(255,230,230,0.92);
  cursor: pointer;
}
.btnDanger:hover{ border-color: rgba(255,107,107,0.45); }

@media (max-width: 640px){
  .modal{ border-radius: 18px; max-height: calc(100dvh - 24px); }
  .item{ flex-direction: column; }
  .acciones{ width: 100%; justify-content:flex-end; }
}
</style>
