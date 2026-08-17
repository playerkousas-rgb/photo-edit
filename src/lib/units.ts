export type Unit = 'cm' | 'inch' | 'mm'

export function unitToInch(value: number, unit: Unit): number {
  if (unit === 'inch') return value
  if (unit === 'cm') return value / 2.54
  return value / 25.4
}

export function inchToUnit(value: number, unit: Unit): number {
  if (unit === 'inch') return value
  if (unit === 'cm') return value * 2.54
  return value * 25.4
}

export function formatNum(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '—'
  const s = n.toFixed(digits)
  return s.replace(/\.?0+$/, '')
}

export function unitLabel(unit: Unit): string {
  return unit === 'inch' ? 'in' : unit
}

/** Print quality heuristic based on effective DPI of source at target size. */
export type PrintQuality = 'excellent' | 'good' | 'fair' | 'poor'

export function assessPrintQuality(sourcePx: number, printInch: number): {
  quality: PrintQuality
  effectiveDpi: number
  label: string
  tip: string
  color: string
} {
  const effectiveDpi = printInch > 0 ? sourcePx / printInch : 0
  if (effectiveDpi >= 300) {
    return {
      quality: 'excellent',
      effectiveDpi,
      label: '優秀 · 專業印刷',
      tip: '≥300 DPI，適合相紙與專業輸出。',
      color: 'text-emerald-300',
    }
  }
  if (effectiveDpi >= 200) {
    return {
      quality: 'good',
      effectiveDpi,
      label: '良好 · 一般列印',
      tip: '200–300 DPI，家用／辦公室列印足夠。',
      color: 'text-cyan-300',
    }
  }
  if (effectiveDpi >= 150) {
    return {
      quality: 'fair',
      effectiveDpi,
      label: '尚可 · 遠距觀看',
      tip: '150–200 DPI，近看可能略糊，海報遠看 OK。',
      color: 'text-amber-300',
    }
  }
  return {
    quality: 'poor',
    effectiveDpi,
    label: '不足 · 建議縮小尺寸',
    tip: '<150 DPI，列印會明顯模糊。請縮小列印尺寸或使用更高解析原圖。',
    color: 'text-rose-300',
  }
}
