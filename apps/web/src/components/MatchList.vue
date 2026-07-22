<template>
  <div class="panel overflow-hidden">
    <div class="flex items-center justify-between border-b border-slate-100 p-4">
      <h2 class="section-title">Jogos e rodadas</h2>
      <q-btn dense flat round icon="calendar_month" color="primary">
        <q-tooltip>Calendario de jogos</q-tooltip>
      </q-btn>
    </div>
    <q-list separator>
      <q-item v-for="match in matches" :key="match.id" class="py-4">
        <q-item-section>
          <div class="mb-1 text-xs font-bold uppercase text-slate-500">{{ match.round }} - {{ formatDate(match.date) }}</div>
          <div class="flex flex-wrap items-center gap-3 text-base font-black text-league-navy">
            <span>{{ match.homeTeam }}</span>
            <span class="rounded bg-league-navy px-3 py-1 text-white">{{ match.score }}</span>
            <span>{{ match.awayTeam }}</span>
          </div>
          <div class="mt-1 text-sm text-slate-500">{{ match.venue }}</div>
        </q-item-section>
        <q-item-section side>
          <q-btn
            dense
            outline
            no-caps
            color="primary"
            icon="description"
            label="Sumula"
            :to="{ path: '/sumulas', query: { matchId: match.id } }"
          />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
defineProps({
  matches: {
    type: Array,
    required: true
  }
});

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T12:00:00`));
}
</script>
