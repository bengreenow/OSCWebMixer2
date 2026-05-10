<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import ChannelGroupFieldset from '@/components/shared/ChannelGroupFieldset.vue'
import MixerAuxPickerOverlay from '@/components/mixer/MixerAuxPickerOverlay.vue'
import MixerAuxToolbar from '@/components/mixer/MixerAuxToolbar.vue'
import MixerChannelSendStrip from '@/components/mixer/MixerChannelSendStrip.vue'
import MixerChannelsSkeleton from '@/components/mixer/MixerChannelsSkeleton.vue'
import { useMixerBodyUi } from '@/composables/useMixerBodyUi'
import { useMixerChannelGroups } from '@/composables/useMixerChannelGroups'
import { useMixerDesk } from '@/composables/useMixerDesk'
import { useMixerWebSocket } from '@/composables/useMixerWebSocket'
import type { MixerChannel } from '@/mixer/types'

const channels = ref<MixerChannel[]>([])
const mixerToolbarRef = ref<InstanceType<typeof MixerAuxToolbar> | null>(null)

const {
  channelGroups,
  isGroupCollapsed,
  toggleGroup,
  onGroupLegendClick,
  reloadCollapsedFromStorage,
} = useMixerChannelGroups(channels)

let sendOSCBridge: (address: string, args?: unknown[]) => void = () => {}
let isSocketOpenBridge: () => boolean = () => false

const {
  snapshot,
  selectedAuxValue,
  panning,
  showAuxPicker,
  loadingChannelValues,
  volumeByChannel,
  panByChannel,
  enabledAuxOptions,
  currentAuxOption,
  skeletonRowCount,
  handleMessageRaw,
  clearChannelValuesLoading,
  onAuxChange,
  onVolumeInput,
  onPanInput,
  tapSlider,
  resetSlider,
  pickAux,
  onAuxPointerdown,
} = useMixerDesk({
  channels,
  mixerToolbarRef,
  getSendOSC: () => sendOSCBridge,
  getIsSocketOpen: () => isSocketOpenBridge(),
  reloadCollapsedFromStorage,
})

const { disconnected, sendOSC, isSocketOpen, startWebsocket, stopWebsocket } =
  useMixerWebSocket({
    onMessage: handleMessageRaw,
    onConnectionLost: clearChannelValuesLoading,
  })

sendOSCBridge = sendOSC
isSocketOpenBridge = isSocketOpen

useMixerBodyUi({
  disconnected,
  showAuxPicker,
  panning,
})

onMounted(() => {
  reloadCollapsedFromStorage()
  panning.value = false
  startWebsocket()
})

onUnmounted(() => {
  stopWebsocket()
  clearChannelValuesLoading()
})
</script>

<template>
  <MixerAuxToolbar
    ref="mixerToolbarRef"
    v-model:panning="panning"
    v-model:selected-aux-value="selectedAuxValue"
    :enabled-aux-options="enabledAuxOptions"
    :current-aux-stereo="!!currentAuxOption?.stereo"
    @aux-pointerdown="onAuxPointerdown"
    @aux-change="onAuxChange"
  />
  <div id="snapshot">{{ snapshot }}</div>
  <div id="channelsWrap" :aria-busy="loadingChannelValues || undefined">
    <div
      class="channels-stack"
      :class="{ 'channel-values-loading': loadingChannelValues }"
    >
      <div id="channels">
        <ChannelGroupFieldset
          v-for="g in channelGroups"
          :key="g.key"
          :legend="g.legend"
          :collapsed="isGroupCollapsed(g.legend)"
          @legend-click="onGroupLegendClick($event, g.legend)"
          @toggle="toggleGroup(g.legend)"
        >
          <template v-for="channel in g.channels" :key="channel.channel">
            <h2 v-if="channel.title !== ''" :style="{ order: channel.order }">
              {{ channel.title }}
            </h2>
            <MixerChannelSendStrip
              :channel="channel"
              :volume="volumeByChannel[channel.channel] ?? 0"
              :pan="panByChannel[channel.channel] ?? 0.5"
              @volume-input="onVolumeInput"
              @pan-input="onPanInput"
              @tap-slider="tapSlider"
              @reset-slider="resetSlider"
            />
          </template>
        </ChannelGroupFieldset>
      </div>
      <MixerChannelsSkeleton
        :visible="loadingChannelValues"
        :row-count="skeletonRowCount"
      />
    </div>
  </div>
  <div id="overlay" class="fullscreen" />
  <div id="loader" />
  <MixerAuxPickerOverlay
    :enabled-aux-options="enabledAuxOptions"
    @pick="pickAux"
  />
</template>
