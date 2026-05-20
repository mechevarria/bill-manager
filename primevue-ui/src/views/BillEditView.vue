<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'
import Dialog from 'primevue/dialog'
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
  owner1Personal: number
  owner2Personal: number
  totalPersonal: number
  totalExpense: number
  totalShared: number
  owner1Shared: number
  owner2Shared: number
  owner1Paid: number
  owner2Paid: number
  owner1Owe: number
  owner2Owe: number
  percentText: string
  settlement: string
}

const summaryResult = ref<Summary | null>(null)
const summaryDialogOpen = ref(false)

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

  const owner1Paid = sumPaidBy(o1.name, b.expenses)
  const owner2Paid = sumPaidBy(o2.name, b.expenses)

  const owner1Owe = round(owner1Personal + owner1Shared - owner1Paid)
  const owner2Owe = round(owner2Personal + owner2Shared - owner2Paid)

  const percentText = `${o1.label} has ${(p1 * 100).toFixed(0)}% and ${o2.label} has ${(p2 * 100).toFixed(0)}% of monthly income`

  let settlement: string
  if (owner1Owe < owner2Owe) {
    settlement = `${o2.label} owes ${o1.label} $${Math.abs(round(owner2Owe))}`
  } else if (owner2Owe < owner1Owe) {
    settlement = `${o1.label} owes ${o2.label} $${Math.abs(round(owner1Owe))}`
  } else {
    settlement = 'Settled'
  }

  return {
    owner1Income,
    owner2Income,
    totalIncome,
    owner1Personal,
    owner2Personal,
    totalPersonal,
    totalExpense,
    totalShared,
    owner1Shared,
    owner2Shared,
    owner1Paid,
    owner2Paid,
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
    bill.value = await getBill(id)
  } catch (e) {
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
  const s = computeSummary()
  if (!s || !bill.value) return
  bill.value.owner1Income = s.owner1Income
  bill.value.owner2Income = s.owner2Income
  bill.value.totalIncome = s.totalIncome
  bill.value.owner1Personal = s.owner1Personal
  bill.value.owner2Personal = s.owner2Personal
  bill.value.totalExpense = s.totalExpense
  bill.value.owner1Owe = s.owner1Owe
  bill.value.owner2Owe = s.owner2Owe
  summaryResult.value = s
  summaryDialogOpen.value = true
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
  <div class="card">
    <div class="font-semibold text-xl mb-4">
      Editing {{ bill ? `${bill.month} ${bill.year}` : `#${route.params.id}` }}
    </div>
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
  </div>

  <template v-if="bill">
    <!-- Income -->
    <div class="card">
      <div class="font-semibold text-base mb-4">Income</div>
      <DataTable :value="bill.incomes" data-key="id" size="small">
        <template #footer>
          <span class="text-muted-color text-sm">{{ bill.incomes.length }} total</span>
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
    </div>

    <!-- Expense -->
    <div class="card">
      <div class="font-semibold text-base mb-4">Expense</div>
      <DataTable :value="bill.expenses" data-key="id" size="small">
        <template #footer>
          <span class="text-muted-color text-sm">{{ bill.expenses.length }} total</span>
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
    </div>
  </template>

  <Dialog
    v-model:visible="summaryDialogOpen"
    header="Summary"
    modal
    :draggable="false"
    style="width: 44rem"
  >
    <template v-if="summaryResult">
      <div class="font-semibold text-lg mb-2">{{ summaryResult.settlement }}</div>
      <p class="text-muted-color text-sm mb-4">{{ summaryResult.percentText }}</p>
      <table class="summary-grid">
        <thead>
          <tr>
            <th></th>
            <th>{{ owner1?.label }}</th>
            <th>{{ owner2?.label }}</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Income</th>
            <td>{{ fmt(summaryResult.owner1Income) }}</td>
            <td>{{ fmt(summaryResult.owner2Income) }}</td>
            <td>{{ fmt(summaryResult.totalIncome) }}</td>
          </tr>
          <tr>
            <th>Personal expenses</th>
            <td>{{ fmt(summaryResult.owner1Personal) }}</td>
            <td>{{ fmt(summaryResult.owner2Personal) }}</td>
            <td>{{ fmt(summaryResult.totalPersonal) }}</td>
          </tr>
          <tr>
            <th>Shared portion</th>
            <td>{{ fmt(summaryResult.owner1Shared) }}</td>
            <td>{{ fmt(summaryResult.owner2Shared) }}</td>
            <td>{{ fmt(summaryResult.totalShared) }}</td>
          </tr>
          <tr>
            <th>Paid (out of pocket)</th>
            <td>{{ fmt(summaryResult.owner1Paid) }}</td>
            <td>{{ fmt(summaryResult.owner2Paid) }}</td>
            <td>{{ fmt(summaryResult.owner1Paid + summaryResult.owner2Paid) }}</td>
          </tr>
          <tr>
            <th>Net owed</th>
            <td :class="{ 'amount-positive': summaryResult.owner1Owe < 0, 'amount-negative': summaryResult.owner1Owe > 0 }">
              {{ fmt(summaryResult.owner1Owe) }}
            </td>
            <td :class="{ 'amount-positive': summaryResult.owner2Owe < 0, 'amount-negative': summaryResult.owner2Owe > 0 }">
              {{ fmt(summaryResult.owner2Owe) }}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </template>
    <template #footer>
      <Button label="Close" severity="secondary" size="small" @click="summaryDialogOpen = false" />
      <Button label="Save" icon="pi pi-check" size="small" :loading="saving" @click="save" />
    </template>
  </Dialog>

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
.summary-grid {
  width: 100%;
  border-collapse: collapse;
}
.summary-grid th,
.summary-grid td {
  padding: 0.5rem 0.75rem;
  text-align: right;
  border-bottom: 1px solid var(--p-content-border-color, #e5e7eb);
}
.summary-grid thead th,
.summary-grid tbody th {
  text-align: left;
  font-weight: 600;
}
.summary-grid tbody th {
  color: var(--p-text-muted-color);
}
.amount-positive { color: #15803d; }
.amount-negative { color: #b91c1c; }
</style>
