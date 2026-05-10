<script setup lang="ts">
import ChannelGroupFieldset from '@/components/shared/ChannelGroupFieldset.vue'
import { BLANK_ICON_SRC } from '@/admin/iconDialogSvgs'
import type { ChannelFieldsetData, ChannelRowData } from '@/admin/types'

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
    <div class="channels-section">
      <div id="channels" class="list">
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
              class="channel-row"
              :style="{ order: row.order }"
              :data-channel-index="row.channelIndex0"
              draggable="true"
              @dragstart="emit('dragStart', row, $event)"
              @dragend="emit('dragEnd', $event)"
            >
              <label class="listNumber">{{
                String(row.listIndexPlusOne).padStart(2, '0')
              }}</label>
              <label>
                <input
                  v-model="row.title"
                  type="text"
                  name="sectionTitle[]"
                  placeholder="Section Title"
                />
              </label>
              <label>
                <input v-model="row.enabled" type="checkbox" />
                <input
                  type="hidden"
                  name="channelEnabled[]"
                  :value="row.enabled ? 'true' : 'false'"
                />
              </label>
              <label
                ><input v-model="row.name" type="text" name="channelName[]"
              /></label>
              <span class="group-badge">{{ row.groupBadge }}</span>
              <span>
                <img
                  :src="iconDisplay(row.icon)"
                  class="icon"
                  width="44"
                  height="44"
                  alt=""
                  @click.prevent="emit('openChannelIcon', row)"
                />
                <input type="hidden" name="channelIcon[]" :value="row.icon" />
              </span>
              <button
                type="button"
                class="up"
                @click="emit('moveUp', row, $event)"
              />
              <button
                type="button"
                class="down"
                @click="emit('moveDown', row, $event)"
              />
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
      <div id="groupsPanel" class="groups-panel">
        <h2>Groups</h2>
        <div id="groupsList">
          <div
            v-for="(g, gidx) in groupsArray"
            :key="'g-' + gidx"
            class="group-item"
          >
            <input
              v-model="g.label"
              type="text"
              name="groupLabel[]"
              placeholder="Group name"
            />
            <button
              type="button"
              class="delete"
              @click.prevent="emit('removeGroup', gidx)"
            >
              &times;
            </button>
            <div
              class="group-drop-zone"
              :data-group-index="String(gidx)"
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
                  emit('dropOnGroup', ev, gidx)
                }
              "
            >
              Drop channels here
            </div>
          </div>
          <div
            class="group-drop-zone ungroup-zone"
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
                ;(ev.currentTarget as HTMLElement).classList.remove('drag-over')
                emit('dropUngroup', ev)
              }
            "
          >
            Ungroup
          </div>
        </div>
        <div class="groups-panel-actions">
          <button type="button" id="addGroup" @click="emit('addGroup')">
            Add group
          </button>
          <button
            type="button"
            id="suggestGroups"
            @click="emit('suggestGroups')"
          >
            Suggest groups
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
