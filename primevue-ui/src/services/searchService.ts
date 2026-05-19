import { http } from './http'
import type { SearchRequest, SearchResponse } from '@/types/api'

export function search(req: SearchRequest): Promise<SearchResponse> {
  return http.post<SearchResponse>('/search', req)
}
