<template>
  <div class="panel overflow-hidden">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-4">
      <h2 class="section-title">Campeonatos</h2>
      <q-btn dense unelevated no-caps color="primary" icon="shuffle" label="Sortear jogos" />
    </div>
    <q-table
      flat
      :rows="championships"
      :columns="columns"
      row-key="id"
      hide-pagination
      :pagination="{ rowsPerPage: 0 }"
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <span class="status-pill" :class="statusClass(props.row.status)">{{ props.row.status }}</span>
        </q-td>
      </template>
      <template #body-cell-teams="props">
        <q-td :props="props">
          <q-linear-progress
            rounded
            size="8px"
            color="secondary"
            :value="props.row.teamsCount / props.row.teamsLimit"
            class="mb-2"
          />
          <span class="text-xs font-semibold text-slate-600">{{ props.row.teamsCount }} de {{ props.row.teamsLimit }} times</span>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
defineProps({
  championships: {
    type: Array,
    required: true
  }
});

const columns = [
  { name: 'name', label: 'Competicao', field: 'name', align: 'left', sortable: true },
  { name: 'category', label: 'Categoria', field: 'category', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'left' },
  { name: 'teams', label: 'Times', field: 'teamsCount', align: 'left' }
];

function statusClass(status) {
  if (status.includes('andamento')) return 'status-pill--live';
  if (status.includes('abertas') || status.includes('Planejamento')) return 'status-pill--draft';
  return 'status-pill--closed';
}
</script>
