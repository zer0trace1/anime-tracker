<template>
  <div class="pantalla">
    <img class="totoro" src="@/assets/decor/totoro-gif.gif" alt="" aria-hidden="true" />
    <div class="contenido">
      <h1 class="titulo">Track Anime</h1>
      <!-- UBICACION TEMPORAL BOTON LOGOUT -->
      <button class="btnCambio" type="button" @click="logout">
        Cerrar sesión
      </button> 
      <p class="sub">
        Estás logeado como: <strong>{{ usuarioNombre }}</strong>
      </p>
      <p class="sub2">Elige tu perfil para continuar</p>

      <div class="grid">
        <div
          v-for="p in perfilesStore.perfiles"
          :key="p.id"
          class="card"
          @click="entrar(p.id)"
        >
          <div class="avatarWrap">
            <!-- Si hay foto personalizada, mostramos esa -->
            <img v-if="p.avatarPersonalizado" :src="p.avatarPersonalizado" class="avatarImg" />
            <!-- Si no, fallback simple con inicial -->
            <div v-else class="avatarFallback">{{ (p.nombre || '?').slice(0, 1).toUpperCase() }}</div>
          </div>

          <div class="nombre">{{ p.nombre }}</div>

          <div class="acciones" @click.stop>
            <span class="mini">Pulsa para entrar</span>

            <template v-if="esSoloLectura(p.id)">
              <span class="chip">Solo lectura</span>
            </template>

            <template v-else>
              <button class="link" type="button" @click="cambiarAvatar(p.id)">
                Cambiar avatar
              </button>

              <button class="link" type="button" @click="abrirSelectorFoto(p.id)">
                Elegir foto
              </button>

              <button
                v-if="p.avatarPersonalizado"
                class="link danger"
                type="button"
                @click="quitarFoto(p.id)"
              >
                Quitar
              </button>
            </template>
          </div>
        </div>
      </div>

      <p class="footer">Cozy · Sencilla · Minimalista</p>

      <!-- input real para elegir archivo -->
      <input
        ref="inputFoto"
        class="hidden"
        type="file"
        accept="image/*"
        @change="onArchivoCambiado"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePerfilesStore } from '@/stores/perfiles'
import { useSesionStore } from '@/stores/sesion'

const router = useRouter()
const perfilesStore = usePerfilesStore()
const sesion = useSesionStore()

const usuarioNombre = computed(() => sesion.nombreLogeado || '-')
const perfilPropioId = computed(() => sesion.perfilPropioId || '')

const esSoloLectura = (perfilId: string) => perfilId !== perfilPropioId.value

function entrar(perfilId: string) {
  perfilesStore.seleccionarPerfil(perfilId)
  router.push('/inicio')
}

function cambiarAvatar(perfilId: string) {
  if (esSoloLectura(perfilId)) return
  perfilesStore.cambiarAvatar(perfilId)
}

async function logout() {
  await sesion.logout()
  router.push('/acceso')
}

/** selector de foto */
const inputFoto = ref<HTMLInputElement | null>(null)
const perfilParaFoto = ref<string | null>(null)

function abrirSelectorFoto(perfilId: string) {
  if (esSoloLectura(perfilId)) return
  perfilParaFoto.value = perfilId
  inputFoto.value?.click()
}

function quitarFoto(perfilId: string) {
  if (esSoloLectura(perfilId)) return
  perfilesStore.quitarAvatarPersonalizado(perfilId)
}

async function onArchivoCambiado(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files?.[0]
  const perfilId = perfilParaFoto.value

  // para poder seleccionar el mismo archivo 2 veces seguidas
  el.value = ''

  if (!file || !perfilId) return
  if (esSoloLectura(perfilId)) return

  // 🔥 Importante: reducimos tamaño para no reventar el límite de Firestore (1MB/doc)
  const dataUrl = await fileToDataUrlResized(file, 256, 0.85)

  perfilesStore.establecerAvatarPersonalizado(perfilId, dataUrl)
}

function fileToDataUrlResized(file: File, maxSide = 256, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('La imagen no es válida'))
      img.onload = () => {
        const ratio = Math.min(maxSide / img.width, maxSide / img.height, 1)
        const w = Math.round(img.width * ratio)
        const h = Math.round(img.height * ratio)

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas no disponible'))

        ctx.drawImage(img, 0, 0, w, h)

        // jpeg para que pese poco (y no exceder Firestore)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
</script>

<style scoped>
.pantalla {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 40px 16px;
  position: relative;
}
/* Totoro caminando */
.totoro{
  position: fixed;
  left: -180px;
  bottom: 16px;
  width: 140px;
  height: auto;
  opacity: 0.9;
  pointer-events: none;
  z-index: 0;
  filter: drop-shadow(0 10px 18px rgba(0,0,0,0.14));
  animation: totoro-walk 18s linear infinite;
}

@keyframes totoro-walk{
  0%   { transform: translateX(0); }
  100% { transform: translateX(calc(100vw + 360px)); }
}

@media (prefers-reduced-motion: reduce){
  .totoro{ animation: none; left: 16px; }
}
.contenido {
  width: min(920px, 100%);
  text-align: center;
}
.titulo {
  font-size: 36px;
  font-weight: 800;
  margin: 0 0 8px;
}
.sub {
  margin: 0;
  opacity: 0.8;
}
.sub2 {
  margin: 8px 0 28px;
  opacity: 0.75;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 18px;
  justify-content: center;
  align-items: stretch;
}
@media (max-width: 680px) {
  .grid { grid-template-columns: 1fr; }
}
.card {
  background: rgba(255,255,255,0.75);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 18px;
  padding: 18px 16px 14px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 26px 60px rgba(0,0,0,0.10);
}
.avatarWrap {
  width: 96px;
  height: 96px;
  margin: 6px auto 12px;
  border-radius: 24px;
  background: rgba(255,255,255,0.75);
  border: 1px solid rgba(0,0,0,0.06);
  display: grid;
  place-items: center;
  overflow: hidden;
}
.avatarImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatarFallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 42px;
  font-weight: 800;
  color: rgba(0,0,0,0.35);
}
.nombre {
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 8px;
}
.acciones {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  align-items: center;
}
.mini {
  font-size: 12px;
  opacity: 0.7;
}
.link {
  background: transparent;
  border: 0;
  padding: 0;
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
  opacity: 0.85;
}
.link:hover { opacity: 1; }
.danger { color: #b42318; }

.chip {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.55);
  opacity: 0.9;
}
.footer {
  margin-top: 26px;
  font-size: 12px;
  opacity: 0.6;
}
.hidden { display: none; }
</style>