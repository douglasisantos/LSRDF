<template>
  <q-page class="auth-page">
    <div class="auth-shell">
      <section class="auth-brand">
        <img src="../assets/logo.png" alt="LSRDF" />
        <p class="auth-kicker">Portal seguro LSRDF</p>
        <h1>Entre na sua conta</h1>
        <p>Acompanhe campeonatos ou acesse a área da sua equipe conforme as permissões concedidas pela Liga.</p>
        <div class="auth-trust">
          <span><q-icon name="lock" /> Dados protegidos</span>
          <span><q-icon name="verified_user" /> Perfis de acesso</span>
          <span><q-icon name="privacy_tip" /> Compromisso com a LGPD</span>
        </div>
      </section>

      <section class="auth-card panel">
        <div class="auth-tabs">
          <button :class="{ active: mode === 'login' }" @click="mode = 'login'">Entrar</button>
          <button :class="{ active: mode === 'register' }" @click="mode = 'register'">Criar conta</button>
        </div>

        <form class="grid gap-4" @submit.prevent="submit">
          <q-input v-if="mode === 'register'" v-model="form.name" outlined label="Nome completo" autocomplete="name" />
          <q-input v-model="form.email" outlined type="email" label="E-mail" autocomplete="email" />
          <q-input v-model="form.password" outlined :type="showPassword ? 'text' : 'password'" label="Senha" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'">
            <template #append>
              <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPassword = !showPassword" />
            </template>
          </q-input>
          <small v-if="mode === 'register'" class="text-slate-500">Use no mínimo 10 caracteres. O perfil inicial permite acesso ao portal público.</small>

          <label v-if="mode === 'register'" class="privacy-check">
            <input v-model="form.privacyAccepted" type="checkbox" />
            <span>Li e aceito a <router-link to="/privacidade">Política de Privacidade</router-link> e os <router-link to="/termos">Termos de Uso</router-link>.</span>
          </label>

          <q-banner v-if="error" class="rounded bg-red-50 text-red-800">{{ error }}</q-banner>
          <q-btn unelevated no-caps color="primary" size="lg" :loading="loading" :label="mode === 'login' ? 'Entrar com e-mail' : 'Criar conta'" type="submit" />
        </form>

        <template v-if="auth.googleClientId">
          <div class="auth-divider"><span>ou</span></div>
          <label class="privacy-check mb-4">
            <input v-model="googlePrivacyAccepted" type="checkbox" />
            <span>Para meu primeiro acesso, aceito a <router-link to="/privacidade">Política de Privacidade</router-link>.</span>
          </label>
          <div ref="googleButton" class="google-button"></div>
        </template>

        <p class="auth-help">Representantes e colaboradores entram com uma conta comum e recebem o perfil adequado após aprovação da LSRDF.</p>
        <q-btn flat no-caps color="primary" label="Voltar ao portal público" to="/portal" class="full-width" />
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const mode = ref('login');
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);
const googlePrivacyAccepted = ref(false);
const googleButton = ref(null);
const form = reactive({ name: '', email: '', password: '', privacyAccepted: false });

function destination() {
  return ['admin', 'staff'].includes(auth.user?.role) ? '/' :
    auth.user?.role === 'representative' ? '/times-atletas' : '/portal';
}

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    if (mode.value === 'login') await auth.login(form.email, form.password);
    else await auth.register({ ...form });
    await router.push(destination());
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function handleGoogle(response) {
  error.value = '';
  try {
    await auth.loginWithGoogle(response.credential, googlePrivacyAccepted.value);
    await router.push(destination());
  } catch (err) {
    error.value = err.message;
  }
}

function renderGoogle() {
  if (!auth.googleClientId || !window.google || !googleButton.value) return;
  window.google.accounts.id.initialize({ client_id: auth.googleClientId, callback: handleGoogle });
  window.google.accounts.id.renderButton(googleButton.value, { theme: 'outline', size: 'large', width: 360, text: 'continue_with' });
}

onMounted(() => {
  if (!auth.googleClientId) return;
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.onload = renderGoogle;
  document.head.appendChild(script);
});

watch(mode, async () => {
  error.value = '';
  await nextTick();
  renderGoogle();
});
</script>
