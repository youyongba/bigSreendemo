<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  className: { type: String, default: '' },
  testId: { type: String, default: undefined },
});
</script>

<template>
  <section
    :data-testid="testId"
    :class="[
      'flex flex-col min-h-0 h-full bg-[#0E182B] border border-slate-800/90 rounded-lg overflow-hidden',
      className,
    ]"
  >
    <header class="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-slate-800/80 bg-[#111F38]/80 shrink-0">
      <div class="flex items-baseline gap-2 min-w-0">
        <h2 class="text-[13px] font-semibold tracking-wide text-slate-100 whitespace-nowrap shrink-0">
          {{ title }}
        </h2>
        <span v-if="subtitle" class="text-[11px] text-slate-400 truncate">
          {{ subtitle }}
        </span>
      </div>
      <div v-if="$slots.right" class="flex items-center gap-1.5 shrink-0">
        <slot name="right" />
      </div>
    </header>
    <div class="flex-1 min-h-0 px-3 py-2 flex flex-col overflow-hidden">
      <slot />
    </div>
  </section>
</template>
