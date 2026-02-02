import { defineStore } from 'pinia'

export type ToastKind = 'success' | 'error' | 'info' | 'warning'

export type Toast = {
  id: string
  message: string
  kind: ToastKind
  duration: number // ms
  createdAt: number
}

type EstadoToasts = {
  items: Toast[]
  timers: Record<string, number>
}

const MAX_TOASTS = 4
const DEFAULT_DURATION = 2600

export const useToastsStore = defineStore('toasts', {
  state: (): EstadoToasts => ({
    items: [],
    timers: {},
  }),

  actions: {
    push(message: string, opts?: { kind?: ToastKind; duration?: number }) {
      const id = crypto.randomUUID()
      const kind = opts?.kind ?? 'info'
      const duration = opts?.duration ?? DEFAULT_DURATION

      // si hay demasiados, quitamos el más viejo
      if (this.items.length >= MAX_TOASTS) {
        const old = this.items[0]
        if (old) this.remove(old.id)
      }

      const toast: Toast = { id, message, kind, duration, createdAt: Date.now() }
      this.items.push(toast)

      // auto-dismiss
      const t = window.setTimeout(() => this.remove(id), duration)
      this.timers[id] = t

      return id
    },

    success(message: string, duration?: number) {
      return this.push(message, { kind: 'success', duration })
    },
    error(message: string, duration?: number) {
      return this.push(message, { kind: 'error', duration: duration ?? 3600 })
    },
    info(message: string, duration?: number) {
      return this.push(message, { kind: 'info', duration })
    },
    warning(message: string, duration?: number) {
      return this.push(message, { kind: 'warning', duration: duration ?? 3200 })
    },

    remove(id: string) {
      const timer = this.timers[id]
      if (timer) {
        clearTimeout(timer)
        delete this.timers[id]
      }
      this.items = this.items.filter(t => t.id !== id)
    },

    clear() {
      Object.values(this.timers).forEach((t) => clearTimeout(t))
      this.timers = {}
      this.items = []
    },
  },
})