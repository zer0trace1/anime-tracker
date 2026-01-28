<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePerfilesStore } from '@/stores/perfiles'
import { resolverAvatar } from '@/assets/avatares'
import { leerImagenCuadradaComoDataUrl } from '@/services/imagenes'

const router = useRouter()
const perfiles = usePerfilesStore()

// ✅ Un único input file (fuera del v-for)
const inputFoto = ref<HTMLInputElement | null>(null)
const perfilParaFoto = ref<string | null>(null)

function entrar(id: string) {
  perfiles.seleccionarPerfil(id)
  router.push('/inicio')
}

function cambiarAvatar(id: string, ev: MouseEvent) {
  ev.stopPropagation()
  perfiles.cambiarAvatar(id)
}

function elegirFoto(id: string, ev: MouseEvent) {
  ev.stopPropagation()
  perfilParaFoto.value = id

  // Opcional: limpiar para poder escoger el mismo archivo de nuevo
  if (inputFoto.value) inputFoto.value.value = ''

  inputFoto.value?.click()
}

async function onArchivoCambiado(ev: Event) {
  const target = ev.target as HTMLInputElement
  const file = target.files?.[0]
  const id = perfilParaFoto.value

  if (!file || !id) {
    perfilParaFoto.value = null
    return
  }

  // Recorta a cuadrado y comprime (importante para localStorage)
  const dataUrl = await leerImagenCuadradaComoDataUrl(file, 320, 0.85)
  perfiles.establecerAvatarPersonalizado(id, dataUrl)

  // reset
  target.value = ''
  perfilParaFoto.value = null
}

function quitarFoto(id: string, ev: MouseEvent) {
  ev.stopPropagation()
  perfiles.quitarAvatarPersonalizado(id)
}
</script>

<template>
  <div class="pantalla">
    <div class="cabecera">
      <div class="marca">
        <span class="punto" />
        <h1>Track Anime</h1>
      </div>
      <p class="sub">Elige tu perfil para continuar</p>
    </div>

    <div class="grid">
      <button
        v-for="p in perfiles.perfiles"
        :key="p.id"
        class="tarjeta"
        type="button"
        @click="entrar(p.id)"
        :aria-label="`Entrar como ${p.nombre}`"
      >
        <div class="avatarWrap">
          <img
            class="avatar"
            :src="resolverAvatar(p.avatarId, p.avatarPersonalizado)"
            :alt="`Avatar de ${p.nombre}`"
          />
        </div>

        <div class="nombre">{{ p.nombre }}</div>

        <div class="acciones">
          <span class="pista">Pulsa para entrar</span>
          <span class="separador">·</span>
          <span class="link" role="button" @click="cambiarAvatar(p.id, $event)">Cambiar avatar</span>
          <span class="separador">·</span>
          <span class="link" role="button" @click="elegirFoto(p.id, $event)">Elegir foto</span>
          <span v-if="p.avatarPersonalizado" class="separador">·</span>
          <span v-if="p.avatarPersonalizado" class="link" role="button" @click="quitarFoto(p.id, $event)">Quitar</span>
        </div>
      </button>
    </div>

    <!-- ✅ Input único, fuera del v-for -->
    <input
      ref="inputFoto"
      type="file"
      accept="image/*"
      style="display:none"
      @change="onArchivoCambiado"
    />

    <div class="pie">
      <span class="nota">Cozy · Sencilla · Minimalista</span>
    </div>
  </div>
</template>

<style scoped>
.pantalla{
  min-height: 100dvh;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  padding: 40px 18px;
}

.cabecera{
  text-align:center;
  margin-bottom: 26px;
}

.marca{
  display:inline-flex;
  align-items:center;
  gap: 10px;
}

.punto{
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: rgba(31, 42, 36, 0.20);
  box-shadow: 0 0 0 6px rgba(31, 42, 36, 0.06);
}

h1{
  margin: 0;
  font-size: 28px;
  letter-spacing: 0.2px;
}

.sub{
  margin: 10px 0 0;
  opacity: 0.75;
}

.grid{
  display:grid;
  grid-template-columns: repeat(2, minmax(180px, 240px));
  gap: 16px;
  margin-top: 12px;
}

.tarjeta{
  background: var(--tarjeta);
  border: 1px solid var(--tarjeta-borde);
  border-radius: var(--radio);
  padding: 18px 16px 14px;
  box-shadow: var(--sombra);
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  text-align:center;
  backdrop-filter: blur(8px);
}

.tarjeta:hover{
  transform: translateY(-3px);
  border-color: var(--suave-2);
  box-shadow: 0 18px 42px rgba(0,0,0,0.10);
}

.avatarWrap{
  width: 120px;
  height: 120px;
  border-radius: 34px;
  margin: 0 auto 12px;
  padding: 10px;
  background: rgba(255,255,255,0.45);
  border: 1px solid rgba(31,42,36,0.08);
}

.avatar{
  width: 100%;
  height: 100%;
  border-radius: 28px;
  display:block;
  object-fit: cover;
  object-position: center;
}

.nombre{
  font-size: 18px;
  font-weight: 650;
  letter-spacing: 0.2px;
  margin-top: 6px;
}

.acciones{
  margin-top: 10px;
  font-size: 12.5px;
  opacity: 0.78;
  display:flex;
  justify-content:center;
  gap: 8px;
  align-items:center;
  flex-wrap: wrap;
}

.link{
  text-decoration: underline;
  text-underline-offset: 3px;
}

.pie{
  margin-top: 22px;
  opacity: 0.65;
  font-size: 12.5px;
}

@media (max-width: 520px){
  .grid{
    grid-template-columns: 1fr;
    width: min(360px, 100%);
  }
}
</style>
