import type { LucideIcon } from 'lucide-react'
import {
  Wand2,
  ImageMinus,
  QrCode,
  Ruler,
  Crop,
  ScanFace,
  Type,
  Frame,
  LayoutGrid,
} from 'lucide-react'

export type ToolId =
  | 'dpi'
  | 'mosaic'
  | 'background'
  | 'resize'
  | 'watermark'
  | 'bleed'
  | 'collage'
  | 'svg'
  | 'qrcode'

export interface ToolMeta {
  id: ToolId
  to: string
  label: string
  shortLabel: string
  en: string
  desc: string
  icon: LucideIcon
  accent: string
  featured?: boolean
  badge?: string
}

/** Nav order: DPI + privacy mosaic first for common scout workflows. */
export const TOOLS: ToolMeta[] = [
  {
    id: 'dpi',
    to: '/dpi',
    label: 'DPI 列印',
    shortLabel: 'DPI',
    en: 'Print DPI',
    desc: 'AI 圖轉列印：DPI、實際尺寸、品質診斷、pHYs PNG。',
    icon: Ruler,
    accent: 'from-emerald-500 to-teal-600',
    featured: true,
    badge: '常用',
  },
  {
    id: 'mosaic',
    to: '/mosaic',
    label: '馬賽克',
    shortLabel: '馬賽克',
    en: 'Face Mosaic',
    desc: '框選小朋友臉部打碼，保護私隱後再發佈。',
    icon: ScanFace,
    accent: 'from-sky-500 to-blue-600',
    badge: '私隱',
  },
  {
    id: 'background',
    to: '/background',
    label: '去背換底',
    shortLabel: '去背',
    en: 'Background',
    desc: '一鍵去背，透明／純色／漸層／背景圖。',
    icon: ImageMinus,
    accent: 'from-violet-500 to-purple-600',
  },
  {
    id: 'resize',
    to: '/resize',
    label: '裁切縮放',
    shortLabel: '裁切',
    en: 'Crop',
    desc: '比例裁切、旋轉翻轉、像素輸出。',
    icon: Crop,
    accent: 'from-amber-500 to-orange-600',
  },
  {
    id: 'watermark',
    to: '/watermark',
    label: '浮水印',
    shortLabel: '浮水印',
    en: 'Watermark',
    desc: '自訂文字版權浮水印，位置、透明度、重複鋪滿。',
    icon: Type,
    accent: 'from-fuchsia-500 to-pink-600',
  },
  {
    id: 'bleed',
    to: '/bleed',
    label: '邊框出血',
    shortLabel: '出血',
    en: 'Bleed & Border',
    desc: '印刷出血線、裁切標記、安全區與裝飾邊框。',
    icon: Frame,
    accent: 'from-lime-500 to-green-600',
  },
  {
    id: 'collage',
    to: '/collage',
    label: '拼圖九宮格',
    shortLabel: '拼圖',
    en: 'Collage Grid',
    desc: '2×2／3×3 九宮格等多圖拼版，活動相簿一鍵出圖。',
    icon: LayoutGrid,
    accent: 'from-orange-500 to-red-600',
  },
  {
    id: 'svg',
    to: '/svg',
    label: 'SVG 向量',
    shortLabel: 'SVG',
    en: 'SVG',
    desc: 'PNG → SVG 中心線／輪廓向量化。',
    icon: Wand2,
    accent: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'qrcode',
    to: '/qrcode',
    label: 'QR / 條碼',
    shortLabel: 'QR',
    en: 'QR Code',
    desc: '自訂 QR 與條碼，多模板匯出。',
    icon: QrCode,
    accent: 'from-rose-500 to-pink-600',
  },
]
