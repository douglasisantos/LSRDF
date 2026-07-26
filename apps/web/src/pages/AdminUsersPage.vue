<template>
  <q-page class="module-page pb-10">
    <section class="border-b border-slate-200 bg-white">
      <div class="mx-auto max-w-7xl px-4 py-6">
        <p class="auth-kicker">Segurança e acessos</p>
        <h1 class="m-0 text-3xl font-black text-league-navy">Usuários e permissões</h1>
        <p class="mt-2 text-slate-600">Aprove representantes, vincule cada um ao time correto e mantenha o acesso administrativo restrito.</p>
      </div>
    </section>
    <section class="mx-auto max-w-7xl px-4 py-6">
      <q-banner v-if="error" class="mb-4 rounded bg-red-50 text-red-800">{{ error }}</q-banner>
      <div class="panel overflow-x-auto p-4">
        <table class="access-table">
          <thead><tr><th>Pessoa</th><th>Perfil</th><th>Equipe</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td><strong>{{ user.name }}</strong><small>{{ user.email }}</small></td>
              <td>
                <select v-model="user.role">
                  <option value="user">Usuário comum</option>
                  <option value="representative">Representante</option>
                  <option value="staff">Equipe LSRDF</option>
                  <option value="admin">Administrador</option>
                </select>
              </td>
              <td><input v-model="user.teamName" :disabled="user.role !== 'representative'" placeholder="Nome exato do time" /></td>
              <td>
                <select v-model="user.status">
                  <option value="active">Ativo</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </td>
              <td><q-btn dense unelevated no-caps color="primary" label="Salvar" @click="save(user)" /></td>
            </tr>
          </tbody>
        </table>
        <p v-if="!loading && !users.length" class="p-6 text-center text-slate-500">Nenhum usuário cadastrado.</p>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useAuthStore } from '../stores/auth';
const auth = useAuthStore();
const users = ref([]);
const loading = ref(true);
const error = ref('');

async function load() {
  try {
    users.value = await auth.listUsers();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function save(user) {
  error.value = '';
  try {
    await auth.updateUser(user.id, {
      role: user.role,
      teamName: user.role === 'representative' ? (user.teamName || null) : null,
      status: user.status
    });
  } catch (err) {
    error.value = err.message;
  }
}

onMounted(load);
</script>
