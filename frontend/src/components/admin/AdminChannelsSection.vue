<script setup lang="ts">
import ChannelGroupFieldset from '@/components/shared/ChannelGroupFieldset.vue'
import { BLANK_ICON_SRC } from '@/admin/iconDialogSvgs'
import type { ChannelFieldsetData, ChannelRowData } from '@/admin/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'

defineProps<{
  channelFieldsets: ChannelFieldsetData[]
  groupsArray: { label: string }[]
  collapsedIndices: ReadonlySet<number>
}>()

const emit = defineEmits<{
  toggleFieldset: [fi: number]
  fieldsetLegendClick: [ev: MouseEvent, fi: number]
  dragStart: [row: ChannelRowData, ev: DragEvent]
  dragEnd: [ev: DragEvent]
  dropOnGroup: [ev: DragEvent, groupIdx: number]
  dropUngroup: [ev: DragEvent]
  removeGroup: [idx: number]
  addGroup: []
  suggestGroups: []
  moveUp: [row: ChannelRowData, e: Event]
  moveDown: [row: ChannelRowData, e: Event]
  openChannelIcon: [row: ChannelRowData]
}>()

function iconDisplay(src: string) {
  return src === '' ? BLANK_ICON_SRC : src
}
</script>

<template>
  <section id="channels-content">
    <div class="channels-section gap-8">
      <div id="channels" class="flex min-w-0 flex-col gap-4">
        <template v-if="!channelFieldsets.length">
          <p class="notice">No Channels Loaded</p>
        </template>
        <template v-else>
          <ChannelGroupFieldset
            v-for="(fieldset, fi) in channelFieldsets"
            :key="'fs-' + fi"
            :legend="fieldset.legend"
            :collapsed="collapsedIndices.has(fi)"
            @toggle="emit('toggleFieldset', fi)"
            @legend-click="emit('fieldsetLegendClick', $event, fi)"
          >
            <div
              v-for="row in fieldset.rows"
              :key="'ch-' + row.channelIndex0"
              class="channel-row hover:bg-accent/40 flex flex-wrap items-center gap-2 rounded-lg py-1 md:flex-nowrap"
              :style="{ order: row.order }"
              :data-channel-index="row.channelIndex0"
              draggable="true"
              @dragstart="emit('dragStart', row, $event)"
              @dragend="emit('dragEnd', $event)"
            >
              <Badge
                variant="secondary"
                class="font-mono shrink-0 rounded px-2 py-1 text-[0.8rem]"
              >
                {{ String(row.listIndexPlusOne).padStart(2, '0') }}
              </Badge>
              <div class="min-w-[100px] flex-1 md:max-w-[180px]">
                <Label
                  :for="'ch-title-' + row.channelIndex0"
                  class="sr-only"
                >
                  Section title
                </Label>
                <Input
                  :id="'ch-title-' + row.channelIndex0"
                  v-model="row.title"
                  type="text"
                  name="sectionTitle[]"
                  placeholder="Section Title"
                />
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <Checkbox
                  :checked="row.enabled"
                  @update:checked="
                    (v: boolean | 'indeterminate') => {
                      row.enabled = v === true
                    }
                  "
                />
                <input
                  type="hidden"
                  name="channelEnabled[]"
                  :value="row.enabled ? 'true' : 'false'"
                />
              </div>
              <div class="min-w-[140px] flex-1 md:max-w-[220px]">
                <Label
                  :for="'ch-name-' + row.channelIndex0"
                  class="sr-only"
                  >Channel name</Label
                >
                <Input
                  :id="'ch-name-' + row.channelIndex0"
                  v-model="row.name"
                  type="text"
                  name="channelName[]"
                />
              </div>
              <Badge
                variant="outline"
                class="text-muted-foreground max-w-[8rem] shrink-0 truncate text-xs font-normal"
              >
                {{ row.groupBadge }}
              </Badge>
              <span class="shrink-0">
                <img
                  :src="iconDisplay(row.icon)"
                  class="icon border-input size-11 cursor-pointer rounded-md border object-contain p-1"
                  width="44"
                  height="44"
                  alt=""
                  @click.prevent="emit('openChannelIcon', row)"
                />
                <input type="hidden" name="channelIcon[]" :value="row.icon" />
              </span>
              <div class="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  class="up size-10"
                  @click="emit('moveUp', row, $event)"
                >
                  <ChevronUp class="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  class="down size-10"
                  @click="emit('moveDown', row, $event)"
                >
                  <ChevronDown class="size-4" />
                </Button>
              </div>
              <input
                type="hidden"
                name="channelOrder[]"
                :value="row.order"
              />
              <input
                class="channel-group-input"
                type="hidden"
                name="channelGroup[]"
                :value="row.groupIndex"
              />
            </div>
          </ChannelGroupFieldset>
        </template>
      </div>
      <aside id="groupsPanel" class="groups-panel mt-10 md:mt-0">
        <Card class="border-muted gap-5 border p-6 shadow-none">
          <CardTitle class="font-heading mb-4 text-xl font-semibold tracking-tight">
            Groups
          </CardTitle>
          <div id="groupsList" class="flex flex-col gap-3">
            <div
              v-for="(g, gidx) in groupsArray"
              :key="'g-' + gidx"
              class="group-item"
            >
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <Input
                  v-model="g.label"
                  type="text"
                  class="min-w-[6rem] flex-1"
                  name="groupLabel[]"
                  placeholder="Group name"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  class="size-10 shrink-0 rounded-full border-0"
                  aria-label="Remove group"
                  @click.prevent="emit('removeGroup', gidx)"
                >
                  ×
                </Button>
              </div>
              <div
                class="group-drop-zone border-muted-foreground/40 text-muted-foreground hover:border-foreground hover:bg-accent/30 flex min-h-11 cursor-default items-center justify-center rounded-md border-2 border-dashed px-2 text-center text-xs"
                :data-group-index="String(gidx)"
                @dragover.prevent="
                  (ev) =>
                    (ev.currentTarget as HTMLElement).classList.add('drag-over')
                "
                @dragleave="
                  (ev) =>
                    (ev.currentTarget as HTMLElement).classList.remove(
                      'drag-over',
                    )
                "
                @drop="
                  (ev) => {
                    ;(ev.currentTarget as HTMLElement).classList.remove(
                      'drag-over',
                    )
                    emit('dropOnGroup', ev, gidx)
                  }
                "
              >
                Drop channels here
              </div>
            </div>
            <div
              class="group-drop-zone ungroup-zone border-muted-foreground/40 text-muted-foreground hover:border-foreground hover:bg-accent/30 flex min-h-11 cursor-default items-center justify-center rounded-md border-2 border-dashed px-2 text-center text-xs"
              @dragover.prevent="
                (ev) =>
                  (ev.currentTarget as HTMLElement).classList.add('drag-over')
              "
              @dragleave="
                (ev) =>
                  (ev.currentTarget as HTMLElement).classList.remove('drag-over')
              "
              @drop="
                (ev) => {
                  ;(ev.currentTarget as HTMLElement).classList.remove(
                    'drag-over',
                  )
                  emit('dropUngroup', ev)
                }
              "
            >
              Ungroup
            </div>
          </div>
          <div class="groups-panel-actions mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" @click="emit('addGroup')">
              Add group
            </Button>
            <Button type="button" variant="outline" @click="emit('suggestGroups')">
              Suggest groups
            </Button>
          </div>
        </Card>
      </aside>
    </div>
  </section>
</template>
