<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import '../styles/admin.css'
import { backendWebSocketUrl } from '@/lib/wsUrl'
import type {
  AuxUiRow,
  ChannelFieldsetData,
  ChannelRowData,
  ExternalModel,
} from '@/admin/types'
import AdminAuxEditorSection from '@/components/admin/AdminAuxEditorSection.vue'
import AdminChannelsSection from '@/components/admin/AdminChannelsSection.vue'
import AdminExternalDevicesSection from '@/components/admin/AdminExternalDevicesSection.vue'
import AdminIconPickerDialog from '@/components/admin/AdminIconPickerDialog.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Info } from 'lucide-vue-next'
import './entry.css'

const TAB_VALUES = [
  'osc-web-mixer',
  'mixing-desk',
  'aux',
  'channels',
  'additional-devices',
] as const
type TabValue = (typeof TAB_VALUES)[number]

const SUGGESTED_GROUPS = [
  'Vocals',
  'Drums',
  'Guitars',
  'Keys',
  'MDs and misc',
  'Bass',
  'Tracks + cues',
  'MCs',
  'media',
  'acou 1',
]

const GROUP_KEYWORDS: RegExp[][] = [
  [/vocal|vox|mic|singer|backing/i],
  [/drum|kick|snare|hi-?hat|cymbal|percussion|tom|overhead/i],
  [/guitar|electric|gtr/i],
  [/key|piano|synth|organ|keys/i],
  [/\bmd\b|conductor|misc|other/i],
  [/\bbass\b/i],
  [/track|trax|cue|click|playback|multitrack/i],
  [/\bmc\b|mc'?s|mcs/i],
  [/media/i],
  [/acc?oustic|acou/i],
]

interface ChannelPayload {
  enabled: boolean
  name: string
  order: number
  title?: string
  icon?: string
  group?: number
  groupLabel?: string
}

interface ChannelsJson {
  channels: ChannelPayload[]
  groups: { label?: string }[]
}

interface ExternalPayload {
  broadcast: boolean
  name: string
  ip: string
  loopback: boolean
  port: number | string
}

interface ConfigJson {
  debug: boolean
  server: { ip: string; port: number | string }
  osc: { port: number | string }
  desk: { ip: string; port: number | string }
  external: ExternalPayload[]
}

interface AuxPayload {
  enabled: boolean
  name: string
  colour: string
  icon: string
}

type IconTarget =
  | { kind: 'aux'; index: number }
  | { kind: 'channel'; row: ChannelRowData }

const disconnected = ref(true)

const tabValue = ref<TabValue>('osc-web-mixer')
const iconPickerRef = ref<InstanceType<typeof AdminIconPickerDialog> | null>(
  null,
)

const WEBSOCKET_MS = 2000

const form = reactive({
  ip_address: '',
  server_port: '' as string | number,
  osc_port: '' as string | number,
  desk_send_port: '' as string | number,
  desk_ip: '',
  desk_port: '' as string | number,
  debug: false,
})

const externals = ref<ExternalModel[]>([])
const auxRows = ref<AuxUiRow[]>([])
const channelFieldsets = ref<ChannelFieldsetData[]>([])
const groupsArray = ref<{ label: string }[]>([])
const collapsedFieldsetIndices = ref<Set<number>>(new Set())

const iconTarget = ref<IconTarget | null>(null)

let ws: WebSocket | null = null
let wsTimer: ReturnType<typeof setTimeout> | null = null

const configFormRef = ref<HTMLFormElement | null>(null)

function isIpAddress(ip: string): boolean {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6 = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  return ipv4.test(ip) || ipv6.test(ip)
}

function ipAddressCheck(ev: Event) {
  const t = ev.target as HTMLInputElement
  if (isIpAddress(t.value)) t.setCustomValidity('')
  else t.setCustomValidity('Please enter a valid IP address')
}

function parseTabHash(): TabValue {
  const h = location.hash.replace(/^#/, '') || 'osc-web-mixer'
  return (TAB_VALUES as readonly string[]).includes(h) ? (h as TabValue) : 'osc-web-mixer'
}

function syncTabFromLocation() {
  tabValue.value = parseTabHash()
}

function onSubmit(e: Event) {
  if (configFormRef.value && !configFormRef.value.checkValidity()) {
    e.preventDefault()
  }
}

function addExternal() {
  externals.value.push({
    broadcast: true,
    name: '',
    ip: '',
    loopback: false,
    receivePort: 9000,
  })
}

function removeExternal(idx: number) {
  externals.value.splice(idx, 1)
}

function openAuxIcon(i: number) {
  iconTarget.value = { kind: 'aux', index: i }
  iconPickerRef.value?.showModal()
}

function openChannelIcon(row: ChannelRowData) {
  iconTarget.value = { kind: 'channel', row }
  iconPickerRef.value?.showModal()
}

function onIconDialogClose(src: string | undefined) {
  const targ = iconTarget.value
  if (src !== undefined && targ) {
    if (targ.kind === 'aux') {
      const row = auxRows.value[targ.index]
      if (row) row.icon = src
    } else if (targ.kind === 'channel') {
      targ.row.icon = src
    }
  }
  iconTarget.value = null
}

function rebuildChannels(payload: ChannelsJson) {
  const channelList = payload.channels ?? []
  const groupsData = payload.groups ?? []

  if (!channelList.length) {
    channelFieldsets.value = []
    collapsedFieldsetIndices.value = new Set()
    setTimeout(fetchChannels, 5000)
    return
  }

  groupsArray.value = groupsData.length
    ? groupsData.map((g) => ({ label: g.label || '' }))
    : []

  const sortedChannels = [...channelList].sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  )
  const groupOrder: (number | '')[] = []
  const map = new Map<number | '', ChannelPayload[]>()

  for (const ch of sortedChannels) {
    const keyNum =
      typeof ch.group === 'number' ||
      (typeof ch.group === 'string' && ch.group !== '')
        ? Number(ch.group)
        : ''
    if (!map.has(keyNum)) {
      groupOrder.push(keyNum)
      map.set(keyNum, [])
    }
    map.get(keyNum)!.push(ch)
  }

  const sections: ChannelFieldsetData[] = []
  const groupsArr = groupsArray.value

  for (const groupKey of groupOrder) {
    const list = map.get(groupKey)!
    const legendLabel =
      groupKey !== '' && groupsArr[groupKey as number]
        ? groupsArr[groupKey as number].label || `Group ${Number(groupKey) + 1}`
        : 'Channels'
    const rows: ChannelRowData[] = []
    for (const ch of list) {
      const listIndexPlusOne = channelList.indexOf(ch) + 1
      const channelIndex0 = listIndexPlusOne - 1
      const gIdx =
        typeof ch.group === 'number'
          ? String(ch.group)
          : ch.group !== undefined && ch.group !== ''
            ? String(ch.group)
            : ''
      rows.push({
        channelIndex0,
        listIndexPlusOne,
        order: ch.order,
        enabled: ch.enabled,
        name: ch.name,
        title: ch.title || '',
        icon: ch.icon || '',
        groupIndex: gIdx,
        groupBadge: ch.groupLabel || '',
      })
    }
    sections.push({ legend: legendLabel, rows })
  }

  channelFieldsets.value = sections
  collapsedFieldsetIndices.value = new Set()
  nextTick(() => ensureValidOrder())
}

function getFlatRows(): ChannelRowData[] {
  return channelFieldsets.value.flatMap((f) => f.rows)
}

function ensureValidOrder() {
  const rows = getFlatRows()
  const toSort = rows.map((r) => ({ r, order: r.order }))
  toSort.sort((a, b) => (a.order > b.order ? 1 : -1))
  for (const [i, { r }] of toSort.entries()) {
    r.order = i + 1
  }
}

function moveUp(row: ChannelRowData, e: Event) {
  e.preventDefault()
  const rows = [...getFlatRows()].sort((a, b) => a.order - b.order)
  const currentOrder = row.order
  if (currentOrder === 1) return
  for (const ch of rows) {
    if (ch.order === currentOrder - 1) {
      ch.order = currentOrder
      break
    }
  }
  row.order = currentOrder - 1
  ensureValidOrder()
}

function moveDown(row: ChannelRowData, e: Event) {
  e.preventDefault()
  const rows = [...getFlatRows()].sort((a, b) => a.order - b.order)
  const currentOrder = row.order
  if (currentOrder === rows.length) return
  for (const ch of rows) {
    if (ch.order === currentOrder + 1) {
      ch.order = currentOrder
      break
    }
  }
  row.order = currentOrder + 1
  ensureValidOrder()
}

function channelDragStart(row: ChannelRowData, e: DragEvent) {
  e.dataTransfer?.setData('text/plain', String(row.channelIndex0))
  ;(e.currentTarget as HTMLElement).classList.add('dragging')
}

function channelDragEnd(e: DragEvent) {
  ;(e.currentTarget as HTMLElement).classList.remove('dragging')
}

function applyDropToGroup(e: DragEvent, groupIdx: number) {
  e.preventDefault()
  ;(e.currentTarget as HTMLElement).classList.remove('drag-over')
  const channelIndex = e.dataTransfer?.getData('text/plain')
  if (channelIndex === undefined || channelIndex === '') return
  const row = getFlatRows().find(
    (r) => String(r.channelIndex0) === channelIndex,
  )
  if (!row) return
  row.groupIndex = String(groupIdx)
  const gl = groupsArray.value[groupIdx]?.label
  row.groupBadge = gl && gl.trim() !== '' ? gl : `Group ${groupIdx + 1}`
}

function applyUngroup(e: DragEvent) {
  e.preventDefault()
  ;(e.currentTarget as HTMLElement).classList.remove('drag-over')
  const channelIndex = e.dataTransfer?.getData('text/plain')
  if (channelIndex === undefined || channelIndex === '') return
  const row = getFlatRows().find(
    (r) => String(r.channelIndex0) === channelIndex,
  )
  if (!row) return
  row.groupIndex = ''
  row.groupBadge = ''
}

function addGroupRow() {
  groupsArray.value.push({ label: '' })
}

function suggestGroupsRun() {
  groupsArray.value = SUGGESTED_GROUPS.map((label) => ({ label }))
  for (const row of getFlatRows()) {
    const name = (row.name || '').trim()
    let gi = ''
    for (let i = 0; i < GROUP_KEYWORDS.length; i++) {
      if (GROUP_KEYWORDS[i].some((re) => re.test(name))) {
        gi = String(i)
        break
      }
    }
    row.groupIndex = gi
    row.groupBadge =
      gi !== '' ? groupsArray.value[parseInt(gi, 10)]?.label || '' : ''
  }
}

function removeGroupIdx(idx: number) {
  for (const row of getFlatRows()) {
    const v = parseInt(row.groupIndex, 10)
    if (row.groupIndex === String(idx)) {
      row.groupIndex = ''
      row.groupBadge = ''
    } else if (!Number.isNaN(v) && v > idx) {
      row.groupIndex = String(v - 1)
      row.groupBadge = groupsArray.value[v]?.label || ''
    }
  }
  groupsArray.value.splice(idx, 1)
}

function toggleAdminFieldset(fi: number) {
  const s = new Set(collapsedFieldsetIndices.value)
  if (s.has(fi)) s.delete(fi)
  else s.add(fi)
  collapsedFieldsetIndices.value = s
}

function onAdminFieldsetLegendClick(ev: MouseEvent, fi: number) {
  if ((ev.target as HTMLElement).closest('button.channel-group-toggle'))
    return
  toggleAdminFieldset(fi)
}

async function loadConfig() {
  const response = await fetch('/config')
  const json = (await response.json()) as ConfigJson
  let deskPort: number | string = json.desk.port !== '' ? json.desk.port : 9000
  form.ip_address = json.server.ip
  form.server_port = json.server.port
  form.osc_port = json.osc.port
  form.desk_send_port = json.osc.port
  form.desk_ip =
    json.desk.ip === ''
      ? String(json.server.ip).replace(/\.\d+$/, '') + '.'
      : json.desk.ip
  form.desk_port = deskPort
  form.debug = json.debug === true
  externals.value = json.external.map((ex) => ({
    broadcast: ex.broadcast,
    name: ex.name,
    ip: ex.ip,
    loopback: ex.loopback,
    receivePort: ex.port === '' ? 9000 : ex.port,
  }))
}

async function fetchAux() {
  const response = await fetch('/aux')
  const json = (await response.json()) as AuxPayload[]
  if (!json.length) {
    auxRows.value = []
    setTimeout(fetchAux, 5000)
    return
  }
  auxRows.value = json.map((a) => ({
    enabled: a.enabled,
    name: a.name,
    colour: a.colour,
    icon: a.icon,
  }))
}

async function fetchChannels() {
  const response = await fetch('/channels')
  const json = (await response.json()) as ChannelsJson
  rebuildChannels(json)
}

function wsMessage(ev: MessageEvent) {
  const json = JSON.parse(String(ev.data)) as {
    address?: string
    args?: unknown[]
  }
  if (!json.address) return

  const chMatch = json.address.match(
    /^\/Input_Channels\/([0-9]+)\/Channel_Input\/name$/,
  )
  if (chMatch && json.args?.[0] != null) {
    const idx = Number(chMatch[1]) - 1
    const row = getFlatRows().find((r) => r.channelIndex0 === idx)
    if (row) row.name = String(json.args[0])
    return
  }

  const auxMatch = json.address.match(
    /^\/Aux_Outputs\/([0-9]+)\/Buss_Trim\/name$/,
  )
  if (auxMatch && json.args?.[0] != null) {
    const ix = Number(auxMatch[1]) - 1
    const row = auxRows.value[ix]
    if (row) row.name = String(json.args[0])
  }
}

function noConnection() {
  disconnected.value = true
  if (wsTimer) clearTimeout(wsTimer)
  wsTimer = setTimeout(startWebsocket, WEBSOCKET_MS)
}

function startWebsocket() {
  if (ws) {
    ws.close()
    ws = null
  }
  ws = new WebSocket(backendWebSocketUrl())
  ws.onopen = () => {
    disconnected.value = false
    if (wsTimer) {
      clearTimeout(wsTimer)
      wsTimer = null
    }
    void loadConfig()
    void fetchAux()
    void fetchChannels()
  }
  ws.onmessage = wsMessage
  ws.onclose = noConnection
  ws.onerror = noConnection
  if (wsTimer) clearTimeout(wsTimer)
  wsTimer = setTimeout(startWebsocket, WEBSOCKET_MS)
}

watch(disconnected, (d) => {
  document.body.classList.toggle('disconnected', d)
}, { immediate: true })

watch(tabValue, (v) => {
  const desired = '#' + v
  if (location.hash !== desired) {
    history.replaceState(null, '', desired)
  }
})

onMounted(() => {
  syncTabFromLocation()
  window.addEventListener('hashchange', syncTabFromLocation)
  startWebsocket()
})

onUnmounted(() => {
  window.removeEventListener('hashchange', syncTabFromLocation)
  if (wsTimer) clearTimeout(wsTimer)
  if (ws) ws.close()
  document.body.classList.remove('disconnected')
})

function num(v: unknown) {
  const n =
    typeof v === 'number' ? v : v === '' || v === undefined ? NaN : Number(v)
  return Number.isFinite(n) ? n : NaN
}
</script>

<template>
  <TooltipProvider>
    <div
      class="text-foreground mx-auto flex min-h-svh max-w-3xl flex-col gap-6 px-4 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] pb-[calc(env(safe-area-inset-bottom,0px)+5rem)]"
    >
      <form
        id="configForm"
        ref="configFormRef"
        class="flex min-h-0 flex-1 flex-col gap-6"
        method="post"
        action="/admin"
        @submit="onSubmit"
      >
        <Tabs v-model="tabValue" class="gap-4">
          <TabsList
            class="bg-muted text-muted-foreground w-full flex-wrap justify-start overflow-x-auto"
          >
            <TabsTrigger value="osc-web-mixer">OSC Web Mixer</TabsTrigger>
            <TabsTrigger value="mixing-desk">
              <span class="inline-flex items-center gap-2">
                Mixing Desk
                <span class="status" aria-hidden="true" />
              </span>
            </TabsTrigger>
            <TabsTrigger value="aux" class="admin-tab-when-connected">
              Auxiliaries
            </TabsTrigger>
            <TabsTrigger value="channels" class="admin-tab-when-connected">
              Channels
            </TabsTrigger>
            <TabsTrigger
              value="additional-devices"
              class="admin-tab-when-connected"
            >
              Additional Devices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="osc-web-mixer" class="space-y-4">
            <div class="space-y-2">
              <Label for="ip_address">IP Address</Label>
              <Input
                id="ip_address"
                v-model="form.ip_address"
                disabled
                name="ip_address"
              />
            </div>
            <div class="space-y-2">
              <Label for="server_port">Webserver Port</Label>
              <Input
                id="server_port"
                :model-value="String(form.server_port)"
                type="number"
                name="server_port"
                required
                min="0"
                max="65353"
                @update:model-value="
                  (v) => {
                    const n = num(v)
                    form.server_port = Number.isNaN(n) ? '' : n
                  }
                "
              />
            </div>
            <div class="space-y-2">
              <Label for="osc_port">OSC Receive Port</Label>
              <Input
                id="osc_port"
                :model-value="String(form.osc_port)"
                type="number"
                name="osc_port"
                min="0"
                max="65353"
                @update:model-value="
                  (v) => {
                    const n = num(v)
                    form.osc_port = Number.isNaN(n) ? '' : n
                  }
                "
              />
            </div>
            <div class="flex items-center gap-2">
              <input
                id="debug"
                v-model="form.debug"
                class="border-input size-4 shrink-0 rounded border"
                type="checkbox"
                name="debug"
                value="debug"
              />
              <Label for="debug" class="cursor-pointer font-normal">
                Show Messages in Console
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="mixing-desk" class="space-y-4">
            <Alert
              class="border-amber-400/60 bg-amber-100/80 text-amber-950 border"
            >
              <Info class="size-4" />
              <AlertDescription>
                Goto <strong>Setup</strong> &gt;
                <strong>External Control</strong> and add a device with the below
                settings. Make sure you select
                <strong>DiGiCo iPad</strong> for the type of connection.
              </AlertDescription>
            </Alert>
            <div class="space-y-2">
              <Label for="desk_ip">IP Address</Label>
              <Input
                id="desk_ip"
                v-model="form.desk_ip"
                type="text"
                name="desk_ip"
                required
                @input="ipAddressCheck"
              />
            </div>
            <div class="space-y-2">
              <Label for="desk_send_port">Send Port</Label>
              <Input
                id="desk_send_port"
                :model-value="String(form.desk_send_port)"
                type="number"
                name="desk_send_port"
                disabled
              />
            </div>
            <div class="space-y-2">
              <Label for="desk_port">Receive Port</Label>
              <Input
                id="desk_port"
                :model-value="String(form.desk_port)"
                type="number"
                name="desk_port"
                required
                min="0"
                max="65353"
                @update:model-value="
                  (v) => {
                    const n = num(v)
                    form.desk_port = Number.isNaN(n) ? '' : n
                  }
                "
              />
            </div>
          </TabsContent>

          <TabsContent value="aux" class="mt-4">
            <AdminAuxEditorSection :aux-rows="auxRows" @open-icon="openAuxIcon" />
          </TabsContent>

          <TabsContent value="channels" class="mt-4">
            <AdminChannelsSection
              :channel-fieldsets="channelFieldsets"
              :groups-array="groupsArray"
              :collapsed-indices="collapsedFieldsetIndices"
              @toggle-fieldset="toggleAdminFieldset"
              @fieldset-legend-click="onAdminFieldsetLegendClick"
              @drag-start="channelDragStart"
              @drag-end="channelDragEnd"
              @drop-on-group="applyDropToGroup"
              @drop-ungroup="applyUngroup"
              @remove-group="removeGroupIdx"
              @add-group="addGroupRow"
              @suggest-groups="suggestGroupsRun"
              @move-up="moveUp"
              @move-down="moveDown"
              @open-channel-icon="openChannelIcon"
            />
          </TabsContent>

          <TabsContent value="additional-devices" class="mt-4">
            <AdminExternalDevicesSection
              :externals="externals"
              :server-ip="form.ip_address"
              :osc-port="form.osc_port"
              @ip-check="ipAddressCheck"
              @remove="removeExternal"
              @add="addExternal"
            />
          </TabsContent>
        </Tabs>

        <div
          class="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t px-4 py-4 backdrop-blur-sm"
          style="
            padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1.25rem);
          "
        >
          <Button type="submit" size="lg">Save</Button>
        </div>
      </form>

      <AdminIconPickerDialog
        ref="iconPickerRef"
        @close="onIconDialogClose"
      />
    </div>
  </TooltipProvider>
</template>
