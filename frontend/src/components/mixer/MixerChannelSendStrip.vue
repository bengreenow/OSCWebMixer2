<script setup lang="ts">
import type { MixerChannel } from '@/mixer/types'

defineProps<{
  channel: MixerChannel
  volume: number
  pan: number
}>()

const emit = defineEmits<{
  volumeInput: [channel: number, e: Event]
  panInput: [channel: number, e: Event]
  tapSlider: [e: TouchEvent]
  resetSlider: [e: Event]
}>()
</script>

<template>
  <div
    :class="{ disabled: !channel.enabled }"
    :style="{ order: channel.order }"
  >
    <label class="volume">
      <img
        v-if="channel.icon !== ''"
        :src="channel.icon"
        width="22"
        height="22"
        class="icon"
        alt=""
      />
      <span>{{ channel.label }}</span>
      <span
        class="volume-track"
        :style="{ '--value': volume * 100 + '%' }"
      >
        <input
          type="range"
          class="volumeInput"
          :data-channel="channel.channel"
          step="0.001"
          min="0"
          max="1"
          :value="volume"
          @input="emit('volumeInput', channel.channel, $event)"
          @touchstart.passive="emit('tapSlider', $event)"
          @dblclick.prevent="emit('resetSlider', $event)"
        />
      </span>
    </label>
    <label class="pan">
      <img
        v-if="channel.icon !== ''"
        :src="channel.icon"
        width="22"
        height="22"
        class="icon"
        alt=""
      />
      <span>{{ channel.label }}</span>
      <span class="pan-track" :style="{ '--value': pan * 100 + '%' }">
        <input
          type="range"
          class="panInput"
          :data-channel="channel.channel"
          step="0.001"
          min="0"
          max="1"
          :value="pan"
          @input="emit('panInput', channel.channel, $event)"
          @touchstart.passive="emit('tapSlider', $event)"
          @dblclick.prevent="emit('resetSlider', $event)"
        />
      </span>
    </label>
  </div>
</template>
