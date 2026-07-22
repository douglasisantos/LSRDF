<template>
  <q-page class="pb-12">
    <section class="league-band text-white">
      <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_360px] lg:items-center">
        <div>
          <div class="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-bold">
            <q-icon name="sports_soccer" />
            Gestao profissional para futsal regional
          </div>
          <h1 class="mb-4 max-w-3xl text-4xl font-black leading-tight md:text-5xl">Liga Sul Riograndense de Futsal</h1>
          <p class="max-w-2xl text-lg leading-8 text-white/82">
            Plataforma para organizar campeonatos, automatizar tabelas, controlar inscricoes, publicar jogos e acompanhar estatisticas de atletas e equipes.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <q-btn unelevated no-caps color="secondary" icon="add_circle" label="Criar campeonato" to="/campeonatos" />
            <q-btn outline no-caps text-color="white" icon="description" label="Nova sumula" to="/sumulas" />
            <q-btn outline no-caps text-color="white" icon="public" label="Ver portal publico" to="/portal" />
          </div>
        </div>
        <div class="panel bg-white p-5 text-league-navy">
          <img src="../assets/logo.png" alt="Logo LSRDF" class="mx-auto h-56 w-56 object-contain" />
          <div class="mt-3 rounded-md bg-league-paper p-4">
            <div class="text-sm font-bold uppercase text-slate-500">Proxima decisao</div>
            <div class="mt-1 text-xl font-black">Copa Sul Riograndense 2026</div>
            <div class="mt-1 text-sm text-slate-600">Rodada dupla no Ginasio Municipal</div>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-8">
      <q-banner v-if="store.offline" class="mb-5 rounded-md bg-amber-50 text-amber-900">
        A API nao respondeu. A tela esta usando dados locais de demonstracao.
      </q-banner>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Campeonatos" :value="store.overview.championships" hint="Ativos e em planejamento" icon="emoji_events" icon-bg="bg-blue-50" icon-color="text-league-navy" />
        <MetricCard label="Times" :value="store.overview.teams" hint="Com painel de treinador" icon="groups" icon-bg="bg-green-50" icon-color="text-league-green" />
        <MetricCard label="Atletas" :value="store.overview.athletes" hint="Base cadastrada" icon="badge" icon-bg="bg-yellow-50" icon-color="text-yellow-700" />
        <MetricCard label="Jogos" :value="store.overview.matches" hint="Rodadas registradas" icon="scoreboard" icon-bg="bg-red-50" icon-color="text-league-red" />
        <MetricCard label="Inscricoes" :value="store.overview.pendingRegistrations" hint="Pendentes de revisao" icon="how_to_reg" icon-bg="bg-slate-100" icon-color="text-league-navy" />
      </div>
    </section>

    <section class="mx-auto grid max-w-7xl gap-5 px-4 lg:grid-cols-[1fr_380px]">
      <StandingsTable :championships="store.championships" />
      <RegistrationPanel :registrations="store.registrations" />
      <MatchList :matches="store.matches" class="lg:col-span-2" />
    </section>

    <section class="mx-auto max-w-7xl px-4 py-8">
      <h2 class="section-title mb-4">Modulos</h2>
      <FeatureGrid :features="features" />
    </section>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue';
import { useLeagueStore } from '../stores/league';
import FeatureGrid from '../components/FeatureGrid.vue';
import MatchList from '../components/MatchList.vue';
import MetricCard from '../components/MetricCard.vue';
import RegistrationPanel from '../components/RegistrationPanel.vue';
import StandingsTable from '../components/StandingsTable.vue';

const store = useLeagueStore();

const features = [
  { to: '/campeonatos', icon: 'emoji_events', title: 'Campeonatos', description: 'Competicoes e categorias.', bg: 'bg-blue-50', color: 'text-league-navy' },
  { to: '/times-atletas', icon: 'groups', title: 'Times e atletas', description: 'Elencos, atletas e acesso dos times.', bg: 'bg-red-50', color: 'text-league-red' },
  { to: '/jogos', icon: 'scoreboard', title: 'Jogos', description: 'Calendario, rodadas e placares.', bg: 'bg-green-50', color: 'text-league-green' },
  { to: '/sumulas', icon: 'description', title: 'Sumulas', description: 'Registro pre-jogo e pos-jogo.', bg: 'bg-slate-100', color: 'text-league-navy' },
  { to: '/documentos', icon: 'folder', title: 'Documentos', description: 'Fichas, anexos e comprovantes.', bg: 'bg-yellow-50', color: 'text-yellow-700' },
  { to: '/inscricoes', icon: 'how_to_reg', title: 'Inscricoes', description: 'Entrada e status das equipes.', bg: 'bg-green-50', color: 'text-league-green' },
  { to: '/estrutura', icon: 'stadium', title: 'Estrutura', description: 'Arbitros, locais e suspensoes.', bg: 'bg-blue-50', color: 'text-league-navy' },
  { to: '/midia', icon: 'campaign', title: 'Midia', description: 'Noticias, transmissoes e patrocinio.', bg: 'bg-red-50', color: 'text-league-red' }
];

onMounted(() => {
  store.load();
});
</script>
