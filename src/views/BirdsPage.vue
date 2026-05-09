<script setup>
import { onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTitle } from '@vueuse/core'
import AppButton from '@/components/AppButton.vue'
import FormField from '@/components/FormField.vue'
import BirdCard from '@/components/BirdCard.vue'
import { useBirdsStore } from '@/stores/birds'
import { useAsync } from '@/composables/useAsync'

useTitle('My Birds · Birds')

const store = useBirdsStore()
const { list, loading, error } = storeToRefs(store)

const editing = ref(null)
const showForm = ref(false)

const form = reactive({
  common_name: '',
  scientific_name: '',
  family: '',
  description: '',
})

const {
  loading: formLoading,
  error: formError,
  fieldErrors: formFieldErrors,
  run: runForm,
} = useAsync()

function openNew() {
  editing.value = null
  form.common_name = ''
  form.scientific_name = ''
  form.family = ''
  form.description = ''
  showForm.value = true
}

function openEdit(bird) {
  editing.value = bird
  form.common_name = bird.common_name
  form.scientific_name = bird.scientific_name ?? ''
  form.family = bird.family ?? ''
  form.description = bird.description ?? ''
  showForm.value = true
}

function cancel() {
  showForm.value = false
  formError.value = null
  formFieldErrors.value = {}
}

async function onSubmit() {
  try {
    await runForm(() =>
      editing.value ? store.update(editing.value.id, { ...form }) : store.create({ ...form }),
    )
    showForm.value = false
  } catch {
    // shown
  }
}

async function onDelete(bird) {
  if (!window.confirm(`Delete bird "${bird.common_name}"?`)) return
  await store.remove(bird.id)
}

onMounted(() => {
  store.fetchAll().catch(() => {})
})
</script>

<template>
  <main class="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
    <header class="rise rise-1 mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="mono mb-1.5 text-text-3">MY BIRDS</p>
        <h1 class="text-3xl font-semibold tracking-tight text-text">Your birds</h1>
        <p class="mt-1 text-sm text-text-2">
          {{ list.length }} {{ list.length === 1 ? 'bird' : 'birds' }} · Keep birding.
        </p>
      </div>
      <AppButton @click="openNew">
        <span
          aria-hidden="true"
          class="text-base leading-none"
          >+</span
        >
        New bird
      </AppButton>
    </header>

    <section
      v-if="showForm"
      class="rise card mb-8 p-5"
    >
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-text">
          {{ editing ? 'Edit bird' : 'New bird' }}
        </h2>
        <span class="mono text-text-3">{{ editing ? `#${editing.id}` : 'draft' }}</span>
      </div>
      <form
        class="flex flex-col gap-4"
        @submit.prevent="onSubmit"
      >
        <FormField
          v-model="form.common_name"
          label="Common Name"
          required
          placeholder="e.g. Great Kiskadee"
          :error="formFieldErrors.common_name"
        />
        <FormField
          v-model="form.scientific_name"
          label="Scientific Name"
          placeholder="e.g. Pitangus sulphuratus"
          :error="formFieldErrors.scientific_name"
        />
        <FormField
          v-model="form.family"
          label="Family"
          placeholder="e.g. Tyrannidae"
          :error="formFieldErrors.family"
        />
        <FormField
          v-model="form.description"
          label="Description"
          placeholder="Notes about this species…"
          :error="formFieldErrors.description"
        />
        <p
          v-if="formError && Object.keys(formFieldErrors).length === 0"
          class="flex items-center gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger"
          role="alert"
          aria-live="polite"
        >
          <span aria-hidden="true">⚠</span>
          {{ formError.message }}
        </p>
        <div class="flex justify-end gap-2">
          <AppButton
            variant="ghost"
            type="button"
            @click="cancel"
            >Cancel</AppButton
          >
          <AppButton
            type="submit"
            :loading="formLoading"
          >
            {{
              formLoading
                ? editing
                  ? 'Saving…'
                  : 'Adding…'
                : editing
                  ? 'Save changes'
                  : 'Add bird'
            }}
          </AppButton>
        </div>
      </form>
    </section>

    <p
      v-if="loading && list.length === 0"
      class="text-sm text-text-2"
    >
      Loading birds…
    </p>
    <p
      v-else-if="error && list.length === 0"
      class="flex items-center gap-2 rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
      role="alert"
      aria-live="polite"
    >
      <span aria-hidden="true">⚠</span>
      {{ error.message }}
    </p>

    <div
      v-else-if="list.length === 0"
      class="card rise flex flex-col items-center gap-3 p-12 text-center"
    >
      <span class="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
        >
          <path
            d="M11 5v12M5 11h12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </span>
      <h2 class="text-base font-semibold text-text">Nothing here yet</h2>
      <p class="max-w-sm text-sm text-text-2">Add your first bird to start tracking sightings.</p>
      <AppButton
        class="mt-2"
        @click="openNew"
        >Add your first bird</AppButton
      >
    </div>

    <div
      v-else
      class="rise rise-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <BirdCard
        v-for="bird in list"
        :key="bird.id"
        :bird="bird"
        @edit="openEdit"
        @delete="onDelete"
      />
    </div>
  </main>
</template>
