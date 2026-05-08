import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '@/lib/api'

export const useBirdsStore = defineStore('birds', () => {
  const list = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      list.value = (await apiFetch('/birds', { auth: true })) ?? []
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  async function create(payload) {
    const bird = await apiFetch('/birds', {
      method: 'POST',
      body: payload,
      auth: true,
    })
    list.value.push(bird)
    return bird
  }

  async function update(id, payload) {
    const updated = await apiFetch(`/birds/${id}`, {
      method: 'PATCH',
      body: payload,
      auth: true,
    })
    const index = list.value.findIndex((b) => b.id === id)
    if (index !== -1) list.value[index] = updated
    return updated
  }

  async function remove(id) {
    await apiFetch(`/birds/${id}`, { method: 'DELETE', auth: true })
    list.value = list.value.filter((b) => b.id !== id)
  }

  async function getById(id) {
    const existing = list.value.find((b) => b.id === id)
    if (existing) return existing
    return apiFetch(`/birds/${id}`, { auth: true })
  }

  function reset() {
    list.value = []
    error.value = null
  }

  return { list, loading, error, fetchAll, create, update, remove, getById, reset }
})
