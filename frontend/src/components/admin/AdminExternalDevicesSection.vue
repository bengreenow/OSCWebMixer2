<script setup lang="ts">
import type { ExternalModel } from '@/admin/types'

defineProps<{
  externals: ExternalModel[]
  serverIp: string
  oscPort: number | string
}>()

const emit = defineEmits<{
  ipCheck: [ev: Event]
  remove: [index: number]
  add: []
}>()
</script>

<template>
  <section id="additional-devices-content">
    <div id="external">
      <div v-for="(ex, i) in externals" :key="'ex-' + i" class="external">
        <div class="details">
          <label
            >Name
            <input v-model="ex.name" required type="text" name="externalName[]"
          /></label>
          <label
            >IP Address
            <input
              v-model="ex.ip"
              required
              type="text"
              name="externalIP[]"
              @input="emit('ipCheck', $event)"
          /></label>
          <label>
            <input
              :checked="ex.broadcast"
              type="checkbox"
              @change="
                (e) => {
                  ex.broadcast = (e.target as HTMLInputElement).checked
                }
              "
            />
            <input
              type="hidden"
              name="externalBroadcast[]"
              :value="ex.broadcast ? 'true' : 'false'"
            />
            Receive Broadcast Messages
          </label>
          <label>
            <input
              :checked="ex.loopback"
              type="checkbox"
              @change="
                (e) => {
                  ex.loopback = (e.target as HTMLInputElement).checked
                }
              "
            />
            <input
              type="hidden"
              name="externalLoopback[]"
              :value="ex.loopback ? 'true' : 'false'"
            />
            Receive Own Messages
            <span
              class="tooltip"
              title="By default Webmixer doesn't broadcast messages back to the source IP to prevent message loops. This disables the IP check. Be careful when turning this on."
              >i</span
            >
          </label>
          <div class="settings">
            <h2>Device Connection Settings</h2>
            <label
              >IP Address
              <input :value="serverIp" disabled type="text"
            /></label>
            <label
              >Send Port <input :value="oscPort" disabled type="number"
            /></label>
            <label
              >Receive Port<input
                v-model.number="ex.receivePort"
                required
                type="number"
                name="externalReceive[]"
                min="0"
                max="65353"
            /></label>
          </div>
        </div>
        <button
          type="button"
          class="delete"
          @click.prevent="emit('remove', i)"
        >
          &times;
        </button>
      </div>
    </div>
    <button id="addExternal" type="button" @click.prevent="emit('add')">
      +
    </button>
  </section>
</template>
