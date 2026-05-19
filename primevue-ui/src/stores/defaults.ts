import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Defaults } from '@/types/api'
import { getDefaults, saveDefaults } from '@/services/defaultsService'

export const useDefaultsStore = defineStore('defaults', () => {
  const defaults = ref<Defaults | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(force = false): Promise<Defaults> {
    if (defaults.value && !force) return defaults.value
    loading.value = true
    error.value = null
    try {
      defaults.value = await getDefaults()
      return defaults.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function save(next: Defaults): Promise<Defaults> {
    loading.value = true
    error.value = null
    try {
      defaults.value = await saveDefaults(next)
      return defaults.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return { defaults, loading, error, load, save }
})
