<script setup lang="ts">
defineProps<{
  legend: string
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
  'legend-click': [e: MouseEvent]
}>()

function onLegendClick(e: MouseEvent) {
  emit('legend-click', e)
}
</script>

<template>
  <fieldset class="channel-group" :class="{ collapsed }">
    <legend class="channel-group-legend" @click="onLegendClick">
      <span class="channel-group-label">{{ legend }}</span>
      <button
        type="button"
        class="channel-group-toggle"
        :aria-label="collapsed ? 'Expand' : 'Collapse'"
        :title="collapsed ? 'Expand' : 'Collapse'"
        @click.stop.prevent="emit('toggle')"
      >
        {{ collapsed ? '▶' : '▼' }}
      </button>
    </legend>
    <div class="channel-group-content">
      <slot />
    </div>
  </fieldset>
</template>
