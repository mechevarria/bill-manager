import { http } from './http'
import type { Defaults } from '@/types/api'

export function getDefaults(): Promise<Defaults> {
  return http.get<Defaults>('/defaults')
}

export function saveDefaults(defaults: Defaults): Promise<Defaults> {
  return http.post<Defaults>('/defaults', defaults)
}
