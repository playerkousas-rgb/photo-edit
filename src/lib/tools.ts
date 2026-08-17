import type { LucideIcon } from 'lucide-react'
import { Wand2, ImageMinus, QrCode, Ruler, Crop } from 'lucide-react'

export type ToolId = 'dpi' | 'background' | 'svg' | 'qrcode' | 'resize'

export interface ToolMeta {
  id: ToolId
  to: string
  label: string
  shortLabel: string
  en: string
  desc: string
  icon: LucideIcon
  accent: string // tailwind gradient
  featured?: boolean
  badge?: string
}

/** Nav order: DPI first (most-used print workflow). */
export const TOOLS: ToolMeta[] = [
  {
    id: 'dpi',
    to: '/dpi',
    label: 'DPI 列印',
    shortLabel: 'DPI',
    en: 'Print DPI Maker',
    desc: 'AI 圖轉列印核心：設定 DPI、實際尺寸，匯出含 pHYs 的印刷級 PNG。',
    icon: Ruler,
    accent: 'from-emerald-500 to-teal-600',
    featured: true,
    badge: '常用',
  },
  {
    id: 'background',
    to: '/background',
    label: '去背換底',
    shortLabel: '去背',
    en: 'Background',
    desc: '一鍵去背，套用透明、純色、漸層或背景圖後輸出 PNG。',
    icon: ImageMinus,
    accent: 'from-violet-500 to-purple-600',
  },
  {
    id: 'resize',
    to: '/resize',
    label: '裁切縮放',
    shortLabel: '裁切',
    en: 'Crop & Resize',
    desc: '依像素或比例裁切、縮放，快速準備社群與列印尺寸。',
    icon: Crop,
    accent: 'from-amber-500 to-orange-600',
  },
  {
    id: 'svg',
    to: '/svg',
    label: 'SVG 向量',
    shortLabel: 'SVG',
    en: 'SVG Converter',
    desc: 'PNG/JPEG → SVG，中心線與輪廓雙模式向量化。',
    icon: Wand2,
    accent: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'qrcode',
    to: '/qrcode',
    label: 'QR / 條碼',
    shortLabel: 'QR',
    en: 'CodeCraft',
    desc: '高度自訂 QR Code 與條碼，多模板，SVG/PNG 導出。',
    icon: QrCode,
    accent: 'from-rose-500 to-pink-600',
  },
]
