<script setup>
import NavMenu from '@/components/NavMenu.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <NavMenu />
    <main class="flex flex-1 flex-col">
      <RouterView />
    </main>
  </div>
</template>
