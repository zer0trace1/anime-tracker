<script setup lang="ts">
import { computed } from 'vue'
import { useToastsStore } from '@/stores/toasts'

const toasts = useToastsStore()
const items = computed(() => toasts.items)

function cerrar(id: string) {
  toasts.remove(id)
}
</script>

<template>
  <Teleport to="body">
    <div class="toastWrap" aria-live="polite" aria-relevant="additions removals">
      <TransitionGroup name="toast" tag="div" class="stack">
        <div v-for="t in items" :key="t.id" class="toast" :class="`k-${t.kind}`" role="status">
          <div class="msg">{{ t.message }}</div>

          <button class="x" type="button" @click="cerrar(t.id)" aria-label="Cerrar">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toastWrap{
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}

.stack{
  position: absolute;
  top: 18px;
  right: 18px;
  display: grid;
  gap: 10px;
}

.toast{
  pointer-events: auto;
  min-width: 260px;
  max-width: min(420px, calc(100vw - 36px));
  border-radius: 16px;
  padding: 12px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  border: 1px solid rgba(31,42,36,0.14);
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(10px);
  box-shadow: 0 18px 48px rgba(0,0,0,0.14);
}

.msg{
  font-size: 13px;
  opacity: 0.92;
  line-height: 1.25;
}

.x{
  border: 0;
  background: transparent;
  cursor: pointer;
  opacity: 0.6;
  font-size: 14px;
  width: 28px;
  height: 28px;
  border-radius: 999px;
}
.x:hover{ opacity: 0.9; }

/* tipos */
.k-success{
  border-color: rgba(60,160,90,0.24);
  background: rgba(235, 255, 242, 0.70);
}
.k-error{
  border-color: rgba(200,70,70,0.26);
  background: rgba(255, 238, 238, 0.72);
}
.k-warning{
  border-color: rgba(230,170,60,0.28);
  background: rgba(255, 248, 233, 0.74);
}
.k-info{
  border-color: rgba(70,130,180,0.22);
  background: rgba(235, 245, 255, 0.72);
}

/* animaciones */
.toast-enter-active, .toast-leave-active{
  transition: transform .18s ease, opacity .18s ease;
}
.toast-enter-from{
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
.toast-leave-to{
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>