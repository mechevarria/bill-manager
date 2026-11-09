<script setup lang="ts">
import Card from 'primevue/card'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import Chart from 'primevue/chart'
import Select from 'primevue/select'
import Toolbar from 'primevue/toolbar'
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

const selectedYear = ref<string>('last4')
const yearOptions = computed<YearOption[]>(() => {
  const years = Array.from(new Set(bills.value.map((b) => b.year))).sort(
    (a, b) => Number(b) - Number(a),
  )
  return [
    { label: 'Last 4 years', value: 'last4' },
    ...years.map((y) => ({ label: y, value: y })),
  ]
})

const filteredBills = computed(() => {
  if (selectedYear.value === 'last4') {
    const cutoff = new Date().getFullYear() - 3
    return bills.value.filter((b) => parseInt(b.year) >= cutoff)
  }
  return bills.value.filter((b) => b.year === selectedYear.value)
})

// --- Chart data + options are rebuilt whenever bills or theme change ---
type ChartData = { labels: string[]; datasets: unknown[] }
type ChartOptions = Record<string, unknown>

const lineData = ref<ChartData | null>(null)
const lineOptions = ref<ChartOptions | null>(null)
const barData = ref<ChartData | null>(null)
const barOptions = ref<ChartOptions | null>(null)

// Resolve a theme token to a concrete color. Theme tokens can contain
// light-dark() / color-mix(), which Chart.js can't parse, so let the browser
// compute them on a probe element and read back the final color.
function token(name: string): string {
  const probe = document.createElement('span')
  probe.style.color = `var(${name})`
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

function rebuildCharts() {
  const primary500 = token('--p-primary-500')
  const primary200 = token('--p-primary-200')
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

  barData.value = {
    labels: ['Totals'],
    datasets: [
      {
        label: 'Income',
        data: [totalIncome],
        backgroundColor: primary500,
      },
      {
        label: 'Expense',
        data: [totalExpense],
        backgroundColor: primary200,
      },
    ],
  }

  barOptions.value = {
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
  <Card class="mb-4">
    <template #title>Charts</template>
    <template #content>
      <Toolbar class="mb-4">
        <template #start>
          <Select
            v-model="selectedYear"
            :options="yearOptions"
            option-label="label"
            option-value="value"
            size="small"
            style="min-width: 8rem"
          />
        </template>
      </Toolbar>

      <Skeleton v-if="loading" height="22rem" />
      <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>
      <div v-else-if="filteredBills.length === 0" class="empty-state">
        <i class="pi pi-chart-bar" />
        <div class="empty-state-title">No data to chart</div>
        <div v-if="bills.length === 0">Add a bill on the Bills page to populate this chart.</div>
        <div v-else>No bills match the selected year. Switch to <b>All</b> or pick a different year.</div>
      </div>
    </template>
  </Card>

  <div v-if="!loading && !error && filteredBills.length > 0" class="chart-row">
    <Card v-if="lineData" class="mb-4">
      <template #title>Income vs Expense</template>
      <template #content>
        <div style="height: 22rem">
          <Chart type="line" :data="lineData" :options="lineOptions ?? undefined" />
        </div>
      </template>
    </Card>

    <Card v-if="barData" class="mb-4">
      <template #title>Total Income vs Total Expense</template>
      <template #content>
        <div style="height: 22rem">
          <Chart type="bar" :data="barData" :options="barOptions ?? undefined" />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: start;
}
@media (max-width: 768px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
}
</style>
