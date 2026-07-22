<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">
    <q-header class="app-header text-league-navy">
      <q-toolbar class="app-toolbar">
        <q-btn dense flat round icon="menu" class="lg:hidden" @click="drawer = !drawer">
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
          <q-btn unelevated no-caps color="primary" icon="description" label="Nova sumula" @click="goTo('/sumulas')" />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawer"
      show-if-above
      :breakpoint="1024"
      :width="292"
      bordered
      class="app-sidebar"
    >
      <div class="sidebar-identity">
        <img src="./assets/logo.png" alt="LSRDF" />
        <div>
          <strong>Gestao da Liga</strong>
          <span>Operacao, jogos e portal</span>
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

      <div class="sidebar-footer">
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
import { useRoute, useRouter } from 'vue-router';

const drawer = ref(false);
const route = useRoute();
const router = useRouter();

const navigation = [
  { to: '/', icon: 'dashboard', label: 'Resumo', caption: 'Indicadores gerais' },
  { to: '/campeonatos', icon: 'emoji_events', label: 'Campeonatos', caption: 'Competicoes e categorias' },
  { to: '/times-atletas', icon: 'groups', label: 'Times e atletas', caption: 'Elencos e acessos' },
  { to: '/jogos', icon: 'scoreboard', label: 'Jogos', caption: 'Rodadas e placares' },
  { to: '/sumulas', icon: 'description', label: 'Sumulas', caption: 'Pre e pos-jogo' },
  { to: '/documentos', icon: 'folder', label: 'Documentos', caption: 'Anexos e fichas' },
  { to: '/inscricoes', icon: 'how_to_reg', label: 'Inscricoes', caption: 'Analise de equipes' },
  { to: '/estrutura', icon: 'stadium', label: 'Estrutura', caption: 'Arbitros, locais e suspensoes' },
  { to: '/midia', icon: 'campaign', label: 'Midia', caption: 'Noticias e transmissoes' },
  { to: '/portal', icon: 'public', label: 'Portal publico', caption: 'Visao do torcedor' }
];

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
</script>
