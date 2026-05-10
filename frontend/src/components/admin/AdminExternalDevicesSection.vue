<script setup lang="ts">
import type { ExternalModel } from '@/admin/types'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
  <section id="additional-devices-content" class="flex flex-col gap-4">
    <div id="external" class="border-muted flex flex-col gap-4 rounded-xl border p-4 md:p-6">
      <Card
        v-for="(ex, i) in externals"
        :key="'ex-' + i"
        class="external border-muted relative gap-0 overflow-hidden border pb-4 shadow-none"
      >
        <CardHeader class="pb-2 pr-14">
          <div class="flex flex-col gap-6 md:flex-row md:flex-wrap md:gap-x-8 md:gap-y-4">
            <div class="details min-w-[200px] flex-1 space-y-5">
              <div class="space-y-2">
                <Label :for="'ext-name-' + i">Name</Label>
                <Input
                  :id="'ext-name-' + i"
                  v-model="ex.name"
                  required
                  type="text"
                  name="externalName[]"
                />
              </div>
              <div class="space-y-2">
                <Label :for="'ext-ip-' + i">IP Address</Label>
                <Input
                  :id="'ext-ip-' + i"
                  v-model="ex.ip"
                  required
                  type="text"
                  name="externalIP[]"
                  @input="emit('ipCheck', $event)"
                />
              </div>
              <div class="flex flex-col gap-5">
                <div class="flex items-start gap-2">
                  <Checkbox
                    :id="'ext-broadcast-' + i"
                    :checked="ex.broadcast"
                    class="mt-0.5 shrink-0"
                    @update:checked="
                      (v: boolean | 'indeterminate') =>
                        (ex.broadcast = v === true)
                    "
                  />
                  <input
                    type="hidden"
                    name="externalBroadcast[]"
                    :value="ex.broadcast ? 'true' : 'false'"
                  />
                  <Label
                    :for="'ext-broadcast-' + i"
                    class="cursor-pointer font-normal leading-snug"
                  >
                    Receive Broadcast Messages
                  </Label>
                </div>
                <div class="flex items-start gap-2">
                  <Checkbox
                    :id="'ext-loopback-' + i"
                    :checked="ex.loopback"
                    class="mt-0.5 shrink-0"
                    @update:checked="
                      (v: boolean | 'indeterminate') =>
                        (ex.loopback = v === true)
                    "
                  />
                  <input
                    type="hidden"
                    name="externalLoopback[]"
                    :value="ex.loopback ? 'true' : 'false'"
                  />
                  <div class="flex flex-wrap items-center gap-1.5">
                    <Label
                      :for="'ext-loopback-' + i"
                      class="cursor-pointer font-normal leading-snug"
                    >
                      Receive Own Messages
                    </Label>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button
                          type="button"
                          class="text-primary inline-flex size-5 items-center justify-center rounded-full border border-current text-xs font-serif"
                          aria-label="About receive own messages"
                        >
                          i
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" class="max-w-xs text-pretty">
                        By default Webmixer doesn&apos;t broadcast messages back
                        to the source IP to prevent message loops. This disables
                        the IP check. Be careful when turning this on.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
            <div class="settings border-muted grow space-y-5 rounded-lg border border-dotted p-6 md:min-w-[240px] md:flex-1">
              <h3 class="text-base font-semibold tracking-tight">
                Device Connection Settings
              </h3>
              <div class="space-y-2">
                <Label :for="'settings-ip-' + i">IP Address</Label>
                <Input
                  :id="'settings-ip-' + i"
                  :model-value="serverIp"
                  disabled
                  type="text"
                />
              </div>
              <div class="space-y-2">
                <Label :for="'settings-send-' + i">Send Port</Label>
                <Input
                  :id="'settings-send-' + i"
                  :model-value="String(oscPort)"
                  disabled
                  type="number"
                />
              </div>
              <div class="space-y-2">
                <Label :for="'ext-recv-' + i">Receive Port</Label>
                <Input
                  :id="'ext-recv-' + i"
                  :model-value="String(ex.receivePort)"
                  required
                  type="number"
                  name="externalReceive[]"
                  min="0"
                  max="65353"
                  @update:model-value="
                    (v) => {
                      const n =
                        typeof v === 'number'
                          ? v
                          : Number(String(v).replace(/\s/g, ''))
                      ex.receivePort = Number.isFinite(n) ? n : ex.receivePort
                    }
                  "
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          class="delete absolute top-2 right-2 size-10 rounded-full border-0"
          aria-label="Remove device"
          @click.prevent="emit('remove', i)"
        >
          ×
        </Button>
      </Card>
    </div>
    <Button
      id="addExternal"
      type="button"
      variant="outline"
      size="icon"
      class="size-14 rounded-xl text-xl"
      aria-label="Add external device"
      @click.prevent="emit('add')"
    >
      +
    </Button>
  </section>
</template>
