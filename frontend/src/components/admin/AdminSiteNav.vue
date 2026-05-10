<script setup lang="ts">
const props = defineProps<{
  navHash: string
}>()

const emit = defineEmits<{
  navigate: [href: string, e?: Event]
}>()

function navClass(h: string) {
  return props.navHash === h ? 'selected' : ''
}
</script>

<template>
  <nav>
    <a
      href="#osc-web-mixer"
      :class="navClass('#osc-web-mixer')"
      @click="emit('navigate', '#osc-web-mixer', $event)"
      >OSC Web Mixer</a
    >
    <a
      href="#mixing-desk"
      :class="navClass('#mixing-desk')"
      @click="emit('navigate', '#mixing-desk', $event)"
      >Mixing Desk
      <div class="status"
    /></a>
    <a
      href="#aux"
      :class="navClass('#aux')"
      @click="emit('navigate', '#aux', $event)"
      >Auxiliaries</a
    >
    <a
      href="#channels"
      :class="navClass('#channels')"
      @click="emit('navigate', '#channels', $event)"
      >Channels</a
    >
    <a
      href="#additional-devices"
      :class="navClass('#additional-devices')"
      @click="emit('navigate', '#additional-devices', $event)"
      >Additional Devices</a
    >
  </nav>
</template>
