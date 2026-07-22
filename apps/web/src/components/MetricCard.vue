<template>
  <article class="panel p-4">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="m-0 text-xs font-bold uppercase text-slate-500">{{ label }}</p>
        <strong class="mt-1 block text-3xl font-black text-league-navy">{{ value }}</strong>
      </div>
      <div class="flex h-11 w-11 items-center justify-center rounded-md" :class="iconBg">
        <q-icon :name="icon" size="24px" :class="iconColor" />
      </div>
    </div>
    <p class="m-0 mt-3 text-sm text-slate-600">{{ hint }}</p>
  </article>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, required: true },
  icon: { type: String, required: true },
  iconBg: { type: String, default: 'bg-blue-50' },
  iconColor: { type: String, default: 'text-league-navy' }
});
</script>
