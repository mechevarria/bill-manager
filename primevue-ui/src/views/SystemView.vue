<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import ProgressBar from 'primevue/progressbar'
import Dialog from 'primevue/dialog'
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useConfirm } from 'primevue/useconfirm'
import { useDefaultsStore } from '@/stores/defaults'
import { useNotify } from '@/composables/useNotify'
import {
  createBill,
  deleteAllBills,
  getBill,
  getSummary,
} from '@/services/billService'
import type {
  Bill,
  DefaultExpense,
  DefaultIncome,
  Defaults,
  Owner,
} from '@/types/api'

const store = useDefaultsStore()
const confirm = useConfirm()
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

// ---------- Export ----------
const exportOpen = ref(false)
const exportProcessed = ref(0)
const exportTotal = ref(0)
const exportBlobUrl = ref<string | null>(null)

function stripOwnerIds(d: Defaults): Defaults {
  const clone = JSON.parse(JSON.stringify(d)) as Defaults
  clone.owners.forEach((o) => delete (o as Partial<Owner>).id)
  clone.incomes.forEach((i) => delete (i as Partial<DefaultIncome>).id)
  clone.expenses.forEach((e) => delete (e as Partial<DefaultExpense>).id)
  return clone
}

function stripBillIds(b: Bill): Bill {
  const clone = JSON.parse(JSON.stringify(b)) as Bill
  delete (clone as Partial<Bill>).id
  clone.expenses.forEach((e) => {
    delete (e as Partial<typeof e>).id
    e.details?.forEach((d) => {
      delete (d as Partial<typeof d>).id
    })
  })
  clone.incomes.forEach((i) => {
    delete (i as Partial<typeof i>).id
  })
  return clone
}

async function doExport() {
  exportProcessed.value = 0
  exportTotal.value = 1
  exportBlobUrl.value = null
  exportOpen.value = true
  try {
    const summary = await getSummary()
    exportTotal.value = summary.length + 1
    const defaultsClone = stripOwnerIds(store.defaults!)
    exportProcessed.value = 1

    const bills: Bill[] = []
    for (const s of summary) {
      const full = await getBill(s.id)
      bills.push(stripBillIds(full))
      exportProcessed.value++
    }

    const blob = new Blob([JSON.stringify({ defaults: defaultsClone, bills }, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    exportBlobUrl.value = URL.createObjectURL(blob)
  } catch (e) {
    notify.error(e instanceof Error ? e.message : String(e))
    exportOpen.value = false
  }
}

function downloadExport() {
  if (!exportBlobUrl.value) return
  const a = document.createElement('a')
  a.href = exportBlobUrl.value
  a.download = `bill-manager-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  notify.success(`Exported ${exportTotal.value} record(s)`)
  exportOpen.value = false
}

// ---------- Import ----------
const importOpen = ref(false)
const importData = ref<{ defaults: Defaults; bills: Bill[] } | null>(null)
const importProcessed = ref(0)
const importTotal = ref(0)
const importing = ref(false)

async function onImportFileSelect(event: FileUploadSelectEvent) {
  const file = Array.isArray(event.files) ? event.files[0] : event.files
  if (!file) return
  try {
    const text = await file.text()
    importData.value = JSON.parse(text)
    importProcessed.value = 0
    importTotal.value = (importData.value?.bills.length ?? 0) + 1
    importOpen.value = true
  } catch (e) {
    notify.error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`)
  }
}

async function runImport() {
  if (!importData.value) return
  importing.value = true
  try {
    await store.save(importData.value.defaults)
    importProcessed.value = 1

    for (const bill of importData.value.bills) {
      // Ensure no id is carried over; createBill posts to /bill
      const fresh = { ...bill, id: 0 } as Bill
      await createBill(fresh)
      importProcessed.value++
    }
    notify.success(`Imported ${importData.value.bills.length} bill(s)`)
    importOpen.value = false
    importData.value = null
  } catch (e) {
    notify.error(e instanceof Error ? e.message : String(e))
  } finally {
    importing.value = false
  }
}

// ---------- Erase All ----------
async function confirmErase() {
  confirm.require({
    message: 'Erase ALL data? This deletes every bill and resets defaults.',
    header: 'Erase all data',
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { severity: 'danger', label: 'Erase All' },
    accept: doErase,
  })
}

async function doErase() {
  try {
    const res = await deleteAllBills()
    notify.success(res.text)
    if (store.defaults) {
      store.defaults.incomes = []
      store.defaults.expenses = []
      await store.save(store.defaults)
    }
  } catch (e) {
    notify.error(e instanceof Error ? e.message : String(e))
  }
}
</script>

<template>
  <div class="card">
    <div class="flex items-center gap-4 mb-4">
      <div class="font-semibold text-xl">System Defaults</div>
      <Button
        label="Save"
        icon="pi pi-check"
        size="small"
        :loading="saving"
        :disabled="!store.defaults"
        style="margin-left: auto"
        @click="saveDefaults"
      />
    </div>

    <ProgressSpinner v-if="store.loading" style="width: 2rem; height: 2rem" />
    <Message v-else-if="store.error" severity="error" :closable="false">
      {{ store.error }}
    </Message>

    <Tabs v-if="store.defaults" value="owners">
      <TabList>
        <Tab value="owners">Owners ({{ store.defaults.owners.length }})</Tab>
        <Tab value="incomes">Default Income ({{ store.defaults.incomes.length }})</Tab>
        <Tab value="expenses">Default Expense ({{ store.defaults.expenses.length }})</Tab>
      </TabList>
      <TabPanels>
        <!-- Owners -->
        <TabPanel value="owners">
          <div class="mb-4">
            <Button label="Add Owner" icon="pi pi-plus" severity="secondary" size="small" @click="addOwner" />
          </div>
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
        </TabPanel>

        <!-- Default Incomes -->
        <TabPanel value="incomes">
          <div class="mb-4">
            <Button label="Add Income" icon="pi pi-plus" severity="secondary" size="small" @click="addDefaultIncome" />
          </div>
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
                <InputNumber v-model="data.amount" mode="currency" currency="USD" :min-fraction-digits="2" size="small" fluid />
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
        </TabPanel>

        <!-- Default Expenses -->
        <TabPanel value="expenses">
          <div class="mb-4">
            <Button label="Add Expense" icon="pi pi-plus" severity="secondary" size="small" @click="addDefaultExpense" />
          </div>
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
                <InputNumber v-model="data.amount" mode="currency" currency="USD" :min-fraction-digits="2" size="small" fluid />
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
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>

  <div class="card">
    <div class="font-semibold text-xl mb-4">Data Management</div>
    <div class="flex items-center gap-2">
      <Button label="Export" icon="pi pi-download" severity="secondary" size="small" @click="doExport" />
      <FileUpload
        mode="basic"
        accept="application/json,.json"
        :auto="true"
        choose-label="Import"
        choose-icon="pi pi-upload"
        custom-upload
        :choose-button-props="{ size: 'small', severity: 'secondary' }"
        @select="onImportFileSelect"
      />
      <Button label="Erase All" icon="pi pi-trash" severity="danger" size="small" @click="confirmErase" />
    </div>
    <p class="text-muted-color text-sm mt-4">
      Export downloads all bills + defaults as JSON. Import expects the same shape and POSTs each bill.
      Erase deletes every bill and clears default incomes/expenses.
    </p>
  </div>

  <!-- Export progress dialog -->
  <Dialog v-model:visible="exportOpen" header="Export" modal :style="{ width: '28rem' }">
    <div class="text-sm mb-2">
      Processed {{ exportProcessed }} of {{ exportTotal }}
    </div>
    <ProgressBar
      :value="exportTotal ? Math.round((exportProcessed / exportTotal) * 100) : 0"
    />
    <template #footer>
      <Button label="Cancel" severity="secondary" text size="small" @click="exportOpen = false" />
      <Button
        label="Download"
        icon="pi pi-download"
        size="small"
        :disabled="!exportBlobUrl"
        @click="downloadExport"
      />
    </template>
  </Dialog>

  <!-- Import progress dialog -->
  <Dialog v-model:visible="importOpen" header="Import" modal :style="{ width: '28rem' }">
    <p class="mb-4">
      Will replace defaults and POST {{ importData?.bills.length ?? 0 }} bill(s).
    </p>
    <div class="text-sm mb-2">
      Processed {{ importProcessed }} of {{ importTotal }}
    </div>
    <ProgressBar
      :value="importTotal ? Math.round((importProcessed / importTotal) * 100) : 0"
    />
    <template #footer>
      <Button label="Cancel" severity="secondary" text size="small" :disabled="importing" @click="importOpen = false" />
      <Button
        label="Process"
        icon="pi pi-play"
        size="small"
        :loading="importing"
        :disabled="!importData"
        @click="runImport"
      />
    </template>
  </Dialog>
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
