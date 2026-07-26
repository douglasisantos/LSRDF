<template>
  <q-page class="legal-page">
    <div class="panel mx-auto max-w-2xl p-6 md:p-9">
      <p class="auth-kicker">Inscrições LSRDF</p>
      <h1 class="mb-2 mt-2 text-3xl font-black text-league-navy">Solicitar inscrição de equipe</h1>
      <p class="mb-6 text-slate-600">Envie os dados iniciais. A Liga analisará a solicitação e orientará o responsável sobre documentos e acesso de representante.</p>
      <form class="grid gap-4" @submit.prevent="submit">
        <q-input v-model="form.teamName" outlined label="Nome da equipe" />
        <q-input v-model="form.responsible" outlined label="Nome do responsável" />
        <q-input v-model="form.email" outlined type="email" label="E-mail para contato" />
        <q-input v-model="form.phone" outlined type="tel" label="Telefone para contato" />
        <q-select v-model="form.category" outlined label="Categoria" :options="categories" />
        <label class="privacy-check">
          <input v-model="form.privacyAccepted" type="checkbox" />
          <span>Li a <router-link to="/privacidade">Política de Privacidade</router-link> e autorizo o uso destes dados para analisar a inscrição.</span>
        </label>
        <q-banner v-if="message" :class="success ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-800'" class="rounded">{{ message }}</q-banner>
        <q-btn unelevated no-caps color="primary" size="lg" label="Enviar solicitação" :loading="loading" type="submit" />
        <q-btn flat no-caps color="primary" label="Voltar ao portal" to="/portal" />
      </form>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useLeagueStore } from '../stores/league';
const store = useLeagueStore();
const form = reactive({ teamName: '', responsible: '', email: '', phone: '', category: '', privacyAccepted: false });
const loading = ref(false);
const message = ref('');
const success = ref(false);
const categories = computed(() => store.categories.map((item) => item.name));

async function submit() {
  loading.value = true;
  message.value = '';
  success.value = false;
  try {
    await store.create('/api/registrations', { ...form });
    success.value = true;
    message.value = 'Solicitação enviada. A LSRDF entrará em contato pelos canais informados oficialmente.';
    Object.assign(form, { teamName: '', responsible: '', email: '', phone: '', category: '', privacyAccepted: false });
  } catch (error) {
    message.value = error.message;
  } finally {
    loading.value = false;
  }
}
onMounted(store.load);
</script>
