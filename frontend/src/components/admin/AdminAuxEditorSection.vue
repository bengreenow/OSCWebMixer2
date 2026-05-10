<script setup lang="ts">
import { BLANK_ICON_SRC } from '@/admin/iconDialogSvgs'
import type { AuxUiRow } from '@/admin/types'

defineProps<{
  auxRows: AuxUiRow[]
}>()

const emit = defineEmits<{
  openIcon: [index: number]
}>()

function iconDisplay(src: string) {
  return src === '' ? BLANK_ICON_SRC : src
}
</script>

<template>
  <section id="aux-content">
    <div id="auxiliaries" class="list">
      <template v-if="!auxRows.length">
        <p class="notice">No Auxiliaries Loaded</p>
      </template>
      <div v-for="(row, idx) in auxRows" :key="'aux-' + idx">
        <label class="listNumber">{{
          String(idx + 1).padStart(2, '0')
        }}</label>
        <label>
          <input v-model="row.enabled" type="checkbox" />
          <input
            type="hidden"
            name="auxEnabled[]"
            :value="row.enabled ? 'true' : 'false'"
          />
        </label>
        <label><input v-model="row.name" type="text" name="auxName[]" /></label>
        <label
          ><input v-model="row.colour" type="color" name="auxColour[]"
        /></label>
        <span>
          <img
            :src="iconDisplay(row.icon)"
            class="icon"
            width="44"
            height="44"
            alt=""
            @click.prevent="emit('openIcon', idx)"
          />
          <input type="hidden" name="auxIcon[]" :value="row.icon" />
        </span>
      </div>
    </div>
  </section>
</template>
