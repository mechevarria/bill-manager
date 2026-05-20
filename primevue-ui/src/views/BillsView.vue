<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable, { type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import { useConfirm } from 'primevue/useconfirm'
import { listBills, deleteBill, createBill } from '@/services/billService'
import type { Bill, BillSortField, SortOrder } from '@/types/api'
import { useNotify } from '@/composables/useNotify'

const router = useRouter()
const notify = useNotify()
const confirm = useConfirm()

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

async function addBill() {
  try {
    const now = new Date()
    const month = now.toLocaleString('en-US', { month: 'long' })
    const newBill = await createBill({
      id: 0,
      billDate: now.toISOString(),
      month,
      year: String(now.getFullYear()),
      totalIncome: 0,
      totalExpense: 0,
      owner1Income: null,
      owner2Income: null,
      owner1Personal: null,
      owner2Personal: null,
      owner1Owe: null,
      owner2Owe: null,
      lastUpdated: now.toISOString(),
      expenses: [],
      incomes: [],
    } as unknown as Bill)
    notify.success(`Bill created: ${newBill.month} ${newBill.year}`)
    router.push({ name: 'bill-edit', params: { id: newBill.id } })
  } catch (e) {
    notify.error(e instanceof Error ? e.message : String(e))
  }
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return ''
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function amountClass(value: number | null | undefined): string {
  if (value == null || value === 0) return 'amount-neutral'
  return value > 0 ? 'amount-positive' : 'amount-negative'
}

const skeletonRows = Array.from({ length: 5 }, (_, i) => ({ id: -1 - i }))
</script>

<template>
  <div class="card">
    <div class="flex items-center gap-4 mb-4">
      <div class="font-semibold text-xl">Bills</div>
      <span class="text-muted-color text-sm">{{ totalRecords }} total</span>
      <Button
        label="New"
        icon="pi pi-plus"
        size="small"
        style="margin-left: auto"
        @click="addBill"
      />
    </div>

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
      @page="onPage"
      @sort="onSort"
    >
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
      <Column header="Actions" style="min-width: 12rem">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            size="small"
            outlined
            rounded
            class="mr-2"
            aria-label="Edit"
            @click="editBill(data)"
          />
          <Button
            icon="pi pi-trash"
            size="small"
            outlined
            rounded
            severity="danger"
            aria-label="Delete"
            @click="confirmDelete(data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.mr-2 {
  margin-right: 0.5rem;
}
</style>
