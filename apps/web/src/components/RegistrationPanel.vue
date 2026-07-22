<template>
  <div class="panel p-4">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="section-title">Inscricoes</h2>
      <q-btn dense unelevated no-caps color="secondary" icon="link" label="Link publico" />
    </div>

    <q-list separator>
      <q-item v-for="registration in registrations" :key="registration.id" class="px-0">
        <q-item-section>
          <q-item-label class="font-bold text-league-navy">{{ registration.teamName }}</q-item-label>
          <q-item-label caption>{{ registration.responsible }} - {{ registration.category }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-chip dense square :color="chipColor(registration.status)" text-color="white">{{ registration.status }}</q-chip>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
defineProps({
  registrations: {
    type: Array,
    required: true
  }
});

function chipColor(status) {
  if (status.includes('pendente')) return 'warning';
  if (status.includes('analise')) return 'primary';
  return 'secondary';
}
</script>
