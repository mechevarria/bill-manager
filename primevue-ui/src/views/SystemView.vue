<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
import { useDefaultsStore } from '@/stores/defaults'
import { useNotify } from '@/composables/useNotify'
import type { DefaultExpense, DefaultIncome, Defaults, Owner } from '@/types/api'

const store = useDefaultsStore()
const notify = useNotify()

const saving = ref(false)

interface ColorOption {
  label: string
  value: string
  swatch: string
}

// Swatch hex values come from PrimeVue Aura's severity palette
// (the same colors Sakai's Button uikit demo renders for each severity).
const colorOptions: ColorOption[] = [
  { label: 'Grey', value: 'active', swatch: '#64748b' },   // secondary (slate-500)
  { label: 'Green', value: 'success', swatch: '#22c55e' }, // success (green-500)
  { label: 'Blue', value: 'info', swatch: '#0ea5e9' },     // info (sky-500)
  { label: 'Orange', value: 'warning', swatch: '#f97316' }, // warn (orange-500)
  { label: 'Red', value: 'danger', swatch: '#ef4444' },    // danger (red-500)
]

function swatchFor(value: string): string {
  return colorOptions.find((c) => c.value === value)?.swatch ?? '#6b7280'
}
function labelFor(value: string): string {
  return colorOptions.find((c) => c.value === value)?.label ?? value
}

onMounted(() => {
  store.load().catch(() => {
    /* error captured in store.error */
  })
})

const ownerNameOptions = (defaults: Defaults | null) =>
  defaults?.owners?.map((o) => ({ label: o.label, value: o.name })) ?? []

function addOwner() {
  if (!store.defaults) return
  store.defaults.owners.push({
    id: 0,
    name: `owner${store.defaults.owners.length + 1}`,
    label: '',
    color: 'active',
  } as unknown as Owner)
}
function deleteOwner(owner: Owner) {
  if (!store.defaults) return
  const idx = store.defaults.owners.indexOf(owner)
  if (idx !== -1) store.defaults.owners.splice(idx, 1)
}

function addDefaultIncome() {
  if (!store.defaults || !store.defaults.owners[0]) return
  store.defaults.incomes.unshift({
    id: 0,
    owner: store.defaults.owners[0].name,
    description: '',
    amount: 0,
  } as unknown as DefaultIncome)
}
function deleteDefaultIncome(income: DefaultIncome) {
  if (!store.defaults) return
  const idx = store.defaults.incomes.indexOf(income)
  if (idx !== -1) store.defaults.incomes.splice(idx, 1)
}

function addDefaultExpense() {
  if (!store.defaults || !store.defaults.owners[0]) return
  store.defaults.expenses.unshift({
    id: 0,
    name: '',
    amount: 0,
    paid: store.defaults.owners[0].name,
    hasDetails: false,
  } as unknown as DefaultExpense)
}
function deleteDefaultExpense(expense: DefaultExpense) {
  if (!store.defaults) return
  const idx = store.defaults.expenses.indexOf(expense)
  if (idx !== -1) store.defaults.expenses.splice(idx, 1)
}

async function saveDefaults() {
  if (!store.defaults) return
  saving.value = true
  try {
    await store.save(store.defaults)
    notify.success('Defaults saved')
  } catch (e) {
    notify.error(e instanceof Error ? e.message : String(e))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <!-- Page header -->
  <div class="card">
    <div class="font-semibold text-xl mb-4">Defaults</div>
    <Toolbar>
      <template #start>
        <div class="flex items-center gap-2">
          <Button label="Add Owner" icon="pi pi-plus" outlined size="small" :disabled="!store.defaults" @click="addOwner" />
          <Button label="Add Income" icon="pi pi-plus" outlined size="small" :disabled="!store.defaults" @click="addDefaultIncome" />
          <Button label="Add Expense" icon="pi pi-plus" outlined size="small" :disabled="!store.defaults" @click="addDefaultExpense" />
        </div>
      </template>
      <template #end>
        <Button
          label="Save"
          icon="pi pi-check"
          size="small"
          :loading="saving"
          :disabled="!store.defaults"
          @click="saveDefaults"
        />
      </template>
    </Toolbar>
    <ProgressSpinner v-if="store.loading" style="width: 2rem; height: 2rem; margin-top: 1rem" />
    <Message v-else-if="store.error" severity="error" :closable="false" class="mt-4">
      {{ store.error }}
    </Message>
  </div>

  <!-- Owners -->
  <div v-if="store.defaults" class="card">
    <div class="font-semibold text-lg mb-4">Owners ({{ store.defaults.owners.length }})</div>
    <DataTable :value="store.defaults.owners" data-key="id" size="small">
      <template #empty>
        <div class="empty-state">
          <i class="pi pi-users" />
          <div class="empty-state-title">No owners configured</div>
          <div>Add at least two so the settlement math has something to split.</div>
        </div>
      </template>
      <Column header="Name (key)" style="width: 12rem">
        <template #body="{ data }">
          <InputText v-model="data.name" size="small" fluid />
        </template>
      </Column>
      <Column header="Display label">
        <template #body="{ data }">
          <InputText v-model="data.label" size="small" fluid />
        </template>
      </Column>
      <Column header="Color" style="width: 12rem">
        <template #body="{ data }">
          <Select
            v-model="data.color"
            :options="colorOptions"
            option-label="label"
            option-value="value"
            size="small"
            fluid
          >
            <template #value="slotProps">
              <div v-if="slotProps.value" class="flex items-center gap-2">
                <span class="color-swatch" :style="{ background: swatchFor(slotProps.value) }" />
                <span>{{ labelFor(slotProps.value) }}</span>
              </div>
              <span v-else>{{ slotProps.placeholder }}</span>
            </template>
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <span class="color-swatch" :style="{ background: slotProps.option.swatch }" />
                <span>{{ slotProps.option.label }}</span>
              </div>
            </template>
          </Select>
        </template>
      </Column>
      <Column header="" style="width: 4rem">
        <template #body="{ data }">
          <Button
            icon="pi pi-trash"
            size="small"
            severity="danger"
            outlined
            rounded
            aria-label="Delete owner"
            @click="deleteOwner(data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>

  <!-- Default Income -->
  <div v-if="store.defaults" class="card">
    <div class="font-semibold text-lg mb-4">Default Income ({{ store.defaults.incomes.length }})</div>
    <DataTable :value="store.defaults.incomes" data-key="id" size="small">
      <template #empty>
        <div class="empty-state">
          <i class="pi pi-wallet" />
          <div class="empty-state-title">No default income templates</div>
          <div>Add the recurring incomes you want pre-populated on each new bill.</div>
        </div>
      </template>
      <Column header="Owner" style="width: 12rem">
        <template #body="{ data }">
          <Select
            v-model="data.owner"
            :options="ownerNameOptions(store.defaults)"
            option-label="label"
            option-value="value"
            size="small"
            fluid
          />
        </template>
      </Column>
      <Column header="Description">
        <template #body="{ data }">
          <InputText v-model="data.description" size="small" fluid />
        </template>
      </Column>
      <Column header="Amount" style="width: 12rem">
        <template #body="{ data }">
          <InputNumber
            v-model="data.amount"
            mode="currency"
            currency="USD"
            :min-fraction-digits="2"
            size="small"
            fluid
          />
        </template>
      </Column>
      <Column header="" style="width: 4rem">
        <template #body="{ data }">
          <Button
            icon="pi pi-trash"
            size="small"
            severity="danger"
            outlined
            rounded
            aria-label="Delete default income"
            @click="deleteDefaultIncome(data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>

  <!-- Default Expenses -->
  <div v-if="store.defaults" class="card">
    <div class="font-semibold text-lg mb-4">Default Expenses ({{ store.defaults.expenses.length }})</div>
    <DataTable :value="store.defaults.expenses" data-key="id" size="small">
      <template #empty>
        <div class="empty-state">
          <i class="pi pi-receipt" />
          <div class="empty-state-title">No default expense templates</div>
          <div>Add the recurring expenses you want pre-populated on each new bill.</div>
        </div>
      </template>
      <Column header="Name">
        <template #body="{ data }">
          <InputText v-model="data.name" size="small" fluid />
        </template>
      </Column>
      <Column header="Paid by" style="width: 12rem">
        <template #body="{ data }">
          <Select
            v-model="data.paid"
            :options="ownerNameOptions(store.defaults)"
            option-label="label"
            option-value="value"
            size="small"
            fluid
          />
        </template>
      </Column>
      <Column header="Amount" style="width: 12rem">
        <template #body="{ data }">
          <InputNumber
            v-model="data.amount"
            mode="currency"
            currency="USD"
            :min-fraction-digits="2"
            size="small"
            fluid
          />
        </template>
      </Column>
      <Column header="Has details" style="width: 9rem">
        <template #body="{ data }">
          <ToggleSwitch v-model="data.hasDetails" />
        </template>
      </Column>
      <Column header="" style="width: 4rem">
        <template #body="{ data }">
          <Button
            icon="pi pi-trash"
            size="small"
            severity="danger"
            outlined
            rounded
            aria-label="Delete default expense"
            @click="deleteDefaultExpense(data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.color-swatch {
  display: inline-block;
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--p-text-color) 20%, transparent);
  flex-shrink: 0;
}
</style>
