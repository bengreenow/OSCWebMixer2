<script setup lang="ts">
import { ref } from 'vue'
import { formatColour } from '@/lib/oscMath'
import type { MixerAux } from '@/mixer/types'

defineProps<{
  enabledAuxOptions: MixerAux[]
  currentAuxStereo: boolean
}>()

const panning = defineModel<boolean>('panning', { required: true })
const selectedAuxValue = defineModel<string>('selectedAuxValue', { required: true })

const emit = defineEmits<{
  auxPointerdown: [ev: PointerEvent]
  auxChange: []
}>()

const auxIconImg = ref<HTMLImageElement | null>(null)
const auxLabelSpan = ref<HTMLSpanElement | null>(null)

defineExpose({ auxIconImg, auxLabelSpan })
</script>

<template>
  <div id="mix">
    <div :style="{ display: currentAuxStereo ? 'flex' : 'none' }">
      <label
        ><input v-model="panning" type="checkbox" /><span>PAN</span></label
      >
    </div>
    <label class="selectLabel">
      <img
        ref="auxIconImg"
        src=""
        width="22"
        height="22"
        class="icon"
        alt=""
      />
      <span ref="auxLabelSpan"></span>
      <select
        id="aux"
        v-model="selectedAuxValue"
        @pointerdown="emit('auxPointerdown', $event)"
        @change="emit('auxChange')"
      >
        <option
          v-for="opt in enabledAuxOptions"
          :key="opt.channel"
          :value="String(opt.channel)"
          :data-channel="opt.channel"
          :data-colour="formatColour(opt.colour)"
          :data-stereo="String(opt.stereo)"
          :data-icon="opt.icon"
        >
          {{ opt.label }}
        </option>
      </select>
    </label>
    <div />
  </div>
</template>
