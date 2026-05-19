// Mirrors the Spring Boot API DTOs in org.billmanager.api.*
// Dates are serialized by Jackson as ISO-8601 strings (or "MM/dd/yyyy" for
// the explicit `date` string field on Detail and ParsedDetail).

export interface Bill {
  id: number
  billDate: string
  month: string
  year: string
  totalIncome: number
  totalExpense: number
  owner1Income: number | null
  owner2Income: number | null
  owner1Personal: number | null
  owner2Personal: number | null
  owner1Owe: number | null
  owner2Owe: number | null
  lastUpdated: string
  expenses: Expense[]
  incomes: Income[]
}

export interface Expense {
  id: number
  expenseDate: string
  name: string
  month: string
  year: string
  amount: number
  paid: string
  hasDetails: boolean
  lastUpdated: string
  details: Detail[]
}

export interface Income {
  id: number
  owner: string
  description: string
  amount: number
  incomeDate: string
  month: string
  year: string
  lastUpdated: string
}

export interface Detail {
  id: number
  date: string
  detailDate: string
  reference: string | null
  type: string | null
  description: string
  amount: number
  personal: string | null
  lastUpdated: string
}

export interface Defaults {
  id: number
  totalIncome: number
  totalExpenses: number
  owner1Income: number
  owner2Income: number
  owner1Personal: number
  owner2Personal: number
  owner1Owe: number
  owner2Owe: number
  owners: Owner[]
  incomes: DefaultIncome[]
  expenses: DefaultExpense[]
}

export interface Owner {
  id: number
  name: string
  label: string
  color: string
}

export interface DefaultIncome {
  id: number
  owner: string
  description: string
  amount: number
}

export interface DefaultExpense {
  id: number
  name: string
  amount: number
  paid: string
  hasDetails: boolean
}

// --- Bill list pagination ---

export type BillSortField =
  | 'billDate'
  | 'month'
  | 'year'
  | 'totalExpense'
  | 'totalIncome'
  | 'lastUpdated'

export type SortOrder = 'asc' | 'desc'

export interface BillListParams {
  size?: number
  start?: number
  sort?: BillSortField
  order?: SortOrder
}

export interface BillPage {
  count: number
  bills: Bill[]
}

// --- Search ---

export type SearchOperator = 'AND' | 'OR'

export interface SearchRequest {
  text?: string[]
  category?: string[]
  yearStart?: number[]
  priceBucket?: number[]
  op?: SearchOperator
}

export interface SearchDoc {
  category: string
  date: string
  owner: string | null
  description: string
  amount: number | null
}

export interface Facet<T> {
  label: T
  count: number
}

export interface SearchResponse {
  totalCount: number
  totalAmount: number
  results: SearchDoc[]
  facets: {
    categories: Facet<string>[]
    years: Facet<string>[]
    priceBuckets: Facet<number>[]
  }
}

// --- CSV upload ---

export interface ParsedDetail {
  date: string | null
  reference: string | null
  type: string | null
  description: string | null
  amount: number | null
  personal: string | null
}

// --- Errors ---

export interface ApiErrorBody {
  error: string
}
