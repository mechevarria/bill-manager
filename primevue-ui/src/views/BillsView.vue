<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Tooltip from 'primevue/tooltip'

const vTooltip = Tooltip
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Dialog from 'primevue/dialog'
import DatePicker from 'primevue/datepicker'
import { useConfirm } from 'primevue/useconfirm'
import { listBills, deleteBill, createBill } from '@/services/billService'
import type { Bill, BillSortField, SortOrder } from '@/types/api'
import { useNotify } from '@/composables/useNotify'
import { useDefaultsStore } from '@/stores/defaults'

const router = useRouter()
const notify = useNotify()
const confirm = useConfirm()
const store = useDefaultsStore()

const rows = ref<Bill[]>([])
const totalRecords = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

const pageSize = ref(10)
const first = ref(0)
const sortField = ref<BillSortField>('billDate')
const sortOrder = ref<SortOrder>('desc')

async function load() {
  loading.value = true
  error.value = null
  try {
    const page = await listBills({
      size: pageSize.value,
      start: first.value / pageSize.value,
      sort: sortField.value,
      order: sortOrder.value,
    })
    rows.value = page.bills
    totalRecords.value = page.count
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

function onPage(event: DataTablePageEvent) {
  first.value = event.first
  pageSize.value = event.rows
  load()
}

function onSort(event: DataTableSortEvent) {
  sortField.value = (event.sortField as BillSortField) ?? 'billDate'
  sortOrder.value = event.sortOrder === 1 ? 'asc' : 'desc'
  load()
}

function editBill(bill: Bill) {
  router.push({ name: 'bill-edit', params: { id: bill.id } })
}

function confirmDelete(bill: Bill) {
  confirm.require({
    message: `Delete bill for ${bill.month} ${bill.year}? This cannot be undone.`,
    header: 'Confirm delete',
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      try {
        const res = await deleteBill(bill.id)
        notify.success(res.text ?? 'Bill deleted')
        load()
      } catch (e) {
        notify.error(e instanceof Error ? e.message : String(e))
      }
    },
  })
}


function formatCurrency(value: number | null | undefined): string {
  if (value == null) return ''
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function amountClass(value: number | null | undefined): string {
  if (value == null || value === 0) return 'amount-neutral'
  return value > 0 ? 'amount-positive' : 'amount-negative'
}

function incomeRatio(bill: Bill): number {
  const total = (bill.totalIncome ?? 0) + (bill.totalExpense ?? 0)
  if (total === 0) return 0
  return Math.min(1, Math.max(0, (bill.totalIncome ?? 0) / total))
}

const skeletonRows = Array.from({ length: 5 }, (_, i) => ({ id: -1 - i }))

const newBillDialogVisible = ref(false)
const newBillDate = ref<Date | null>(null)
const newBillSubmitting = ref(false)

function addBill() {
  newBillDate.value = null
  newBillDialogVisible.value = true
}

async function confirmAddBill() {
  if (!newBillDate.value) return
  newBillSubmitting.value = true
  try {
    const date = newBillDate.value
    const month = date.toLocaleString('en-US', { month: 'long' })
    const year = String(date.getFullYear())
    const billDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()

    const defaults = await store.load()

    const newBill = await createBill({
      id: 0,
      billDate,
      month,
      year,
      totalIncome: 0,
      totalExpense: 0,
      owner1Income: null,
      owner2Income: null,
      owner1Personal: null,
      owner2Personal: null,
      owner1Owe: null,
      owner2Owe: null,
      lastUpdated: billDate,
      incomes: defaults.incomes.map((di) => ({
        id: 0,
        owner: di.owner,
        description: di.description,
        amount: di.amount,
        incomeDate: billDate,
        month,
        year,
        lastUpdated: billDate,
      })),
      expenses: defaults.expenses.map((de) => ({
        id: 0,
        name: de.name,
        amount: de.amount,
        paid: de.paid,
        hasDetails: false,
        expenseDate: billDate,
        month,
        year,
        lastUpdated: billDate,
        details: [],
      })),
    } as unknown as Bill)
    newBillDialogVisible.value = false
    notify.success(`Bill created: ${newBill.month} ${newBill.year}`)
    router.push({ name: 'bill-edit', params: { id: newBill.id }, state: { isNew: true } })
  } catch (e) {
    notify.error(e instanceof Error ? e.message : String(e))
  } finally {
    newBillSubmitting.value = false
  }
}
</script>

<template>
  <div class="card">
    <Toolbar class="mb-4">
      <template #start>
        <div class="font-semibold text-xl">Bills</div>
      </template>
      <template #end>
        <Button label="New" icon="pi pi-plus" size="small" @click="addBill" />
      </template>
    </Toolbar>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

    <DataTable
      v-if="loading && rows.length === 0 && !error"
      :value="skeletonRows"
      size="small"
    >
      <Column header="Month"><template #body><Skeleton /></template></Column>
      <Column header="Year"><template #body><Skeleton /></template></Column>
      <Column header="Income"><template #body><Skeleton /></template></Column>
      <Column header="Expense"><template #body><Skeleton /></template></Column>
      <Column header="Ratio" style="min-width: 8rem"><template #body><Skeleton /></template></Column>
      <Column header="Actions" style="min-width: 12rem">
        <template #body>
          <Skeleton shape="circle" size="2.5rem" />
        </template>
      </Column>
    </DataTable>

    <DataTable
      v-else-if="!error"
      :value="rows"
      data-key="id"
      size="small"
      lazy
      row-hover
      :paginator="true"
      :first="first"
      :rows="pageSize"
      :rows-per-page-options="[5, 10, 25]"
      :total-records="totalRecords"
      :loading="loading"
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
      removable-sort
      :sort-field="sortField"
      :sort-order="sortOrder === 'desc' ? -1 : 1"
      style="cursor: pointer"
      @page="onPage"
      @sort="onSort"
      @row-click="editBill($event.data)"
    >
      <template #paginatorstart>
        <span class="text-muted-color text-sm">{{ totalRecords }} total</span>
      </template>
      <template #paginatorend>
        <span class="text-sm" style="visibility: hidden">{{ totalRecords }} total</span>
      </template>
      <template #empty>
        <div class="empty-state">
          <i class="pi pi-folder-open" />
          <div class="empty-state-title">No bills yet</div>
          <div>Click <b>New</b> to create the first one.</div>
        </div>
      </template>
      <Column field="month" header="Month" sortable style="min-width: 10rem" />
      <Column field="year" header="Year" sortable style="min-width: 8rem" />
      <Column field="totalIncome" header="Income" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <span :class="amountClass(data.totalIncome)">{{ formatCurrency(data.totalIncome) }}</span>
        </template>
      </Column>
      <Column field="totalExpense" header="Expense" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <span :class="data.totalExpense > 0 ? 'amount-negative' : 'amount-neutral'">
            {{ formatCurrency(data.totalExpense) }}
          </span>
        </template>
      </Column>
      <Column header="Ratio" style="min-width: 8rem">
        <template #body="{ data }">
          <div
            v-tooltip.top="`Income: ${(incomeRatio(data) * 100).toFixed(0)}% / Expense: ${((1 - incomeRatio(data)) * 100).toFixed(0)}%`"
            style="display: flex; align-items: center; height: 100%"
          >
            <div class="ratio-bar" style="flex: 1">
              <div :style="{ width: (incomeRatio(data) * 100) + '%', background: '#22c55ecc' }" />
              <div :style="{ width: ((1 - incomeRatio(data)) * 100) + '%', background: '#ef4444cc' }" />
            </div>
          </div>
        </template>
      </Column>
      <Column header="" style="width: 4rem">
        <template #body="{ data }">
          <Button
            icon="pi pi-trash"
            size="small"
            outlined
            rounded
            severity="danger"
            aria-label="Delete"
            @click.stop="confirmDelete(data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>

  <Dialog
    v-model:visible="newBillDialogVisible"
    header="New Bill"
    modal
    :draggable="false"
    style="width: 22rem"
  >
    <div class="flex flex-col gap-4 pt-2">
      <label for="new-bill-date" class="font-medium">Select month and year</label>
      <DatePicker
        id="new-bill-date"
        v-model="newBillDate"
        view="month"
        date-format="MM yy"
        :show-icon="true"
        icon-display="input"
        size="small"
        fluid
      />
    </div>
    <template #footer>
      <Button
        label="Cancel"
        severity="secondary"
        outlined
        size="small"
        @click="newBillDialogVisible = false"
      />
      <Button
        label="Create"
        icon="pi pi-check"
        size="small"
        :disabled="!newBillDate"
        :loading="newBillSubmitting"
        @click="confirmAddBill"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.ratio-bar {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
}
</style>
