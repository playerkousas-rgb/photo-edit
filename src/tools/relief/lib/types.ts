import type { LucideIcon } from 'lucide-react'
import { Image as ImageIcon, Sparkles, Stamp, Gem } from 'lucide-react'

/** All tunable parameters for the image → relief → mesh pipeline. */
export interface ReliefParams {
  // Geometry
  depth: number
  baseThickness: number
  width: number
  resolution: number
  edgeFade: number
  // Image processing
  brightness: number
  contrast: number
  gamma: number
  smoothing: number
  sharpen: number
  autoNormalize: boolean
  // Transforms
  invertDepth: boolean
  invertRelief: boolean
  mirrorX: boolean
  mirrorY: boolean
}

export const DEFAULT_RELIEF_PARAMS: ReliefParams = {
  depth: 3.0,
  baseThickness: 1.5,
  width: 80,
  resolution: 200,
  edgeFade: 4,
  brightness: 0,
  contrast: 0,
  gamma: 1.0,
  smoothing: 1,
  sharpen: 0,
  autoNormalize: true,
  invertDepth: false,
  invertRelief: false,
  mirrorX: false,
  mirrorY: false,
}

export interface ReliefPreset {
  id: string
  label: string
  description: string
  icon: LucideIcon
  params: ReliefParams
}

export const RELIEF_PRESETS: ReliefPreset[] = [
  {
    id: 'photo',
    label: '照片浮雕',
    description: '柔和細節',
    icon: ImageIcon,
    params: {
      ...DEFAULT_RELIEF_PARAMS,
      contrast: 25,
      gamma: 0.85,
      smoothing: 2,
      sharpen: 0.6,
      edgeFade: 4,
    },
  },
  {
    id: 'lineart',
    label: '線稿 / Logo',
    description: '邊緣清晰',
    icon: Sparkles,
    params: {
      ...DEFAULT_RELIEF_PARAMS,
      contrast: 75,
      gamma: 1.15,
      smoothing: 0,
      sharpen: 2.2,
      edgeFade: 2,
    },
  },
  {
    id: 'stamp',
    label: '印章凹雕',
    description: '鏡像模具',
    icon: Stamp,
    params: {
      ...DEFAULT_RELIEF_PARAMS,
      contrast: 60,
      gamma: 1,
      smoothing: 1,
      sharpen: 1.2,
      edgeFade: 3,
      invertDepth: true,
      invertRelief: true,
      mirrorX: true,
    },
  },
  {
    id: 'badge',
    label: '襟章 / 名牌',
    description: '薄板高對比',
    icon: Gem,
    params: {
      ...DEFAULT_RELIEF_PARAMS,
      depth: 1.6,
      baseThickness: 1.2,
      width: 50,
      contrast: 45,
      gamma: 1,
      smoothing: 1,
      sharpen: 1,
      edgeFade: 6,
    },
  },
]
