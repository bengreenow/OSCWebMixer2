<script setup lang="ts">
import { formatColour } from '@/lib/oscMath'
import type { MixerAux } from '@/mixer/types'

defineProps<{
  enabledAuxOptions: MixerAux[]
}>()

const emit = defineEmits<{
  pick: [ev: MouseEvent]
}>()
</script>

<template>
  <div id="auxiliaries" class="fullscreen" @click="emit('pick', $event)">
    <button
      v-for="opt in enabledAuxOptions"
      :key="opt.channel"
      type="button"
      :value="String(opt.channel)"
      :style="{
        '--tint': formatColour(opt.colour) ?? '6, 106, 166',
      }"
    >
      <img :src="opt.icon" width="30" height="30" alt="" />
      {{ opt.label }}
    </button>
  </div>
</template>
