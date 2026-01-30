import { createRouter, createWebHashHistory } from 'vue-router'
import SeleccionPerfilView from '@/views/SeleccionPerfilView.vue'
import InicioView from '@/views/InicioView.vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/services/firebase'
import AccesoView from '@/views/AccesoView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/acceso', component: AccesoView },
    { path: '/', name: 'seleccion-perfil', component: SeleccionPerfilView },
    { path: '/inicio', name: 'inicio', component: InicioView },
  ],
})

let listo = false
function esperarAuth() {
  return new Promise<void>((resolve) => {
    if (listo) return resolve()
    const off = onAuthStateChanged(auth, () => {
      listo = true
      off()
      resolve()
    })
  })
}

router.beforeEach(async (to) => {
  await esperarAuth()
  const logged = !!auth.currentUser
  if (!logged && to.path !== '/acceso') return '/acceso'
  if (logged && to.path === '/acceso') return '/'
})

export default router