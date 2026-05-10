import { computed, type Ref, ref } from 'vue'
import type { MixerChannel } from '@/mixer/types'

const COLLAPSED_KEY = 'mixer-group-collapsed'

export interface ChannelGroupSlice {
  key: string
  legend: string
  channels: MixerChannel[]
}

export function useMixerChannelGroups(channels: Ref<MixerChannel[]>) {
  const collapsedLabels = ref<string[]>([])

  function readCollapsed(): string[] {
    try {
      const s = localStorage.getItem(COLLAPSED_KEY)
      if (s) return JSON.parse(s) as string[]
    } catch {
      /* ignore */
    }
    return []
  }

  function reloadCollapsedFromStorage() {
    collapsedLabels.value = readCollapsed()
  }

  function saveCollapsed() {
    try {
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsedLabels.value))
    } catch {
      /* ignore */
    }
  }

  const channelGroups = computed((): ChannelGroupSlice[] => {
    const list = channels.value
    const groupOrder: string[] = []
    const groupChannels = new Map<string, MixerChannel[]>()
    for (const ch of list) {
      const key = ch.groupLabel && ch.groupLabel !== '' ? ch.groupLabel : ''
      if (!groupChannels.has(key)) {
        groupOrder.push(key)
        groupChannels.set(key, [])
      }
      groupChannels.get(key)!.push(ch)
    }
    for (const key of groupOrder) {
      groupChannels.get(key)!.sort((a, b) => a.order - b.order)
    }
    return groupOrder.map((key) => ({
      key,
      legend: key !== '' ? key : 'Channels',
      channels: groupChannels.get(key)!,
    }))
  })

  function isGroupCollapsed(legend: string): boolean {
    return collapsedLabels.value.includes(legend)
  }

  function toggleGroup(legend: string) {
    const set = new Set(collapsedLabels.value)
    if (set.has(legend)) set.delete(legend)
    else set.add(legend)
    collapsedLabels.value = [...set]
    saveCollapsed()
  }

  function onGroupLegendClick(e: MouseEvent, legend: string) {
    if ((e.target as HTMLElement).closest('button.channel-group-toggle')) return
    toggleGroup(legend)
  }

  return {
    collapsedLabels,
    channelGroups,
    isGroupCollapsed,
    toggleGroup,
    onGroupLegendClick,
    reloadCollapsedFromStorage,
  }
}
