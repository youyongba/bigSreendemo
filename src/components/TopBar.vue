<script setup>
import { Banknote, RotateCcw } from 'lucide-vue-next';

defineProps({
  selectedYear: { type: [String, Number], required: true },
  selectedCity: { type: String, default: null },
});

const emit = defineEmits(['select-year', 'clear-city', 'open-disbursement']);

const YEAR_OPTIONS = [
  { value: 'ALL', label: '全部年份' },
  { value: 2023, label: '2023年' },
  { value: 2024, label: '2024年' },
  { value: 2025, label: '2025年' },
  { value: 2026, label: '2026年' },
];
</script>

<template>
  <header class="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-[#0B1426] border-b border-slate-800 shrink-0">
    <!-- Zone 1: Brand wordmark -->
    <div class="flex items-baseline gap-2.5 min-w-0 shrink-0">
      <h1 class="text-lg font-bold tracking-wider text-slate-50 whitespace-nowrap shrink-0">
        吉农全档
      </h1>
      <span class="text-slate-600 select-none" aria-hidden="true">·</span>
      <span class="hidden sm:inline text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">
        吉林省高标准农田建设全档案大屏
      </span>
    </div>

    <!-- Zone 2: Year Splitter Segmented Control -->
    <nav
      aria-label="项目年份拆分"
      class="flex items-center gap-1 p-1 bg-[#08101E] border border-slate-800 rounded-md"
    >
      <button
        v-for="opt in YEAR_OPTIONS"
        :key="String(opt.value)"
        type="button"
        :aria-pressed="selectedYear === opt.value"
        :class="[
          'px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer',
          selectedYear === opt.value
            ? 'bg-sky-600 text-white'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70',
        ]"
        @click="emit('select-year', opt.value)"
      >
        {{ opt.label }}
      </button>
    </nav>

    <!-- Zone 3: City Reset & Primary Action -->
    <div class="flex items-center gap-2.5 shrink-0">
      <button
        v-if="selectedCity"
        type="button"
        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-sky-300 bg-sky-950/60 border border-sky-700/50 rounded-md hover:bg-sky-900/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        @click="emit('clear-city')"
      >
        <RotateCcw class="w-3.5 h-3.5" aria-hidden="true" />
        <span>{{ selectedCity }} · 返回全省</span>
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        @click="emit('open-disbursement')"
      >
        <Banknote class="w-3.5 h-3.5" aria-hidden="true" />
        <span>标段拨付录入</span>
      </button>
    </div>
  </header>
</template>
