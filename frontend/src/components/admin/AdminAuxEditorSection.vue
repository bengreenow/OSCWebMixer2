<script setup lang="ts">
import { BLANK_ICON_SRC } from '@/admin/iconDialogSvgs'
import type { AuxUiRow } from '@/admin/types'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <div id="auxiliaries" class="flex flex-col gap-2">
      <template v-if="!auxRows.length">
        <p class="notice">No Auxiliaries Loaded</p>
      </template>
      <div
        v-for="(row, idx) in auxRows"
        :key="'aux-' + idx"
        class="flex flex-wrap items-center gap-2 md:flex-nowrap"
      >
        <Badge
          variant="secondary"
          class="font-mono shrink-0 rounded px-2 py-1 text-[0.8rem]"
        >
          {{ String(idx + 1).padStart(2, '0') }}
        </Badge>
        <div class="flex items-center gap-2">
          <Checkbox
            :checked="row.enabled"
            class="shrink-0"
            @update:checked="
              (v: boolean | 'indeterminate') => (row.enabled = v === true)
            "
          />
          <input
            type="hidden"
            name="auxEnabled[]"
            :value="row.enabled ? 'true' : 'false'"
          />
        </div>
        <div class="min-w-[120px] flex-1">
          <Label :for="'aux-name-' + idx" class="sr-only">Aux name</Label>
          <Input
            :id="'aux-name-' + idx"
            v-model="row.name"
            type="text"
            name="auxName[]"
          />
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <Label :for="'aux-colour-' + idx" class="sr-only">Colour</Label>
          <input
            :id="'aux-colour-' + idx"
            v-model="row.colour"
            class="border-input bg-background size-10 cursor-pointer rounded-md border"
            type="color"
            name="auxColour[]"
          />
        </div>
        <span class="shrink-0">
          <img
            :src="iconDisplay(row.icon)"
            class="icon border-input size-11 cursor-pointer rounded-md border object-contain p-1"
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
