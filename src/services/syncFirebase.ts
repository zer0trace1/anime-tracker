/*import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/services/firebase'
import { useSeguimientosStore } from '@/stores/seguimientos'
import { useRecomendacionesStore } from '@/stores/recomendaciones'

export function iniciarSyncFirebase() {
  const seg = useSeguimientosStore()
  const rec = useRecomendacionesStore()

  onAuthStateChanged(auth, (user) => {
    if (user) {
      seg.conectarFirebase()
      rec.conectarFirebase()
    } else {
      seg.desconectarFirebase()
      rec.desconectarFirebase()
    }
  })
}*/

// src/services/syncFirebase.ts
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/services/firebase'
import { useSeguimientosStore } from '@/stores/seguimientos'
import { useRecomendacionesStore } from '@/stores/recomendaciones'

export function iniciarSyncFirebase() {
  const seg = useSeguimientosStore()
  const rec = useRecomendacionesStore()

  onAuthStateChanged(auth, (user) => {
    // 👇 siempre limpia primero
    seg.desconectarFirebase()
    rec.desconectarFirebase()

    if (user) {
      seg.conectarFirebase()
      rec.conectarFirebase()
    }
  })
}