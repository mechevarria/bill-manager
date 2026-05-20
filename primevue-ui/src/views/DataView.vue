<script setup lang="ts">
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'
import Dialog from 'primevue/dialog'
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload'
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useDefaultsStore } from '@/stores/defaults'
import { useNotify } from '@/composables/useNotify'
import { createBill, deleteAllBills, getBill, getSummary } from '@/services/billService'
import type { Bill, DefaultExpense, DefaultIncome, Defaults, Owner } from '@/types/api'

const store = useDefaultsStore()
const confirm = useConfirm()
const notify = useNotify()

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
function confirmErase() {
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
    <div class="font-semibold text-xl mb-4">Data</div>
    <Toolbar>
      <template #start>
        <div class="flex items-center gap-2">
          <Button label="Export" icon="pi pi-download" outlined size="small" @click="doExport" />
          <FileUpload
            mode="basic"
            accept="application/json,.json"
            :auto="true"
            choose-label="Import"
            choose-icon="pi pi-upload"
            custom-upload
            :choose-button-props="{ size: 'small', outlined: true }"
            @select="onImportFileSelect"
          />
        </div>
      </template>
      <template #end>
        <Button label="Erase All" icon="pi pi-trash" severity="danger" size="small" @click="confirmErase" />
      </template>
    </Toolbar>
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
    <ProgressBar :value="exportTotal ? Math.round((exportProcessed / exportTotal) * 100) : 0" />
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
    <ProgressBar :value="importTotal ? Math.round((importProcessed / importTotal) * 100) : 0" />
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

  <Message v-if="!store.defaults" severity="warn" :closable="false">
    Load defaults first by visiting the Defaults page before exporting.
  </Message>
</template>
