<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload'
import { useConfirm } from 'primevue/useconfirm'
import { parseDetailCsv } from '@/services/detailParserService'
import { useNotify } from '@/composables/useNotify'
import type { Detail, Owner } from '@/types/api'

interface Props {
  visible: boolean
  details: Detail[]
  owners: Owner[]
  expenseName: string
}
const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:details': [value: Detail[]]
}>()

const notify = useNotify()
const confirm = useConfirm()

// Local working copy so edits are reactive even if parent passes by-ref.
const working = ref<Detail[]>([])
watch(
  () => props.visible,
  (open) => {
    if (open) working.value = props.details.slice()
  },
  { immediate: true },
)

const ownerOptions = ref<{ label: string; value: string }[]>([])
watch(
  () => props.owners,
  (next) => {
    ownerOptions.value = next.map((o) => ({ label: o.label, value: o.name }))
  },
  { immediate: true },
)

function close(save: boolean) {
  if (save) emit('update:details', working.value)
  emit('update:visible', false)
}

function addDetail() {
  working.value.unshift({
    id: 0,
    date: '',
    detailDate: '',
    reference: '',
    type: '',
    description: '',
    amount: 0,
    personal: null,
    lastUpdated: '',
  } as unknown as Detail)
}

function deleteDetail(idx: number) {
  working.value.splice(idx, 1)
}

function clearAll() {
  confirm.require({
    message: 'Remove all details from this expense?',
    header: 'Clear all',
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { severity: 'danger' },
    accept: () => {
      working.value = []
      notify.info('Details cleared')
    },
  })
}

const colorSwatches: Record<string, string> = {
  active: '#64748b',
  success: '#22c55e',
  info: '#0ea5e9',
  warning: '#f97316',
  danger: '#ef4444',
}

function detailRowStyle(detail: Detail): Record<string, string> {
  if (!detail.personal) return {}
  const owner = props.owners.find((o) => o.name === detail.personal)
  if (!owner?.color) return {}
  const hex = colorSwatches[owner.color] ?? '#6b7280'
  return { backgroundColor: hex + '1a' }
}

async function onCsvSelect(event: FileUploadSelectEvent) {
  const file = Array.isArray(event.files) ? event.files[0] : event.files
  if (!file) return
  try {
    const parsed = await parseDetailCsv(file)
    parsed.forEach((p) => {
      working.value.push({
        id: 0,
        date: p.date ?? '',
        detailDate: '',
        reference: p.reference ?? '',
        type: p.type ?? '',
        description: p.description ?? '',
        amount: p.amount ?? 0,
        personal: p.personal ?? '',
        lastUpdated: '',
      } as unknown as Detail)
    })
    notify.success(`Imported ${parsed.length} detail(s)`)
  } catch (e) {
    notify.error(e instanceof Error ? e.message : String(e))
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    :header="`Details — ${expenseName || 'expense'}`"
    modal
    :draggable="false"
    :style="{ width: '70rem' }"
    @update:visible="emit('update:visible', $event)"
  >
    <Toolbar class="mb-4">
      <template #start>
        <div class="flex items-center gap-2">
          <FileUpload
            mode="basic"
            accept=".csv,text/csv"
            :auto="true"
            choose-label="Import CSV"
            choose-icon="pi pi-upload"
            custom-upload
            :choose-button-props="{ size: 'small', outlined: true }"
            @select="onCsvSelect"
          />
          <Button label="Add" icon="pi pi-plus" outlined size="small" @click="addDetail" />
        </div>
      </template>
      <template #end>
        <Button label="Clear All" icon="pi pi-trash" severity="danger" outlined size="small" @click="clearAll" />
      </template>
    </Toolbar>

    <DataTable
      :value="working"
      data-key="id"
      scrollable
      scroll-height="400px"
      paginator
      :rows="100"
      :rows-per-page-options="[25, 50, 100]"
      striped-rows
      size="small"
      :row-style="detailRowStyle"
    >
      <template #footer>
        <span class="text-muted-color text-sm">{{ working.length }} total</span>
      </template>
      <template #empty>
        <div class="empty-state">
          <i class="pi pi-file" />
          <div class="empty-state-title">No details yet</div>
          <div>Add rows manually or use <b>Import CSV</b> to upload a credit-card statement.</div>
        </div>
      </template>
      <Column field="date" header="Date" style="width: 8rem" sortable>
        <template #body="{ data }">
          <InputText v-model="data.date" placeholder="MM/DD/YYYY" size="small" fluid />
        </template>
      </Column>
      <Column field="type" header="Type" sortable>
        <template #body="{ data }">
          <InputText v-model="data.type" size="small" fluid />
        </template>
      </Column>
      <Column field="description" header="Description" sortable>
        <template #body="{ data }">
          <InputText v-model="data.description" size="small" fluid />
        </template>
      </Column>
      <Column field="amount" header="Amount" style="width: 10rem" sortable>
        <template #body="{ data }">
          <InputNumber v-model="data.amount" mode="currency" currency="USD" :min-fraction-digits="2" size="small" fluid />
        </template>
      </Column>
      <Column field="personal" header="Personal" style="width: 9rem" sortable>
        <template #body="{ data }">
          <Select
            v-model="data.personal"
            :options="ownerOptions"
            option-label="label"
            option-value="value"
            placeholder="—"
            show-clear
            size="small"
            fluid
          />
        </template>
      </Column>
      <Column header="" style="width: 4rem">
        <template #body="{ index }">
          <Button
            icon="pi pi-times"
            size="small"
            severity="danger"
            outlined
            rounded
            aria-label="Delete detail"
            @click="deleteDetail(index)"
          />
        </template>
      </Column>
    </DataTable>

    <template #footer>
      <Button label="Cancel" severity="secondary" text size="small" @click="close(false)" />
      <Button label="Apply" icon="pi pi-check" size="small" @click="close(true)" />
    </template>
  </Dialog>
</template>
