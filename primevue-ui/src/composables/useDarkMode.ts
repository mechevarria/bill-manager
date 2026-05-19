import { ref, watch } from 'vue'

const STORAGE_KEY = 'bill-manager:dark-mode'
const DARK_CLASS = 'app-dark'

function initial(): boolean {
  if (typeof window === 'undefined') return false
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === '1'
}

const isDark = ref(initial())

if (typeof window !== 'undefined') {
  document.documentElement.classList.toggle(DARK_CLASS, isDark.value)
  watch(isDark, (next) => {
    document.documentElement.classList.toggle(DARK_CLASS, next)
    window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
  })
}

export function useDarkMode() {
  return {
    isDark,
    toggle: () => {
      isDark.value = !isDark.value
    },
  }
}
