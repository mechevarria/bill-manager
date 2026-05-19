import { http } from './http'
import type { ParsedDetail } from '@/types/api'

export function parseDetailCsv(file: File): Promise<ParsedDetail[]> {
  const form = new FormData()
  form.append('file', file)
  return http.postMultipart<ParsedDetail[]>('/detail/parse', form)
}
