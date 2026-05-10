<script setup lang="ts">
defineProps<{
  visible: boolean
  rowCount: number
}>()
</script>

<template>
  <div
    class="channels-skeleton"
    :class="{ 'channels-skeleton--visible': visible }"
    aria-hidden="true"
  >
    <div class="channels-skeleton-inner">
      <div
        v-for="i in rowCount"
        :key="'sk-' + i"
        class="channels-skeleton-row"
      >
        <span class="channels-skeleton-label" />
        <span class="channels-skeleton-track" />
      </div>
    </div>
  </div>
</template>
