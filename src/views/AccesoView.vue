<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/services/firebase'
import { useToastsStore } from '@/stores/toasts'

const router = useRouter()
const email = ref('')
const password = ref('')
const toasts = useToastsStore()

async function entrar() {
  try {
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value)
    toasts.success('Sesión iniciada ✅')
    router.push('/') // a tu landing de perfiles
  } catch (e: any) {
    toasts.error('No se pudo iniciar sesión. Revisa email y contraseña.')
  }
}
</script>

<template>
  <div class="wrap">
    <div class="card">
      <h2>Acceso</h2>
      <p class="sub">Inicia sesión para sincronizar tu seguimiento ☁️</p>

      <label class="campo">
        <span>Email</span>
        <input v-model="email" type="email" autocomplete="email" />
      </label>

      <label class="campo">
        <span>Contraseña</span>
        <input v-model="password" type="password" autocomplete="current-password" />
      </label>

      <button class="btn" type="button" @click="entrar">Entrar</button>
    </div>
  </div>
</template>

<style scoped>
.wrap{ min-height:100vh; display:grid; place-items:center; padding:18px; }
.card{
  width:min(420px, 100%);
  border-radius:22px;
  border:1px solid rgba(31,42,36,0.12);
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(10px);
  box-shadow: 0 24px 70px rgba(0,0,0,0.14);
  padding: 18px;
}
.sub{ opacity:.72; margin-top:6px; }
.campo{ display:grid; gap:6px; margin-top:12px; }
input{
  border-radius:14px;
  border:1px solid rgba(31,42,36,0.12);
  background: rgba(255,255,255,0.7);
  padding:10px 12px;
  outline:none;
}
.err{ margin-top:10px; opacity:.8; }
.btn{
  margin-top:14px;
  border-radius:999px;
  padding:10px 14px;
  border:1px solid rgba(31,42,36,0.12);
  background: rgba(31,42,36,0.92);
  color:#fff;
  cursor:pointer;
}
</style>
