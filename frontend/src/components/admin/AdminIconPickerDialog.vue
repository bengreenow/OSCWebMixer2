<script setup lang="ts">
import { ref, watch } from 'vue'
import { BLANK_ICON_SRC, ICON_DIALOG_SRCS } from '@/admin/iconDialogSvgs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const open = ref(false)
const emit = defineEmits<{
  /** Emitted after close; undefined if the click target was not an image. */
  close: [src: string | undefined]
}>()

/** Last selected icon src before closing; preserved when closing via X or overlay. */
const pendingSrc = ref<string | undefined>(undefined)

watch(open, (isOpen) => {
  if (!isOpen) {
    emit('close', pendingSrc.value)
    pendingSrc.value = undefined
  }
})

function onClick(e: MouseEvent) {
  let src: string | undefined
  const t = e.target as HTMLElement
  if ((t as HTMLImageElement).src && t.tagName === 'IMG') {
    const img = t as HTMLImageElement
    let s = img.src
    if (s.startsWith('data')) s = ''
    else s = img.src.substring(window.location.origin.length)
    src = s
  }
  pendingSrc.value = src
  open.value = false
}

defineExpose({
  showModal: () => {
    pendingSrc.value = undefined
    open.value = true
  },
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[26rem]">
      <DialogHeader class="sr-only">
        <DialogTitle>Choose icon</DialogTitle>
        <DialogDescription>
          Tap an icon to select it, or close to cancel.
        </DialogDescription>
      </DialogHeader>
      <div class="w-full min-w-0 pt-1" @click.prevent="onClick">
        <div
          id="iconDialog"
          class="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(54px,1fr))]"
        >
          <img :src="BLANK_ICON_SRC" width="44" height="44" alt="" />
          <img
            v-for="s in ICON_DIALOG_SRCS"
            :key="s"
            :src="s"
            width="44"
            height="44"
            alt=""
          />
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
