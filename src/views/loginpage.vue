<script setup>
import { reactive } from 'vue'
import { useTitle } from '@vueuse/core'
import AppButton from '@/components/AppButton.vue'
import FormField from '@/components/FormField.vue'

useTitle('Sign in · Birds')

const form = reactive({ email: '', password: '' })
</script>

<template>
  <main class="flex flex-1 items-center justify-center px-5 py-16">
    <div class="rise w-full max-w-sm">
      <div class="mb-8 text-center">
        <span class="chip chip-accent mb-4">Welcome back</span>
        <h1 class="mt-3 text-2xl font-semibold tracking-tight text-text">Sign in to Birds</h1>
        <p class="mt-1.5 text-sm text-text-2">Your birds are waiting.</p>
      </div>
      <form
        class="card flex flex-col gap-4 p-6"
        @submit.prevent
      >
        <FormField
          v-model="form.email"
          label="Email"
          type="email"
          autocomplete="email"
          required
          placeholder="you@company.com"
        />
        <FormField
          v-model="form.password"
          label="Password"
          type="password"
          autocomplete="current-password"
          required
        />
        <AppButton type="submit">Sign in</AppButton>
      </form>
      <p class="mt-5 text-center text-sm text-text-2">
        New here?
        <RouterLink
          to="/register"
          class="font-medium text-accent underline-offset-4 hover:underline"
        >
          Create an account
        </RouterLink>
      </p>
    </div>
  </main>
</template>
