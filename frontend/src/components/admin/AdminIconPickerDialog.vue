<script setup lang="ts">
import { ref } from 'vue'
import { BLANK_ICON_SRC, ICON_DIALOG_SRCS } from '@/admin/iconDialogSvgs'

const dialogRef = ref<HTMLDialogElement | null>(null)

const emit = defineEmits<{
  /** Emitted after close; undefined if the click target was not an image. */
  close: [src: string | undefined]
}>()

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
  dialogRef.value?.close()
  emit('close', src)
}

defineExpose({
  showModal: () => dialogRef.value?.showModal(),
})
</script>

<template>
  <dialog id="iconDialog" ref="dialogRef" @click.prevent="onClick">
    <div>
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
  </dialog>
</template>
