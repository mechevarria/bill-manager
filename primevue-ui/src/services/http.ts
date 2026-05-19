// Tiny fetch wrapper. All paths are prefixed with /api, which Vite proxies
// to the Spring Boot API in dev (see vite.config.ts) and nginx rewrites in
// production. Throws HttpError on non-2xx so callers can react uniformly.

import type { ApiErrorBody } from '@/types/api'

const API_PREFIX = '/api'

export class HttpError extends Error {
  status: number
  body: unknown
  constructor(status: number, body: unknown, message: string) {
    super(message)
    this.status = status
    this.body = body
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(API_PREFIX + path, init)
  if (!res.ok) {
    const body = await readErrorBody(res)
    const message =
      body && typeof body === 'object' && 'error' in body
        ? String((body as ApiErrorBody).error)
        : `HTTP ${res.status}`
    throw new HttpError(res.status, body, message)
  }
  if (res.status === 204) {
    return undefined as T
  }
  return res.json() as Promise<T>
}

async function readErrorBody(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    try {
      return await res.text()
    } catch {
      return null
    }
  }
}

export const http = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  postMultipart: <T>(path: string, form: FormData) =>
    request<T>(path, { method: 'POST', body: form }),
}
