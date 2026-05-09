<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useTitle } from '@vueuse/core'
import AppButton from '@/components/AppButton.vue'
import FormField from '@/components/FormField.vue'
import SightingItem from '@/components/SightingItem.vue'
import { useBirdsStore } from '@/stores/birds'
import { useSightingsStore } from '@/stores/sightings'
import { useAsync } from '@/composables/useAsync'
import { SIGHTING_STATUSES, SIGHTING_STATUS_LABELS } from '@/lib/constants'

const props = defineProps({
  id: { type: Number, required: true },
})

const router = useRouter()
const birdsStore = useBirdsStore()
const sightingsStore = useSightingsStore()
const { list: sightings, loading: sightingsLoading } = storeToRefs(sightingsStore)

const bird = ref(null)
const loadingBird = ref(false)
const loadError = ref(null)

useTitle(() => (bird.value ? `${bird.value.common_name} · Birds` : 'Bird'))

const editingBird = ref(false)
const birdForm = reactive({
  common_name: '',
  scientific_name: '',
  family: '',
  description: '',
})
const { loading: birdLoading, fieldErrors: birdFieldErrors, run: runBird } = useAsync()

const newSighting = reactive({ title: '', description: '', status: 'planned' })
const {
  loading: newSightingLoading,
  error: newSightingError,
  fieldErrors: newSightingFieldErrors,
  run: runNewSighting,
} = useAsync()

const grouped = computed(() => {
  const groups = Object.fromEntries(SIGHTING_STATUSES.map((s) => [s, []]))
  for (const sighting of sightings.value) {
    if (groups[sighting.status]) groups[sighting.status].push(sighting)
  }
  return groups
})

const stats = computed(() => {
  const total = sightings.value.length
  const logged = sightings.value.filter((s) => s.status === 'logged').length
  const pct = total === 0 ? 0 : Math.round((logged / total) * 100)
  return { total, logged, pct }
})

async function loadBird() {
  loadingBird.value = true
  loadError.value = null
  try {
    bird.value = await birdsStore.getById(props.id)
  } catch (err) {
    loadError.value = err
  } finally {
    loadingBird.value = false
  }
}

function startEdit() {
  birdForm.common_name = bird.value.common_name
  birdForm.scientific_name = bird.value.scientific_name ?? ''
  birdForm.family = bird.value.family ?? ''
  birdForm.description = bird.value.description ?? ''
  editingBird.value = true
}

async function saveBird() {
  try {
    const updated = await runBird(() => birdsStore.update(props.id, { ...birdForm }))
    bird.value = updated
    editingBird.value = false
  } catch {
    // shown in form
  }
}

async function deleteBird() {
  if (!window.confirm(`Delete bird "${bird.value.common_name}" and all its sightings?`)) return
  await birdsStore.remove(props.id)
  router.replace('/birds')
}

async function addSighting() {
  try {
    await runNewSighting(() => sightingsStore.create(props.id, { ...newSighting }))
    newSighting.title = ''
    newSighting.description = ''
    newSighting.status = 'planned'
  } catch {
    // shown in form
  }
}

async function onSightingStatus(sighting, status) {
  await sightingsStore.update(sighting.id, { status })
}

async function onSightingDelete(sighting) {
  if (!window.confirm('Delete sighting?')) return
  await sightingsStore.remove(sighting.id)
}

onMounted(async () => {
  await loadBird()
  if (bird.value) await sightingsStore.fetchByBird(props.id).catch(() => {})
})

watch(
  () => props.id,
  async (newId, oldId) => {
    if (newId === oldId) return
    sightingsStore.reset()
    await loadBird()
    if (bird.value) await sightingsStore.fetchByBird(newId).catch(() => {})
  },
)
</script>

<template>
  <main class="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
    <RouterLink
      to="/birds"
      class="mono mb-6 inline-flex items-center gap-1.5 text-text-3 hover:text-text"
    >
      <span aria-hidden="true">←</span> My Birds
    </RouterLink>

    <p
      v-if="loadingBird"
      class="text-sm text-text-2"
    >
      Loading bird…
    </p>

    <p
      v-else-if="loadError"
      class="flex items-center gap-2 rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
      role="alert"
      aria-live="polite"
    >
      <span aria-hidden="true">⚠</span>
      {{ loadError.message }}
    </p>

    <template v-else-if="bird">
      <!-- Bird header card -->
      <header class="rise rise-1 card mb-6 p-6">
        <div
          v-if="!editingBird"
          class="flex flex-wrap items-start justify-between gap-4"
        >
          <div class="min-w-0 flex-1">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <span class="chip">#{{ bird.id }}</span>
              <span class="chip">{{ stats.total }} sightings</span>
              <span
                v-if="stats.total > 0"
                class="chip chip-accent"
                >{{ stats.pct }}% logged</span
              >
            </div>
            <h1 class="text-2xl font-semibold tracking-tight text-text">
              {{ bird.common_name }}
            </h1>
            <p
              v-if="bird.scientific_name"
              class="mt-0.5 text-sm text-text-2 italic"
            >
              {{ bird.scientific_name }}
            </p>
            <p
              v-if="bird.family"
              class="mt-1 text-xs text-text-3"
            >
              Family: {{ bird.family }}
            </p>
            <p
              v-if="bird.description"
              class="mt-1.5 text-sm text-text-2"
            >
              {{ bird.description }}
            </p>
          </div>
          <div class="flex shrink-0 gap-2">
            <AppButton
              variant="ghost"
              size="sm"
              @click="startEdit"
              >Edit</AppButton
            >
            <AppButton
              variant="danger"
              size="sm"
              @click="deleteBird"
              >Delete</AppButton
            >
          </div>
        </div>

        <form
          v-else
          class="flex flex-col gap-4"
          @submit.prevent="saveBird"
        >
          <FormField
            v-model="birdForm.common_name"
            label="Common Name"
            required
            :error="birdFieldErrors.common_name"
          />
          <FormField
            v-model="birdForm.scientific_name"
            label="Scientific Name"
            :error="birdFieldErrors.scientific_name"
          />
          <FormField
            v-model="birdForm.family"
            label="Family"
            :error="birdFieldErrors.family"
          />
          <FormField
            v-model="birdForm.description"
            label="Description"
            :error="birdFieldErrors.description"
          />
          <div class="flex justify-end gap-2">
            <AppButton
              variant="ghost"
              type="button"
              @click="editingBird = false"
              >Cancel</AppButton
            >
            <AppButton
              type="submit"
              :loading="birdLoading"
            >
              {{ birdLoading ? 'Saving…' : 'Save changes' }}
            </AppButton>
          </div>
        </form>

        <!-- Progress bar -->
        <div
          v-if="!editingBird && stats.total > 0"
          class="mt-5"
        >
          <div class="mb-1.5 flex items-center justify-between text-xs text-text-3">
            <span>Logged</span>
            <span class="mono">{{ stats.logged }}/{{ stats.total }}</span>
          </div>
          <div class="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              class="h-full rounded-full bg-accent transition-[width] duration-500"
              :style="{ width: `${stats.pct}%` }"
            />
          </div>
        </div>
      </header>

      <!-- Add sighting form -->
      <section class="rise rise-2 card mb-6 p-5">
        <h2 class="mb-4 text-sm font-semibold text-text">Add sighting</h2>
        <form
          class="grid gap-4 md:grid-cols-[1.5fr_2fr_auto_auto] md:items-end"
          @submit.prevent="addSighting"
        >
          <FormField
            v-model="newSighting.title"
            label="Title"
            required
            placeholder="e.g. Morning survey"
            :error="newSightingFieldErrors.title"
          />
          <FormField
            v-model="newSighting.description"
            label="Notes"
            placeholder="Optional details"
            :error="newSightingFieldErrors.description"
          />
          <div class="flex flex-col gap-1.5">
            <label
              for="new-sighting-status"
              class="text-xs font-medium text-text-2"
              >Status</label
            >
            <select
              id="new-sighting-status"
              v-model="newSighting.status"
              class="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text transition-colors hover:border-border-strong focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
            >
              <option
                v-for="s in SIGHTING_STATUSES"
                :key="s"
                :value="s"
              >
                {{ SIGHTING_STATUS_LABELS[s] }}
              </option>
            </select>
          </div>
          <AppButton
            type="submit"
            :loading="newSightingLoading"
          >
            {{ newSightingLoading ? 'Adding…' : 'Add sighting' }}
          </AppButton>
          <p
            v-if="newSightingError && Object.keys(newSightingFieldErrors).length === 0"
            class="flex items-center gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger md:col-span-4"
            role="alert"
            aria-live="polite"
          >
            <span aria-hidden="true">⚠</span>
            {{ newSightingError.message }}
          </p>
        </form>
      </section>

      <!-- Sightings list -->
      <section>
        <p
          v-if="sightingsLoading && sightings.length === 0"
          class="text-sm text-text-2"
        >
          Loading sightings…
        </p>
        <div
          v-else-if="sightings.length === 0"
          class="card flex flex-col items-center gap-2 p-10 text-center"
        >
          <span
            class="text-2xl"
            aria-hidden="true"
            >✦</span
          >
          <h3 class="text-sm font-semibold text-text">No sightings yet</h3>
          <p class="text-sm text-text-2">Add your first sighting above to get started.</p>
        </div>
        <div
          v-else
          class="flex flex-col gap-6"
        >
          <div
            v-for="status in SIGHTING_STATUSES"
            :key="status"
          >
            <div class="mb-2.5 flex items-center justify-between">
              <h2
                class="flex items-center gap-2 text-xs font-semibold tracking-wide text-text-2 uppercase"
              >
                {{ SIGHTING_STATUS_LABELS[status] }}
                <span class="mono text-text-3">{{ grouped[status].length }}</span>
              </h2>
            </div>
            <ul
              v-if="grouped[status].length > 0"
              class="flex flex-col gap-2"
            >
              <SightingItem
                v-for="sighting in grouped[status]"
                :key="sighting.id"
                :sighting="sighting"
                @update-status="(s) => onSightingStatus(sighting, s)"
                @delete="onSightingDelete"
              />
            </ul>
            <p
              v-else
              class="rounded-md border border-dashed border-border px-4 py-3 text-xs text-text-3"
            >
              Nothing here.
            </p>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>
