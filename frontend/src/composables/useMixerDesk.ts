import {
  computed,
  nextTick,
  onScopeDispose,
  reactive,
  ref,
  watch,
  type Ref,
} from 'vue'
import MixerAuxToolbar from '@/components/mixer/MixerAuxToolbar.vue'
import type { OscMessage } from '@/lib/mixerOscInbound'
import { dbToSlider, formatColour, sliderToDb } from '@/lib/oscMath'
import type { MixerAux, MixerChannel } from '@/mixer/types'

const CHANNEL_SEND_DEBOUNCE_MS = 10

export function useMixerDesk(options: {
  channels: Ref<MixerChannel[]>
  mixerToolbarRef: Ref<InstanceType<typeof MixerAuxToolbar> | null>
  getSendOSC: () => (address: string, args?: unknown[]) => void
  getIsSocketOpen: () => boolean
  reloadCollapsedFromStorage: () => void
}) {
  const snapshot = ref('')
  const auxAvailable = ref<MixerAux[]>([])
  const selectedAuxValue = ref('')
  const panning = ref(false)
  const showAuxPicker = ref(false)
  const loadingChannelValues = ref(false)

  const volumeByChannel = reactive<Record<number, number>>({})
  const panByChannel = reactive<Record<number, number>>({})

  let pendingLevels = new Set<number>()
  let pendingPans = new Set<number>()
  let channelValuesLoadingTimeout: ReturnType<typeof setTimeout> | null = null

  const debouncedSendTimers = new Map<string, ReturnType<typeof setTimeout>>()
  const debouncedPendingSends = new Map<string, () => void>()

  function cancelDebouncedChannelSends() {
    for (const t of debouncedSendTimers.values()) {
      clearTimeout(t)
    }
    debouncedSendTimers.clear()
    debouncedPendingSends.clear()
  }

  function scheduleDebouncedChannelSend(key: string, send: () => void) {
    debouncedPendingSends.set(key, send)
    const prev = debouncedSendTimers.get(key)
    if (prev !== undefined) clearTimeout(prev)
    debouncedSendTimers.set(
      key,
      setTimeout(() => {
        debouncedSendTimers.delete(key)
        debouncedPendingSends.get(key)?.()
        debouncedPendingSends.delete(key)
      }, CHANNEL_SEND_DEBOUNCE_MS),
    )
  }

  onScopeDispose(() => {
    for (const t of debouncedSendTimers.values()) {
      clearTimeout(t)
    }
    debouncedSendTimers.clear()
    for (const fn of debouncedPendingSends.values()) {
      fn()
    }
    debouncedPendingSends.clear()
  })

  const channels = options.channels

  const enabledAuxOptions = computed(() =>
    auxAvailable.value.filter((a) => a.enabled),
  )

  const currentAuxOption = computed(() =>
    enabledAuxOptions.value.find(
      (a) => String(a.channel) === selectedAuxValue.value,
    ),
  )

  const skeletonRowCount = computed(() => {
    if (channels.value.length === 0) return 0
    const enabled = channels.value.filter((c) => c.enabled).length
    return Math.max(enabled, 1)
  })

  function ensureSliderState() {
    for (const ch of channels.value) {
      if (volumeByChannel[ch.channel] === undefined)
        volumeByChannel[ch.channel] = 0
      if (panByChannel[ch.channel] === undefined) panByChannel[ch.channel] = 0.5
    }
  }

  function sendOSC(address: string, args: unknown[] = []) {
    options.getSendOSC()(address, args)
  }

  function resetChannelValuesLoadingTimers() {
    if (channelValuesLoadingTimeout !== null) {
      clearTimeout(channelValuesLoadingTimeout)
      channelValuesLoadingTimeout = null
    }
  }

  function clearChannelValuesLoading() {
    resetChannelValuesLoadingTimers()
    pendingLevels.clear()
    pendingPans.clear()
    loadingChannelValues.value = false
  }

  function checkChannelValuesLoaded() {
    if (pendingLevels.size === 0 && pendingPans.size === 0) {
      clearChannelValuesLoading()
    }
  }

  function requestValues() {
    const auxId = selectedAuxValue.value
    if (!auxId || !options.getIsSocketOpen()) {
      clearChannelValuesLoading()
      return
    }
    resetChannelValuesLoadingTimers()
    pendingLevels.clear()
    pendingPans.clear()

    const list = channels.value
    const hasChannels = list.length > 0
    for (const ch of list) {
      pendingLevels.add(ch.channel)
      pendingPans.add(ch.channel)
    }

    loadingChannelValues.value = hasChannels

    if (!hasChannels) return

    for (const ch of list) {
      sendOSC(`/Input_Channels/${ch.channel}/Aux_Send/${auxId}/send_level/?`, [])
      sendOSC(`/Input_Channels/${ch.channel}/Aux_Send/${auxId}/send_pan/?`, [])
    }

    channelValuesLoadingTimeout = setTimeout(() => {
      channelValuesLoadingTimeout = null
      clearChannelValuesLoading()
    }, 2800)
  }

  function onVolumeInput(channel: number, e: Event) {
    const input = e.target as HTMLInputElement
    const sliderValue = parseFloat(input.value)
    const track = input.closest('.volume-track') as HTMLElement | null
    track?.style.setProperty('--value', sliderValue * 100 + '%')
    volumeByChannel[channel] = sliderValue
    scheduleDebouncedChannelSend(`send_level:${channel}`, () => {
      const auxId = selectedAuxValue.value
      sendOSC(`/Input_Channels/${channel}/Aux_Send/${auxId}/send_level`, [
        sliderToDb(volumeByChannel[channel]),
      ])
    })
  }

  function onPanInput(channel: number, e: Event) {
    const input = e.target as HTMLInputElement
    const sliderValue = parseFloat(input.value)
    const track = input.closest('.pan-track') as HTMLElement | null
    track?.style.setProperty('--value', sliderValue * 100 + '%')
    panByChannel[channel] = sliderValue
    scheduleDebouncedChannelSend(`send_pan:${channel}`, () => {
      const auxId = selectedAuxValue.value
      sendOSC(`/Input_Channels/${channel}/Aux_Send/${auxId}/send_pan`, [
        panByChannel[channel],
      ])
    })
  }

  let tapedTwice = false
  function tapSlider(e: TouchEvent) {
    if (!tapedTwice) {
      tapedTwice = true
      setTimeout(() => {
        tapedTwice = false
      }, 300)
      return
    }
    resetSlider(e as unknown as Event)
  }

  function resetSlider(e: Event) {
    const target = e.target as HTMLInputElement
    if (target.classList.contains('volumeInput')) target.value = '0'
    if (target.classList.contains('panInput')) target.value = '0.5'
    target.dispatchEvent(new Event('input', { bubbles: true }))
  }

  function applyAuxSelectionFromStorage() {
    const stored = localStorage.getItem('aux')
    if (
      stored &&
      enabledAuxOptions.value.some((a) => String(a.channel) === stored)
    ) {
      selectedAuxValue.value = stored
      showAuxPicker.value = false
    } else {
      if (stored) localStorage.removeItem('aux')
      showAuxPicker.value = enabledAuxOptions.value.length > 0
    }
  }

  function applyAuxBodyUI() {
    const opt = currentAuxOption.value
    const colour = opt ? formatColour(opt.colour) : null
    document.body.style.setProperty('--tint', colour ?? '6, 106, 166')
    const spanRef = options.mixerToolbarRef.value?.auxLabelSpan
    if (spanRef && opt) spanRef.textContent = opt.label
    const imgRef = options.mixerToolbarRef.value?.auxIconImg
    if (imgRef) imgRef.src = opt?.icon || ''
  }

  function onAuxChange() {
    cancelDebouncedChannelSends()
    localStorage.setItem('aux', selectedAuxValue.value)
    applyAuxBodyUI()

    panning.value = false

    for (const ch of channels.value) {
      volumeByChannel[ch.channel] = 0
      panByChannel[ch.channel] = 0.5
    }

    requestValues()
  }

  function handleMessageRaw(data: string) {
    let json: OscMessage
    try {
      json = JSON.parse(data) as OscMessage
    } catch {
      return
    }

    if (json.config) {
      options.reloadCollapsedFromStorage()
      snapshot.value = json.config.snapshot ?? ''
      auxAvailable.value = json.config.aux ?? []
      channels.value = json.config.channels ?? []
      applyAuxSelectionFromStorage()
      ensureSliderState()
      nextTick(() => {
        onAuxChange()
      })
      return
    }

    if (json.address === '/SnapshotName' && json.args?.[0] != null) {
      snapshot.value = String(json.args[0])
    }

    const sendLevel = json.address?.match(
      /^\/Input_Channels\/([0-9]+)\/Aux_Send\/([0-9]+)\/send_level$/,
    )
    if (sendLevel && json.args?.[0] != null) {
      const chNum = Number(sendLevel[1])
      const auxNum = sendLevel[2]
      if (auxNum === selectedAuxValue.value) {
        if (pendingLevels.delete(chNum)) checkChannelValuesLoaded()
        const db = parseFloat(String(json.args[0]))
        volumeByChannel[chNum] = dbToSlider(db)
        nextTick(() => {
          const el = document.querySelector(
            `input.volumeInput[data-channel="${chNum}"]`,
          ) as HTMLInputElement | null
          const track = el?.closest('.volume-track') as HTMLElement | null
          if (el && track) {
            track.style.setProperty('--value', parseFloat(el.value) * 100 + '%')
          }
        })
      }
    }

    const sendPan = json.address?.match(
      /^\/Input_Channels\/([0-9]+)\/Aux_Send\/([0-9]+)\/send_pan$/,
    )
    if (sendPan && json.args?.[0] != null) {
      const chNum = Number(sendPan[1])
      const auxNum = sendPan[2]
      if (auxNum === selectedAuxValue.value) {
        if (pendingPans.delete(chNum)) checkChannelValuesLoaded()
        panByChannel[chNum] = parseFloat(String(json.args[0]))
        nextTick(() => {
          const el = document.querySelector(
            `input.panInput[data-channel="${chNum}"]`,
          ) as HTMLInputElement | null
          const track = el?.closest('.pan-track') as HTMLElement | null
          if (el && track) {
            track.style.setProperty('--value', parseFloat(el.value) * 100 + '%')
          }
        })
      }
    }

    const channelNameMatch = json.address?.match(
      /^\/Input_Channels\/([0-9]+)\/Channel_Input\/name$/,
    )
    if (channelNameMatch && json.args?.[0] != null) {
      const id = Number(channelNameMatch[1])
      const row = channels.value.find((c) => c.channel === id)
      if (row) row.label = String(json.args[0])
    }

    const auxNameMatch = json.address?.match(
      /^\/Aux_Outputs\/([0-9]+)\/Buss_Trim\/name$/,
    )
    if (auxNameMatch && json.args?.[0] != null) {
      const id = Number(auxNameMatch[1])
      const aux = auxAvailable.value.find((a) => a.channel === id)
      if (aux) aux.label = String(json.args[0])
      if (String(id) === selectedAuxValue.value) applyAuxBodyUI()
    }
  }

  function onAuxPointerdown(ev: PointerEvent) {
    ev.preventDefault()
    ev.stopPropagation()
    showAuxPicker.value = true
  }

  function pickAux(ev: MouseEvent) {
    const btn = (ev.target as HTMLElement).closest('button')
    if (btn && 'value' in btn && (btn as HTMLButtonElement).value) {
      selectedAuxValue.value = (btn as HTMLButtonElement).value
      showAuxPicker.value = false
      onAuxChange()
      return
    }
    showAuxPicker.value = false
  }

  watch(currentAuxOption, applyAuxBodyUI)

  return {
    snapshot,
    auxAvailable,
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
    applyAuxBodyUI,
    pickAux,
    onAuxPointerdown,
  }
}
