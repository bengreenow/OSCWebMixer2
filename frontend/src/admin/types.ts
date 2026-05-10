export interface ChannelRowData {
  channelIndex0: number
  listIndexPlusOne: number
  order: number
  enabled: boolean
  name: string
  title: string
  icon: string
  groupIndex: string
  groupBadge: string
}

export interface ChannelFieldsetData {
  legend: string
  rows: ChannelRowData[]
}

export interface AuxUiRow {
  enabled: boolean
  name: string
  colour: string
  icon: string
}

export interface ExternalModel {
  broadcast: boolean
  name: string
  ip: string
  loopback: boolean
  receivePort: number | string
}
