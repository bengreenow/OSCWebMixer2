import type { MixerAux, MixerChannel } from '@/mixer/types'

export interface OscMessage {
  address?: string
  args?: unknown[]
  config?: {
    snapshot: string
    channels: MixerChannel[]
    aux: MixerAux[]
  }
}
