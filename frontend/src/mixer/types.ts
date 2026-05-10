export interface MixerAux {
  enabled: boolean
  label: string
  channel: number
  stereo: boolean
  colour: string
  icon: string
}

export interface MixerChannel {
  enabled: boolean
  label: string
  channel: number
  order: number
  title: string
  icon: string
  groupLabel: string
}
