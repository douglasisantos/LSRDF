<template>
  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <router-link v-for="feature in features" :key="feature.title" :to="feature.to" class="panel block p-4 no-underline transition hover:-translate-y-0.5 hover:shadow-lg">
      <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-md" :class="feature.bg">
        <q-icon :name="feature.icon" size="22px" :class="feature.color" />
      </div>
      <h3 class="mb-1 text-sm font-extrabold text-league-navy">{{ feature.title }}</h3>
      <p class="m-0 text-sm leading-6 text-slate-600">{{ feature.description }}</p>
    </router-link>
  </div>
</template>

<script setup>
defineProps({
  features: {
    type: Array,
    required: true
  }
});
</script>
