import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '@/lib/api'

export const useSightingsStore = defineStore('sightings', () => {
  const list = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentBirdId = ref(null)

  async function fetchByBird(birdId) {
    loading.value = true
    error.value = null
    currentBirdId.value = birdId
    try {
      list.value = (await apiFetch(`/birds/${birdId}/sightings`, { auth: true })) ?? []
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  async function create(birdId, payload) {
    const sighting = await apiFetch(`/birds/${birdId}/sightings`, {
      method: 'POST',
      body: payload,
      auth: true,
    })
    list.value.push(sighting)
    return sighting
  }

  async function update(id, payload) {
    const updated = await apiFetch(`/sightings/${id}`, {
      method: 'PATCH',
      body: payload,
      auth: true,
    })
    const index = list.value.findIndex((s) => s.id === id)
    if (index !== -1) list.value[index] = updated
    return updated
  }

  async function remove(id) {
    await apiFetch(`/sightings/${id}`, { method: 'DELETE', auth: true })
    list.value = list.value.filter((s) => s.id !== id)
  }

  function reset() {
    list.value = []
    currentBirdId.value = null
    error.value = null
  }

  return {
    list,
    loading,
    error,
    currentBirdId,
    fetchByBird,
    create,
    update,
    remove,
    reset,
  }
})
