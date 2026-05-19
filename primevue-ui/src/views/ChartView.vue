<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import Chart from 'primevue/chart'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import { getSummary } from '@/services/billService'
import { useDarkMode } from '@/composables/useDarkMode'
import type { Bill } from '@/types/api'

const { isDark } = useDarkMode()

const bills = ref<Bill[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

interface YearOption {
  label: string
  value: string
}

const selectedYear = ref<string>('')
const yearOptions = computed<YearOption[]>(() => {
  const years = Array.from(new Set(bills.value.map((b) => b.year))).sort(
    (a, b) => Number(b) - Number(a),
  )
  return [{ label: 'All', value: '' }, ...years.map((y) => ({ label: y, value: y }))]
})

const filteredBills = computed(() =>
  selectedYear.value
    ? bills.value.filter((b) => b.year === selectedYear.value)
    : bills.value,
)

// --- Chart data + options are rebuilt whenever bills or theme change ---
type ChartData = { labels: string[]; datasets: unknown[] }
type ChartOptions = Record<string, unknown>

const lineData = ref<ChartData | null>(null)
const lineOptions = ref<ChartOptions | null>(null)
const pieData = ref<ChartData | null>(null)
const pieOptions = ref<ChartOptions | null>(null)

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function rebuildCharts() {
  const primary500 = token('--p-primary-500')
  const primary200 = token('--p-primary-200')
  const indigo500 = token('--p-indigo-500')
  const indigo400 = token('--p-indigo-400')
  const purple500 = token('--p-purple-500')
  const purple400 = token('--p-purple-400')
  const textColor = token('--p-text-color')
  const textMuted = token('--p-text-muted-color')
  const surfaceBorder = token('--p-content-border-color')

  const sorted = [...filteredBills.value].sort(
    (a, b) => new Date(a.billDate).getTime() - new Date(b.billDate).getTime(),
  )

  lineData.value = {
    labels: sorted.map((b) => `${b.month} ${b.year}`),
    datasets: [
      {
        label: 'Income',
        data: sorted.map((b) => b.totalIncome),
        fill: false,
        backgroundColor: primary500,
        borderColor: primary500,
        tension: 0.4,
      },
      {
        label: 'Expense',
        data: sorted.map((b) => b.totalExpense),
        fill: false,
        backgroundColor: primary200,
        borderColor: primary200,
        tension: 0.4,
      },
    ],
  }

  lineOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: textColor, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
            `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: textMuted, font: { weight: 500 } },
        grid: { color: surfaceBorder, drawBorder: false },
      },
      y: {
        ticks: {
          color: textMuted,
          callback: (value: number | string) => `$${value}`,
        },
        grid: { color: surfaceBorder, drawBorder: false },
      },
    },
  }

  const totalIncome = filteredBills.value.reduce((s, b) => s + (b.totalIncome ?? 0), 0)
  const totalExpense = filteredBills.value.reduce((s, b) => s + (b.totalExpense ?? 0), 0)

  pieData.value = {
    labels: ['Total Income', 'Total Expense'],
    datasets: [
      {
        data: [totalIncome, totalExpense],
        backgroundColor: [indigo500, purple500],
        hoverBackgroundColor: [indigo400, purple400],
      },
    ],
  }

  pieOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: textColor, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; parsed: number }) =>
            `${ctx.label}: $${ctx.parsed.toFixed(2)}`,
        },
      },
    },
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    bills.value = await getSummary()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

// Rebuild when data or theme changes. nextTick ensures the dark class
// has flushed before we read CSS variables.
watch(
  [filteredBills, isDark],
  () => {
    nextTick(rebuildCharts)
  },
  { immediate: true },
)
</script>

<template>
  <div class="card">
    <div class="flex items-center gap-4 mb-4">
      <div class="font-semibold text-xl">Charts</div>
      <Select
        v-model="selectedYear"
        :options="yearOptions"
        option-label="label"
        option-value="value"
        size="small"
        style="min-width: 8rem"
      />
    </div>

    <Skeleton v-if="loading" height="22rem" />
    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>
    <div v-else-if="filteredBills.length === 0" class="empty-state">
      <i class="pi pi-chart-bar" />
      <div class="empty-state-title">No data to chart</div>
      <div v-if="bills.length === 0">Add a bill on the Bills page to populate this chart.</div>
      <div v-else>No bills match the selected year. Switch to <b>All</b> or pick a different year.</div>
    </div>
  </div>

  <div v-if="!loading && !error && filteredBills.length > 0 && lineData" class="card">
    <div class="font-semibold text-xl mb-4">Income vs Expense</div>
    <div style="height: 22rem">
      <Chart type="line" :data="lineData" :options="lineOptions ?? undefined" />
    </div>
  </div>

  <div v-if="!loading && !error && filteredBills.length > 0 && pieData" class="card">
    <div class="font-semibold text-xl mb-4">Total Income vs Total Expense</div>
    <div style="height: 22rem">
      <Chart type="pie" :data="pieData" :options="pieOptions ?? undefined" />
    </div>
  </div>
</template>
