<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'
import Chip from 'primevue/chip'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import ProgressSpinner from 'primevue/progressspinner'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { search } from '@/services/searchService'
import type { SearchOperator, SearchRequest, SearchResponse } from '@/types/api'
import { useNotify } from '@/composables/useNotify'

const notify = useNotify()

type ParamType = 'text' | 'category' | 'year' | 'price'
interface SearchParam {
  type: ParamType
  value: string | number
  label: string
}

const params = ref<SearchParam[]>([])
const operator = ref<SearchOperator>('OR')
const operatorOptions: { label: string; value: SearchOperator }[] = [
  { label: 'Any terms (OR)', value: 'OR' },
  { label: 'All terms (AND)', value: 'AND' },
]

const queryInput = ref('')
const result = ref<SearchResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const yearFor = (iso: string): number | null => {
  const m = /^(\d{4})/.exec(iso)
  return m && m[1] ? Number(m[1]) : null
}
const priceLabel = (bucket: number) => `$${bucket} to $${bucket + 100}`

function buildRequest(): SearchRequest {
  const req: SearchRequest = {
    text: [],
    category: [],
    yearStart: [],
    priceBucket: [],
    op: operator.value,
  }
  for (const p of params.value) {
    if (p.type === 'text') req.text!.push(String(p.value))
    else if (p.type === 'category') req.category!.push(String(p.value))
    else if (p.type === 'year') req.yearStart!.push(Number(p.value))
    else if (p.type === 'price') req.priceBucket!.push(Number(p.value))
  }
  return req
}

async function runSearch() {
  loading.value = true
  error.value = null
  try {
    result.value = await search(buildRequest())
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    error.value = msg
    notify.error(msg)
  } finally {
    loading.value = false
  }
}

function submitText() {
  const term = queryInput.value.trim()
  if (term.length < 2) return
  params.value.push({ type: 'text', value: term, label: term })
  queryInput.value = ''
  runSearch()
}

function drilldownCategory(category: string) {
  params.value.push({ type: 'category', value: category, label: `category — ${category}` })
  operator.value = 'AND'
  runSearch()
}
function drilldownYear(yearIso: string) {
  const y = yearFor(yearIso)
  if (y === null) return
  params.value.push({ type: 'year', value: y, label: `year — ${y}` })
  operator.value = 'AND'
  runSearch()
}
function drilldownPrice(bucket: number) {
  params.value.push({ type: 'price', value: bucket, label: `amount — ${priceLabel(bucket)}` })
  operator.value = 'AND'
  runSearch()
}

function removeParam(idx: number) {
  params.value.splice(idx, 1)
  if (params.value.length === 0) {
    result.value = null
  } else {
    runSearch()
  }
}

function clearAll() {
  params.value = []
  result.value = null
}

const filterCategories = computed(() => result.value?.facets.categories ?? [])
const filterYears = computed(() => result.value?.facets.years ?? [])
const filterPrices = computed(() => result.value?.facets.priceBuckets ?? [])

function fmtCurrency(value: number | null | undefined): string {
  if (value == null) return ''
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
function fmtDate(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}
function amountClass(value: number | null | undefined, category: string): string {
  if (value == null || value === 0) return 'amount-neutral'
  if (category === 'income') return 'amount-positive'
  return 'amount-negative'
}
</script>

<template>
  <div class="card">
    <div class="font-semibold text-xl mb-4">Search</div>

    <form class="mb-4" @submit.prevent="submitText">
      <Toolbar>
        <template #start>
          <div class="flex items-center gap-2">
            <Select
              v-model="operator"
              :options="operatorOptions"
              option-label="label"
              option-value="value"
              size="small"
              style="min-width: 12rem"
            />
            <InputText
              v-model="queryInput"
              placeholder="Search terms…"
              size="small"
              style="min-width: 16rem"
            />
          </div>
        </template>
        <template #end>
          <Button
            type="submit"
            label="Search"
            icon="pi pi-search"
            size="small"
            :loading="loading"
            :disabled="queryInput.trim().length < 2"
          />
        </template>
      </Toolbar>
    </form>

    <div v-if="params.length > 0" class="flex items-center gap-2 mb-2" style="flex-wrap: wrap">
      <span class="text-muted-color text-sm">Filters:</span>
      <Chip
        v-for="(p, i) in params"
        :key="i"
        :label="p.label"
        removable
        @remove="removeParam(i)"
      />
      <Button label="Clear all" severity="secondary" text size="small" @click="clearAll" />
    </div>

    <div v-else-if="!result && !loading" class="empty-state">
      <i class="pi pi-search" />
      <div class="empty-state-title">Search bills, expenses, and credit-card details</div>
      <div>Type a description and press <b>Search</b>, or drill in from a filter after your first query.</div>
    </div>
  </div>

  <div v-if="result" class="search-layout">
    <!-- Sidebar filters -->
    <div class="card">
      <div class="font-semibold text-base mb-4">Filter</div>
      <Accordion :value="['cat']" multiple>
        <AccordionPanel value="cat">
          <AccordionHeader>Category</AccordionHeader>
          <AccordionContent>
            <ul class="filter-list">
              <li v-for="f in filterCategories" :key="f.label">
                <button class="filter-link" @click="drilldownCategory(f.label)">
                  <span>{{ f.label }}</span>
                  <span class="filter-count">{{ f.count }}</span>
                </button>
              </li>
              <li v-if="filterCategories.length === 0" class="filter-empty">No categories</li>
            </ul>
          </AccordionContent>
        </AccordionPanel>
        <AccordionPanel value="year">
          <AccordionHeader>Year</AccordionHeader>
          <AccordionContent>
            <ul class="filter-list">
              <li v-for="f in filterYears" :key="f.label">
                <button class="filter-link" @click="drilldownYear(f.label)">
                  <span>{{ yearFor(f.label) }}</span>
                  <span class="filter-count">{{ f.count }}</span>
                </button>
              </li>
              <li v-if="filterYears.length === 0" class="filter-empty">No years</li>
            </ul>
          </AccordionContent>
        </AccordionPanel>
        <AccordionPanel value="price">
          <AccordionHeader>Amount</AccordionHeader>
          <AccordionContent>
            <ul class="filter-list">
              <li v-for="f in filterPrices" :key="f.label">
                <button class="filter-link" @click="drilldownPrice(f.label)">
                  <span>{{ priceLabel(f.label) }}</span>
                  <span class="filter-count">{{ f.count }}</span>
                </button>
              </li>
              <li v-if="filterPrices.length === 0" class="filter-empty">No buckets</li>
            </ul>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </div>

    <!-- Results -->
    <div class="card">
      <div class="flex items-center gap-4 mb-4">
        <div>
          <div class="font-semibold text-xl">{{ result.totalCount }} result(s)</div>
          <div class="text-muted-color text-sm">
            Total: {{ fmtCurrency(result.totalAmount) }}
          </div>
        </div>
        <ProgressSpinner v-if="loading" style="width: 1.5rem; height: 1.5rem; margin-left: auto" />
      </div>

      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

      <DataTable
        :value="result.results"
        paginator
        :rows="25"
        :rows-per-page-options="[25, 50, 100]"
        striped-rows
        sortable
        size="small"
      >
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-search" />
            <div class="empty-state-title">No results</div>
            <div>Try a broader search term or remove some filters.</div>
          </div>
        </template>
        <Column field="category" header="Category" sortable />
        <Column field="date" header="Date" sortable>
          <template #body="{ data }">{{ fmtDate(data.date) }}</template>
        </Column>
        <Column field="description" header="Description" sortable />
        <Column field="amount" header="Amount" sortable style="width: 9rem">
          <template #body="{ data }">
            <span :class="amountClass(data.amount, data.category)">{{ fmtCurrency(data.amount) }}</span>
          </template>
        </Column>
        <Column field="owner" header="Owner" sortable style="width: 9rem" />
      </DataTable>
    </div>
  </div>

  <div v-else-if="loading" class="card">
    <Skeleton width="40%" height="1.25rem" class="mb-4" />
    <Skeleton height="2rem" class="mb-2" />
    <Skeleton height="2rem" class="mb-2" />
    <Skeleton height="2rem" class="mb-2" />
    <Skeleton height="2rem" />
  </div>
  <div v-else-if="error" class="card">
    <Message severity="error" :closable="false">{{ error }}</Message>
  </div>
</template>

<style scoped>
.search-layout {
  display: grid;
  grid-template-columns: minmax(0, 14rem) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}
@media (max-width: 768px) {
  .search-layout {
    grid-template-columns: 1fr;
  }
}
.filter-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.filter-link {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  border: 0;
  padding: 0.375rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  color: var(--p-text-color);
  font-size: 0.85rem;
  text-align: left;
}
.filter-link:hover {
  background: color-mix(in srgb, var(--p-text-color) 6%, transparent);
}
.filter-count {
  color: var(--p-text-muted-color);
  font-variant-numeric: tabular-nums;
}
.filter-empty {
  color: var(--p-text-muted-color);
  font-size: 0.85rem;
  padding: 0.5rem;
}
</style>
