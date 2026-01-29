import { createRouter, createWebHashHistory } from 'vue-router'
import SeleccionPerfilView from '@/views/SeleccionPerfilView.vue'
import InicioView from '@/views/InicioView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'seleccion-perfil', component: SeleccionPerfilView },
    { path: '/inicio', name: 'inicio', component: InicioView },
  ],
})

export default router