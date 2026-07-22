<template>
  <q-page class="pb-12">
    <section class="bg-white">
      <div class="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[360px_1fr] lg:items-center">
        <div class="flex justify-center lg:justify-start">
          <img src="../assets/logo.png" alt="Logo LSRDF" class="h-64 w-64 object-contain" />
        </div>
        <div>
          <span class="text-sm font-black uppercase text-league-red">Portal oficial</span>
          <h1 class="mt-2 text-4xl font-black leading-tight text-league-navy md:text-5xl">Campeonatos, jogos e estatisticas da LSRDF</h1>
          <p class="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Acompanhe competicoes, tabela de jogos, classificacao, artilharia, cartoes, noticias e patrocinadores da Liga Sul Riograndense de Futsal.
          </p>
          <div class="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
            <q-input dense outlined placeholder="Buscar campeonato" v-model="search" class="sm:col-span-2">
              <template #prepend><q-icon name="search" /></template>
            </q-input>
            <q-btn unelevated no-caps color="primary" icon="filter_alt" label="Filtrar" />
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto grid max-w-7xl gap-5 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <div class="panel p-4">
        <h2 class="section-title mb-4">Competicoes em destaque</h2>
        <div class="grid gap-3">
          <article v-for="championship in filteredChampionships" :key="championship.id" class="rounded-md border border-slate-100 p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 class="m-0 text-lg font-black text-league-navy">{{ championship.name }}</h3>
                <p class="m-0 mt-1 text-sm text-slate-600">{{ championship.category }}</p>
              </div>
              <span class="status-pill" :class="statusClass(championship.status)">{{ championship.status }}</span>
            </div>
            <div class="mt-4 grid gap-2 sm:grid-cols-3">
              <q-btn outline no-caps color="primary" icon="table_chart" label="Classificacao" />
              <q-btn outline no-caps color="secondary" icon="event" label="Jogos" />
              <q-btn outline no-caps color="accent" icon="leaderboard" label="Ranking" />
            </div>
          </article>
        </div>
      </div>

      <aside class="grid gap-5">
        <div class="panel p-4">
          <h2 class="section-title mb-4">Artilharia</h2>
          <q-list separator>
            <q-item v-for="athlete in store.athletes" :key="athlete.id" class="px-0">
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white">{{ athlete.name.charAt(0) }}</q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="font-bold text-league-navy">{{ athlete.name }}</q-item-label>
                <q-item-label caption>{{ athlete.team }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <strong class="text-lg text-league-red">{{ athlete.goals }}</strong>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div class="panel p-4">
          <h2 class="section-title mb-4">Noticias</h2>
          <div class="grid gap-3">
            <article v-for="item in store.news" :key="item.id" class="rounded-md bg-league-paper p-3">
              <span class="text-xs font-black uppercase text-league-green">{{ item.tag }}</span>
              <h3 class="m-0 mt-1 text-sm font-bold text-league-navy">{{ item.title }}</h3>
            </article>
          </div>
        </div>
      </aside>

      <MatchList :matches="store.matches" class="lg:col-span-2" />
    </section>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import MatchList from '../components/MatchList.vue';
import { useLeagueStore } from '../stores/league';

const store = useLeagueStore();
const search = ref('');

const filteredChampionships = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return store.championships;
  return store.championships.filter((championship) => championship.name.toLowerCase().includes(term));
});

function statusClass(status) {
  if (status.includes('andamento')) return 'status-pill--live';
  if (status.includes('abertas') || status.includes('Planejamento')) return 'status-pill--draft';
  return 'status-pill--closed';
}

onMounted(() => {
  store.load();
});
</script>
