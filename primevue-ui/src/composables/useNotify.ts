import { useToast } from 'primevue/usetoast'

export type NotifyType = 'success' | 'info' | 'warn' | 'error'

export function useNotify() {
  const toast = useToast()

  function notify(type: NotifyType, msg: string, summary?: string) {
    toast.add({
      severity: type,
      summary: summary ?? defaultSummary(type),
      detail: msg,
      life: type === 'error' ? 5000 : 3000,
    })
  }

  return {
    success: (msg: string, summary?: string) => notify('success', msg, summary),
    info: (msg: string, summary?: string) => notify('info', msg, summary),
    warn: (msg: string, summary?: string) => notify('warn', msg, summary),
    error: (msg: string, summary?: string) => notify('error', msg, summary),
  }
}

function defaultSummary(type: NotifyType): string {
  switch (type) {
    case 'success':
      return 'Success'
    case 'info':
      return 'Info'
    case 'warn':
      return 'Warning'
    case 'error':
      return 'Error'
  }
}
