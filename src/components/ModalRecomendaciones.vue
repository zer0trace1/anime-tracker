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
.cerrar{ border: 0; background: transparent; cursor: pointer; font-size: 16px; opacity: 0.75; }

.contenido{ padding: 14px 16px 16px; }

.vacio{ text-align:center; padding: 18px 6px; opacity: .75; }

.lista{ display:grid; gap: 10px; }

.item{
  border-radius: 18px;
  border: 1px solid rgba(31,42,36,0.10);
  background: rgba(255,255,255,0.55);
  box-shadow: 0 14px 34px rgba(0,0,0,0.06);
  padding: 12px;
}

.top{ display:flex; justify-content:space-between; gap: 10px; align-items:baseline; }
.titulo{ font-weight: 750; letter-spacing: .2px; }
.de{ opacity: .72; font-size: 13px; }

.mensaje{ margin-top: 6px; opacity: .80; font-size: 13px; }

.acciones{
  display:flex;
  gap: 10px;
  justify-content:flex-end;
  margin-top: 10px;
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