import { onUnmounted, watch, type Ref } from 'vue'

export function useMixerBodyUi(options: {
  disconnected: Ref<boolean>
  showAuxPicker: Ref<boolean>
  panning: Ref<boolean>
}) {
  watch(options.disconnected, (d) => {
    document.body.classList.toggle('disconnected', d)
  })

  watch(options.showAuxPicker, (pick) => {
    document.body.classList.toggle('auxPicker', pick)
  })

  watch(options.panning, (p) => {
    document.body.classList.toggle('panning', p)
  })

  onUnmounted(() => {
    document.body.classList.remove('disconnected', 'auxPicker', 'panning')
  })
}
