<script setup lang="ts">
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import Tooltip from 'primevue/tooltip'

const vTooltip = Tooltip
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useConfirm } from 'primevue/useconfirm'
import { getBill, updateBill } from '@/services/billService'
import { useDefaultsStore } from '@/stores/defaults'
import { useNotify } from '@/composables/useNotify'
import type { Bill, Detail, Expense, Income, Owner } from '@/types/api'
import DetailsDialog from '@/components/DetailsDialog.vue'
import { ownerColor, ownerHighlight, ownerRowStyle } from '@/utils/ownerColors'

const route = useRoute()
const router = useRouter()
const notify = useNotify()
const confirm = useConfirm()
const defaultsStore = useDefaultsStore()

const bill = ref<Bill | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const owners = computed<Owner[]>(() => defaultsStore.defaults?.owners ?? [])
const owner1 = computed<Owner | null>(() => owners.value[0] ?? null)
const owner2 = computed<Owner | null>(() => owners.value[1] ?? null)
const ownerOptions = computed(() =>
  owners.value.map((o) => ({ label: o.label, value: o.name })),
)

const owner1Color = computed(() => ownerColor(owner1.value?.color))
const owner2Color = computed(() => ownerColor(owner2.value?.color))
const owner1ColBg = computed(() => ownerHighlight(owner1.value?.color))
const owner2ColBg = computed(() => ownerHighlight(owner2.value?.color))

const balanceBarData = computed(() => {
  const s = summaryResult.value
  if (!s) return null
  const bal = Math.abs(s.owner1Owe)
  const total = s.owner1Due + s.owner2Due
  if (total === 0) return null
  const owner1Receives = s.owner1Owe < 0
  const w1 = (owner1Receives ? s.owner1Due : s.owner1Paid) / total
  const wBal = bal / total
  const w2 = (owner1Receives ? s.owner2Paid : s.owner2Due) / total
  const receiverLabel = owner1Receives ? owner1.value?.label : owner2.value?.label
  return {
    w1,
    wBal,
    w2,
    balColor: ownerColor('success'),
    tip1: `${owner1.value?.label}: ${(w1 * 100).toFixed(0)}%`,
    tipBal: `Transfer → ${receiverLabel}: ${(wBal * 100).toFixed(0)}%`,
    tip2: `${owner2.value?.label}: ${(w2 * 100).toFixed(0)}%`,
  }
})

function rowStyleForOwner(ownerName: string): Record<string, string> {
  return ownerRowStyle(owners.value.find((o) => o.name === ownerName)?.color)
}

function incomeRowStyle(income: Income) { return rowStyleForOwner(income.owner) }
function expenseRowStyle(expense: Expense) { return rowStyleForOwner(expense.paid) }

const round = (n: number) => Math.round(n * 100) / 100

function sumIncomeFor(name: string, incomes: Income[]): number {
  return incomes.filter((i) => i.owner === name).reduce((acc, i) => acc + (i.amount ?? 0), 0)
}

// Sum personal portion for an owner from expenses with hasDetails. Side
// effect: normalizes expense.amount to sum of its details (matches Angular).
function sumPersonalFor(name: string, expenses: Expense[]): number {
  let total = 0
  for (const e of expenses) {
    if (!e.hasDetails) continue
    let detailTotal = 0
    for (const d of e.details ?? []) {
      if (d.personal === name) total += d.amount ?? 0
      detailTotal += d.amount ?? 0
    }
    e.amount = round(detailTotal)
  }
  return round(total)
}

function sumPaidBy(name: string, expenses: Expense[]): number {
  return expenses.filter((e) => e.paid === name).reduce((acc, e) => acc + (e.amount ?? 0), 0)
}

interface Summary {
  owner1Income: number
  owner2Income: number
  totalIncome: number
  incomePercent1: number
  incomePercent2: number
  owner1Personal: number
  owner2Personal: number
  totalPersonal: number
  totalExpense: number
  totalShared: number
  owner1Shared: number
  owner2Shared: number
  owner1Due: number
  owner2Due: number
  duePercent1: number
  duePercent2: number
  owner1Paid: number
  owner2Paid: number
  paidPercent1: number
  paidPercent2: number
  owner1Owe: number
  owner2Owe: number
  percentText: string
  settlement: string
}

const summaryResult = ref<Summary | null>(null)
const calcStale = ref(false)
let calculating = false

watch(
  () => bill.value,
  () => {
    if (!calculating && summaryResult.value !== null) calcStale.value = true
  },
  { deep: true },
)

function computeSummary(): Summary | null {
  if (!bill.value || !owner1.value || !owner2.value) return null
  const b = bill.value
  const o1 = owner1.value
  const o2 = owner2.value

  const owner1Income = sumIncomeFor(o1.name, b.incomes)
  const owner2Income = sumIncomeFor(o2.name, b.incomes)
  const totalIncome = owner1Income + owner2Income

  const owner1Personal = sumPersonalFor(o1.name, b.expenses)
  const owner2Personal = sumPersonalFor(o2.name, b.expenses)
  const totalPersonal = owner1Personal + owner2Personal

  const totalExpense = b.expenses.reduce((acc, e) => acc + (e.amount ?? 0), 0)
  const totalShared = totalExpense - totalPersonal

  const p1 = totalIncome > 0 ? owner1Income / totalIncome : 0
  const p2 = totalIncome > 0 ? owner2Income / totalIncome : 0
  const owner1Shared = p1 * totalShared
  const owner2Shared = p2 * totalShared

  const owner1Due = owner1Personal + owner1Shared
  const owner2Due = owner2Personal + owner2Shared
  const totalDue = owner1Due + owner2Due
  const duePercent1 = totalDue > 0 ? owner1Due / totalDue : 0
  const duePercent2 = totalDue > 0 ? owner2Due / totalDue : 0

  const owner1Paid = sumPaidBy(o1.name, b.expenses)
  const owner2Paid = sumPaidBy(o2.name, b.expenses)
  const totalPaid = owner1Paid + owner2Paid
  const paidPercent1 = totalPaid > 0 ? owner1Paid / totalPaid : 0
  const paidPercent2 = totalPaid > 0 ? owner2Paid / totalPaid : 0

  const owner1Owe = round(owner1Personal + owner1Shared - owner1Paid)
  const owner2Owe = round(owner2Personal + owner2Shared - owner2Paid)

  const percentText = `${o1.label} has ${(p1 * 100).toFixed(0)}% and ${o2.label} has ${(p2 * 100).toFixed(0)}% of monthly income`

  let settlement: string
  if (owner1Owe < owner2Owe) {
    settlement = `${o2.label} owes ${o1.label} ${fmt(Math.abs(round(owner2Owe)))}`
  } else if (owner2Owe < owner1Owe) {
    settlement = `${o1.label} owes ${o2.label} ${fmt(Math.abs(round(owner1Owe)))}`
  } else {
    settlement = 'Settled'
  }

  return {
    owner1Income,
    owner2Income,
    totalIncome,
    incomePercent1: p1,
    incomePercent2: p2,
    owner1Personal,
    owner2Personal,
    totalPersonal,
    totalExpense,
    totalShared,
    owner1Shared,
    owner2Shared,
    owner1Due,
    owner2Due,
    duePercent1,
    duePercent2,
    owner1Paid,
    owner2Paid,
    paidPercent1,
    paidPercent2,
    owner1Owe,
    owner2Owe,
    percentText,
    settlement,
  }
}

async function load() {
  const id = Number(route.params.id)
  if (Number.isNaN(id)) {
    error.value = 'Invalid bill id'
    return
  }
  loading.value = true
  error.value = null
  try {
    await defaultsStore.load()
    calculating = true
    bill.value = await getBill(id)
    if (!history.state?.isNew) {
      const s = computeSummary()
      if (s) summaryResult.value = s
    }
    nextTick(() => { calculating = false })
  } catch (e) {
    calculating = false
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

function addIncome() {
  if (!bill.value || !owner1.value) return
  bill.value.incomes.unshift({
    id: 0,
    owner: owner1.value.name,
    description: '',
    amount: 0,
  } as unknown as Income)
  nextTick(() => document.getElementById('income-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

function addExpense() {
  if (!bill.value || !owner1.value) return
  bill.value.expenses.unshift({
    id: 0,
    name: '',
    amount: 0,
    paid: owner1.value.name,
    hasDetails: false,
    details: [],
  } as unknown as Expense)
  nextTick(() => document.getElementById('expense-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

function confirmDeleteIncome(income: Income) {
  if (!bill.value) return
  confirm.require({
    message: `Remove income: ${income.description || '(blank)'} — $${income.amount}?`,
    header: 'Confirm delete',
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { severity: 'danger' },
    accept: () => {
      if (!bill.value) return
      const idx = bill.value.incomes.indexOf(income)
      if (idx !== -1) {
        bill.value.incomes.splice(idx, 1)
        notify.info('Income removed')
      }
    },
  })
}

function confirmDeleteExpense(expense: Expense) {
  if (!bill.value) return
  confirm.require({
    message: `Remove expense: ${expense.name || '(blank)'} — $${expense.amount}?`,
    header: 'Confirm delete',
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { severity: 'danger' },
    accept: () => {
      if (!bill.value) return
      const idx = bill.value.expenses.indexOf(expense)
      if (idx !== -1) {
        bill.value.expenses.splice(idx, 1)
        notify.info('Expense removed')
      }
    },
  })
}

function toggleHasDetails(expense: Expense, next: boolean) {
  expense.hasDetails = next
  if (next && !expense.details) expense.details = []
}

// Details dialog state
const detailsDialogOpen = ref(false)
const editingExpense = ref<Expense | null>(null)

function openDetails(expense: Expense) {
  editingExpense.value = expense
  if (!expense.details) expense.details = []
  detailsDialogOpen.value = true
}

function applyDetails(next: Detail[]) {
  if (editingExpense.value) {
    editingExpense.value.details = next
    editingExpense.value.amount = round(next.reduce((sum, d) => sum + (d.amount ?? 0), 0))
  }
}

async function save() {
  if (!bill.value) return
  saving.value = true
  try {
    const next = await updateBill(bill.value)
    bill.value = next
    notify.success(`Saved ${next.month} ${next.year}`)
  } catch (e) {
    notify.error(e instanceof Error ? e.message : String(e))
  } finally {
    saving.value = false
  }
}

function calculate() {
  calculating = true
  const s = computeSummary()
  if (!s || !bill.value) { calculating = false; return }
  bill.value.owner1Income = s.owner1Income
  bill.value.owner2Income = s.owner2Income
  bill.value.totalIncome = s.totalIncome
  bill.value.owner1Personal = s.owner1Personal
  bill.value.owner2Personal = s.owner2Personal
  bill.value.totalExpense = s.totalExpense
  bill.value.owner1Owe = s.owner1Owe
  bill.value.owner2Owe = s.owner2Owe
  summaryResult.value = s
  calcStale.value = false
  nextTick(() => { calculating = false })
}

function cancel() {
  router.push({ name: 'bills' })
}

function fmt(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
</script>

<template>
  <!-- Header -->
  <Card class="mb-4">
    <template #title>Editing {{ bill ? `${bill.month} ${bill.year}` : `#${route.params.id}` }}</template>
    <template #content>
      <Toolbar>
        <template #start>
          <div class="flex items-center gap-2">
            <Button label="Add Income" icon="pi pi-plus" outlined size="small" :disabled="!bill" @click="addIncome" />
            <Button label="Add Expense" icon="pi pi-plus" outlined size="small" :disabled="!bill" @click="addExpense" />
            <Button label="Calculate" icon="pi pi-calculator" outlined size="small" :disabled="!bill" @click="calculate" />
          </div>
        </template>
        <template #end>
          <div class="flex items-center gap-2">
            <Button label="Back" icon="pi pi-arrow-left" severity="secondary" text size="small" @click="cancel" />
            <Button label="Save" icon="pi pi-check" :loading="saving" :disabled="!bill" size="small" @click="save" />
          </div>
        </template>
      </Toolbar>

      <ProgressSpinner v-if="loading" style="width: 2rem; height: 2rem; margin-top: 1rem" />
      <Message v-else-if="error" severity="error" :closable="false" class="mt-4">{{ error }}</Message>
      <Message v-else-if="bill && (!owner1 || !owner2)" severity="warn" :closable="false" class="mt-4">
        System defaults need at least two owners. Visit the Defaults page to configure them.
      </Message>
    </template>
  </Card>

  <template v-if="bill">
    <!-- Calculations row -->
    <div class="calc-row">
      <Card class="mb-4">
        <template #title>
          <div class="flex items-center gap-2">
            Summary
            <i
              v-if="calcStale"
              v-tooltip.top="'Bill changed — click Calculate to refresh'"
              class="pi pi-refresh stale-icon"
            />
          </div>
        </template>
        <template #content>
          <div v-if="!summaryResult" class="empty-state">
            <i class="pi pi-chart-bar" />
            <div class="empty-state-title">No summary yet</div>
            <div>Click <b>Calculate</b> in the toolbar to run.</div>
          </div>
          <template v-else>
            <Tag :value="summaryResult.settlement" severity="secondary" class="mb-4" />
            <table class="summary-grid">
              <thead>
                <tr>
                  <th></th>
                  <th :style="{ background: owner1ColBg }">{{ owner1?.label }}</th>
                  <th :style="{ background: owner2ColBg }">{{ owner2?.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Income</th>
                  <td :style="{ background: owner1ColBg }">{{ fmt(summaryResult.owner1Income) }}</td>
                  <td :style="{ background: owner2ColBg }">{{ fmt(summaryResult.owner2Income) }}</td>
                </tr>
                <tr>
                  <th>Expenses</th>
                  <td :style="{ background: owner1ColBg }">{{ fmt(summaryResult.owner1Due) }}</td>
                  <td :style="{ background: owner2ColBg }">{{ fmt(summaryResult.owner2Due) }}</td>
                </tr>
                <tr>
                  <th>Net</th>
                  <td :style="{ background: owner1ColBg }" :class="summaryResult.owner1Income - summaryResult.owner1Due >= 0 ? 'amount-positive' : 'amount-negative'">
                    {{ fmt(summaryResult.owner1Income - summaryResult.owner1Due) }}
                  </td>
                  <td :style="{ background: owner2ColBg }" :class="summaryResult.owner2Income - summaryResult.owner2Due >= 0 ? 'amount-positive' : 'amount-negative'">
                    {{ fmt(summaryResult.owner2Income - summaryResult.owner2Due) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </template>
      </Card>

      <Card class="mb-4">
        <template #title>
          <div class="flex items-center gap-2">
            Calculations
            <i
              v-if="calcStale"
              v-tooltip.top="'Bill changed — click Calculate to refresh'"
              class="pi pi-refresh stale-icon"
            />
          </div>
        </template>
        <template #content>
          <div v-if="!summaryResult" class="empty-state">
            <i class="pi pi-calculator" />
            <div class="empty-state-title">No calculations yet</div>
            <div>Click <b>Calculate</b> in the toolbar to run.</div>
          </div>
          <table v-else class="summary-grid">
            <thead>
              <tr>
                <th></th>
                <th class="bar-col"></th>
                <th :style="{ background: owner1ColBg }">{{ owner1?.label }}</th>
                <th :style="{ background: owner2ColBg }">{{ owner2?.label }}</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Income</th>
                <td>
                  <div class="summary-bar">
                    <div v-tooltip.top="`${owner1?.label}: ${(summaryResult.incomePercent1 * 100).toFixed(0)}%`" :style="{ width: (summaryResult.incomePercent1 * 100) + '%', background: owner1Color }" />
                    <div v-tooltip.top="`${owner2?.label}: ${(summaryResult.incomePercent2 * 100).toFixed(0)}%`" :style="{ width: (summaryResult.incomePercent2 * 100) + '%', background: owner2Color }" />
                  </div>
                </td>
                <td :style="{ background: owner1ColBg }">{{ fmt(summaryResult.owner1Income) }}</td>
                <td :style="{ background: owner2ColBg }">{{ fmt(summaryResult.owner2Income) }}</td>
                <td>{{ fmt(summaryResult.totalIncome) }}</td>
              </tr>
              <tr>
                <th>Paid (out of pocket)</th>
                <td>
                  <div class="summary-bar">
                    <div v-tooltip.top="`${owner1?.label}: ${(summaryResult.paidPercent1 * 100).toFixed(0)}%`" :style="{ width: (summaryResult.paidPercent1 * 100) + '%', background: owner1Color }" />
                    <div v-tooltip.top="`${owner2?.label}: ${(summaryResult.paidPercent2 * 100).toFixed(0)}%`" :style="{ width: (summaryResult.paidPercent2 * 100) + '%', background: owner2Color }" />
                  </div>
                </td>
                <td :style="{ background: owner1ColBg }">{{ fmt(summaryResult.owner1Paid) }}</td>
                <td :style="{ background: owner2ColBg }">{{ fmt(summaryResult.owner2Paid) }}</td>
                <td>{{ fmt(summaryResult.owner1Paid + summaryResult.owner2Paid) }}</td>
              </tr>
              <tr>
                <th>Shared expenses</th>
                <td>
                  <div class="summary-bar">
                    <div v-tooltip.top="`${owner1?.label}: ${(summaryResult.incomePercent1 * 100).toFixed(0)}%`" :style="{ width: (summaryResult.incomePercent1 * 100) + '%', background: owner1Color }" />
                    <div v-tooltip.top="`${owner2?.label}: ${(summaryResult.incomePercent2 * 100).toFixed(0)}%`" :style="{ width: (summaryResult.incomePercent2 * 100) + '%', background: owner2Color }" />
                  </div>
                </td>
                <td :style="{ background: owner1ColBg }">{{ fmt(summaryResult.owner1Shared) }}</td>
                <td :style="{ background: owner2ColBg }">{{ fmt(summaryResult.owner2Shared) }}</td>
                <td>{{ fmt(summaryResult.totalShared) }}</td>
              </tr>
              <tr>
                <th>Personal expenses</th>
                <td></td>
                <td :style="{ background: owner1ColBg }">{{ fmt(summaryResult.owner1Personal) }}</td>
                <td :style="{ background: owner2ColBg }">{{ fmt(summaryResult.owner2Personal) }}</td>
                <td>{{ fmt(summaryResult.totalPersonal) }}</td>
              </tr>
              <tr>
                <th>Shared + Personal</th>
                <td>
                  <div class="summary-bar">
                    <div v-tooltip.top="`${owner1?.label}: ${(summaryResult.duePercent1 * 100).toFixed(0)}%`" :style="{ width: (summaryResult.duePercent1 * 100) + '%', background: owner1Color }" />
                    <div v-tooltip.top="`${owner2?.label}: ${(summaryResult.duePercent2 * 100).toFixed(0)}%`" :style="{ width: (summaryResult.duePercent2 * 100) + '%', background: owner2Color }" />
                  </div>
                </td>
                <td :style="{ background: owner1ColBg }">{{ fmt(summaryResult.owner1Due) }}</td>
                <td :style="{ background: owner2ColBg }">{{ fmt(summaryResult.owner2Due) }}</td>
                <td></td>
              </tr>
              <tr>
                <th>Balance</th>
                <td>
                  <div v-if="balanceBarData" class="summary-bar">
                    <div v-tooltip.top="balanceBarData.tip1" :style="{ width: (balanceBarData.w1 * 100) + '%', background: owner1Color }" />
                    <div v-tooltip.top="balanceBarData.tipBal" :style="{ width: (balanceBarData.wBal * 100) + '%', background: balanceBarData.balColor }" />
                    <div v-tooltip.top="balanceBarData.tip2" :style="{ width: (balanceBarData.w2 * 100) + '%', background: owner2Color }" />
                  </div>
                </td>
                <td :style="{ background: owner1ColBg }" :class="{ 'amount-positive': summaryResult.owner1Owe < 0, 'amount-negative': summaryResult.owner1Owe > 0 }">
                  {{ fmt(Math.abs(summaryResult.owner1Owe)) }}
                </td>
                <td :style="{ background: owner2ColBg }" :class="{ 'amount-positive': summaryResult.owner2Owe < 0, 'amount-negative': summaryResult.owner2Owe > 0 }">
                  {{ fmt(Math.abs(summaryResult.owner2Owe)) }}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </template>
      </Card>
    </div>

    <!-- Income -->
    <Card id="income-section" class="mb-4">
      <template #title>Income</template>
      <template #content>
        <DataTable :value="bill.incomes" data-key="id" size="small" striped-rows :row-style="incomeRowStyle">
          <template #footer>
            <span class="text-muted-color text-sm">{{ bill.incomes.length }} total &mdash; {{ fmt(bill.incomes.reduce((s, i) => s + (i.amount ?? 0), 0)) }}</span>
          </template>
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-wallet" />
              <div class="empty-state-title">No income rows</div>
              <div>Use <b>Add Income</b> in the toolbar to record one.</div>
            </div>
          </template>
          <Column header="Owner" style="width: 12rem">
            <template #body="{ data }">
              <Select v-model="data.owner" :options="ownerOptions" option-label="label" option-value="value" size="small" fluid />
            </template>
          </Column>
          <Column header="Description">
            <template #body="{ data }">
              <InputText v-model="data.description" size="small" fluid />
            </template>
          </Column>
          <Column header="Amount" style="width: 12rem">
            <template #body="{ data }">
              <InputNumber v-model="data.amount" mode="currency" currency="USD" :min-fraction-digits="2" size="small" fluid />
            </template>
          </Column>
          <Column header="" style="width: 4rem">
            <template #body="{ data }">
              <Button icon="pi pi-trash" size="small" severity="danger" outlined rounded aria-label="Delete income" @click="confirmDeleteIncome(data)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Expense -->
    <Card id="expense-section" class="mb-4">
      <template #title>Expense</template>
      <template #content>
        <DataTable :value="bill.expenses" data-key="id" size="small" striped-rows :row-style="expenseRowStyle">
          <template #footer>
            <span class="text-muted-color text-sm">{{ bill.expenses.length }} total &mdash; {{ fmt(bill.expenses.reduce((s, e) => s + (e.amount ?? 0), 0)) }}</span>
          </template>
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-receipt" />
              <div class="empty-state-title">No expense rows</div>
              <div>Use <b>Add Expense</b> in the toolbar to record one. Toggle <b>Has details</b> to attach line items.</div>
            </div>
          </template>
          <Column header="Name">
            <template #body="{ data }">
              <InputText v-model="data.name" size="small" fluid />
            </template>
          </Column>
          <Column header="Paid by" style="width: 12rem">
            <template #body="{ data }">
              <Select v-model="data.paid" :options="ownerOptions" option-label="label" option-value="value" size="small" fluid />
            </template>
          </Column>
          <Column header="Amount" style="width: 12rem">
            <template #body="{ data }">
              <InputNumber v-model="data.amount" mode="currency" currency="USD" :min-fraction-digits="2" :disabled="data.hasDetails" size="small" fluid />
            </template>
          </Column>
          <Column header="Details" style="width: 14rem">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <ToggleSwitch :model-value="data.hasDetails" @update:model-value="toggleHasDetails(data, $event)" />
                <Button
                  v-if="data.hasDetails"
                  icon="pi pi-list"
                  severity="secondary"
                  size="small"
                  :label="`${(data.details || []).length}`"
                  @click="openDetails(data)"
                />
              </div>
            </template>
          </Column>
          <Column header="" style="width: 4rem">
            <template #body="{ data }">
              <Button icon="pi pi-trash" size="small" severity="danger" outlined rounded aria-label="Delete expense" @click="confirmDeleteExpense(data)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </template>

  <DetailsDialog
    v-if="editingExpense"
    v-model:visible="detailsDialogOpen"
    :details="editingExpense.details || []"
    :owners="owners"
    :expense-name="editingExpense.name"
    @update:details="applyDetails"
  />
</template>

<style scoped>
.calc-row {
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: 1rem;
  align-items: stretch;
}
@media (max-width: 768px) {
  .calc-row {
    grid-template-columns: 1fr;
  }
}
.summary-grid {
  width: 100%;
  border-collapse: collapse;
}
/* Mirrors a small striped DataTable, using its theme tokens */
.summary-grid th,
.summary-grid td {
  padding: var(--p-datatable-body-cell-sm-padding);
  text-align: right;
  border-bottom: 1px solid var(--p-datatable-body-cell-border-color);
}
.summary-grid tbody tr:nth-child(even) {
  background: var(--p-datatable-row-striped-background);
}
.summary-grid thead th {
  background: var(--p-datatable-header-cell-background);
  color: var(--p-datatable-header-cell-color);
  border-bottom-color: var(--p-datatable-header-cell-border-color);
  text-align: left;
  font-weight: var(--p-datatable-column-title-font-weight);
}
.summary-grid thead th:not(:first-child) {
  text-align: right;
}
.summary-grid tbody th {
  text-align: left;
  font-weight: var(--p-typography-font-weight);
  color: var(--p-text-muted-color);
}
.bar-col {
  width: 6rem;
}
.summary-bar {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
}
.stale-icon {
  color: var(--p-orange-500);
  cursor: default;
}
</style>
