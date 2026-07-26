<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">
    <q-header class="app-header text-league-navy">
      <q-toolbar class="app-toolbar">
        <q-btn v-if="showPrivateLayout" dense flat round icon="menu" class="lg:hidden" @click="drawer = !drawer">
          <q-tooltip>Menu</q-tooltip>
        </q-btn>

        <button type="button" class="brand-button" @click="goTo('/')">
          <img src="./assets/logo.png" alt="LSRDF" class="brand-logo" />
          <span>
            <strong>LSRDF</strong>
            <small>Liga Sul Riograndense de Futsal</small>
          </span>
        </button>

        <q-space />

        <div class="hidden items-center gap-2 md:flex">
          <q-btn flat no-caps color="primary" icon="public" label="Portal publico" @click="goTo('/portal')" />
          <q-btn v-if="auth.isStaff" unelevated no-caps color="primary" icon="description" label="Nova sumula" @click="goTo('/sumulas')" />
          <q-btn v-if="!auth.isAuthenticated" outline no-caps color="primary" icon="login" label="Entrar" @click="goTo('/login')" />
          <q-btn v-else flat no-caps color="primary" icon="logout" :label="auth.user.name" @click="logout" />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawer"
      v-if="showPrivateLayout"
      show-if-above
      :breakpoint="1024"
      :width="292"
      bordered
      class="app-sidebar"
    >
        <div class="sidebar-identity">
        <img src="./assets/logo.png" alt="LSRDF" />
        <div>
            <strong>{{ auth.isRepresentative ? 'Painel da equipe' : 'Gestao da Liga' }}</strong>
            <span>{{ auth.user?.teamName || roleLabel }}</span>
        </div>
      </div>

      <q-list padding class="sidebar-nav">
        <q-item
          v-for="item in navigation"
          :key="item.to"
          clickable
          v-ripple
          :active="isActive(item.to)"
          active-class="sidebar-active"
          class="nav-item"
          @click="goTo(item.to)"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="nav-label">{{ item.label }}</q-item-label>
            <q-item-label caption class="nav-caption">{{ item.caption }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <div v-if="auth.isStaff" class="sidebar-footer">
        <q-btn unelevated no-caps color="secondary" icon="add_circle" label="Criar campeonato" class="full-width" @click="goTo('/campeonatos')" />
      </div>
    </q-drawer>

    <q-page-container class="app-content">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';

const drawer = ref(false);
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const allNavigation = [
  { to: '/', icon: 'dashboard', label: 'Resumo', caption: 'Indicadores gerais', roles: ['staff', 'admin'] },
  { to: '/campeonatos', icon: 'emoji_events', label: 'Campeonatos', caption: 'Competicoes e categorias', roles: ['staff', 'admin'] },
  { to: '/times-atletas', icon: 'groups', label: 'Times e atletas', caption: 'Elencos e acessos', roles: ['representative', 'staff', 'admin'] },
  { to: '/jogos', icon: 'scoreboard', label: 'Jogos', caption: 'Rodadas e placares', roles: ['staff', 'admin'] },
  { to: '/sumulas', icon: 'description', label: 'Sumulas', caption: 'Pre e pos-jogo', roles: ['staff', 'admin'] },
  { to: '/documentos', icon: 'folder', label: 'Documentos', caption: 'Anexos e fichas', roles: ['representative', 'staff', 'admin'] },
  { to: '/inscricoes', icon: 'how_to_reg', label: 'Inscricoes', caption: 'Analise de equipes', roles: ['representative', 'staff', 'admin'] },
  { to: '/estrutura', icon: 'stadium', label: 'Estrutura', caption: 'Arbitros, locais e suspensoes', roles: ['staff', 'admin'] },
  { to: '/midia', icon: 'campaign', label: 'Midia', caption: 'Noticias e transmissoes', roles: ['staff', 'admin'] },
  { to: '/usuarios', icon: 'admin_panel_settings', label: 'Usuários e acessos', caption: 'Perfis e equipes', roles: ['admin'] },
  { to: '/portal', icon: 'public', label: 'Portal publico', caption: 'Visao do torcedor', roles: ['representative', 'staff', 'admin'] }
];
const navigation = computed(() => allNavigation.filter((item) => !item.roles || item.roles.includes(auth.user?.role)));
const showPrivateLayout = computed(() => auth.isAuthenticated && !['portal', 'login', 'privacy', 'terms', 'public-registration'].includes(route.name));
const roleLabel = computed(() => ({
  admin: 'Administrador',
  staff: 'Equipe LSRDF',
  representative: 'Representante',
  user: 'Usuario'
}[auth.user?.role] || ''));

function isActive(path) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path);
}

async function goTo(path) {
  if (route.path !== path) {
    await router.push(path);
  }

  if (window.innerWidth < 1024) {
    drawer.value = false;
  }
}

async function logout() {
  await auth.logout();
  await router.push('/portal');
}
</script>
