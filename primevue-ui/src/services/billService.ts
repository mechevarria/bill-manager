import { http } from './http'
import type { Bill, BillListParams, BillPage } from '@/types/api'

export function listBills(params: BillListParams = {}): Promise<BillPage> {
  const search = new URLSearchParams()
  if (params.size !== undefined) search.set('size', String(params.size))
  if (params.start !== undefined) search.set('start', String(params.start))
  if (params.sort) search.set('sort', params.sort)
  if (params.order) search.set('order', params.order)
  const qs = search.toString()
  return http.get<BillPage>(`/bill${qs ? `?${qs}` : ''}`)
}

export function getBill(id: number): Promise<Bill> {
  return http.get<Bill>(`/bill/${id}`)
}

export function createBill(bill: Bill): Promise<Bill> {
  return http.post<Bill>('/bill', bill)
}

export function updateBill(bill: Bill): Promise<Bill> {
  return http.put<Bill>(`/bill/${bill.id}`, bill)
}

export function deleteBill(id: number): Promise<{ text: string }> {
  return http.delete<{ text: string }>(`/bill/${id}`)
}

export function deleteAllBills(): Promise<{ text: string; count: number }> {
  return http.delete<{ text: string; count: number }>('/bill')
}

export function getSummary(): Promise<Bill[]> {
  return http.get<Bill[]>('/summary')
}
