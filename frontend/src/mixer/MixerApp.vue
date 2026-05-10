<script setup lang="ts">
import MixerDesk from '@/components/mixer/MixerDesk.vue'
import '../styles/mixer.css'

export type { MixerAux, MixerChannel } from '@/mixer/types'
</script>

<template>
  <MixerDesk />
</template>
