import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Upload,
  Download,
  Ruler,
  Image as ImageIcon,
  RefreshCw,
  Info,
  Trash2,
} from 'lucide-react'

type Unit = 'cm' | 'inch' | 'mm'
type FitMode = 'contain' | 'cover' | 'stretch'

const PRESET_DPI = [72, 96, 150, 300, 600]
const PRESET_SIZES: { label: string; w: number; h: number; unit: Unit }[] = [
  { label: 'A4', w: 21, h: 29.7, unit: 'cm' },
  { label: 'A5', w: 14.8, h: 21, unit: 'cm' },
  { label: 'A6', w: 10.5, h: 14.8, unit: 'cm' },
  { label: '名片', w: 9, h: 5.4, unit: 'cm' },
  { label: '4×6"', w: 4, h: 6, unit: 'inch' },
  { label: '5×7"', w: 5, h: 7, unit: 'inch' },
  { label: '正方形 10cm', w: 10, h: 10, unit: 'cm' },
]

function unitToInch(value: number, unit: Unit): number {
  if (unit === 'inch') return value
  if (unit === 'cm') return value / 2.54
  return value / 25.4 // mm
}

function inchToUnit(value: number, unit: Unit): number {
  if (unit === 'inch') return value
  if (unit === 'cm') return value * 2.54
  return value * 25.4
}

function formatNum(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(digits).replace(/\.?0+$/, '')
}

export default function DpiTool() {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [naturalW, setNaturalW] = useState(0)
  const [naturalH, setNaturalH] = useState(0)
  const [dpi, setDpi] = useState(300)
  const [unit, setUnit] = useState<Unit>('cm')
  const [printW, setPrintW] = useState(10)
  const [printH, setPrintH] = useState(10)
  const [lockAspect, setLockAspect] = useState(true)
  const [fitMode, setFitMode] = useState<FitMode>('contain')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [transparentBg, setTransparentBg] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const aspectRef = useRef(1)

  const targetPx = useMemo(() => {
    const wInch = unitToInch(printW, unit)
    const hInch = unitToInch(printH, unit)
    return {
      w: Math.max(1, Math.round(wInch * dpi)),
      h: Math.max(1, Math.round(hInch * dpi)),
    }
  }, [printW, printH, unit, dpi])

  const currentPrintSize = useMemo(() => {
    if (!naturalW || !dpi) return { w: 0, h: 0 }
    const wInch = naturalW / dpi
    const hInch = naturalH / dpi
    return {
      w: inchToUnit(wInch, unit),
      h: inchToUnit(hInch, unit),
    }
  }, [naturalW, naturalH, dpi, unit])

  const loadFile = useCallback((file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setSourceUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
      setSourceName(file.name)
      setNaturalW(img.naturalWidth)
      setNaturalH(img.naturalHeight)
      const aspect = img.naturalWidth / img.naturalHeight
      aspectRef.current = aspect
      // Default print size: keep width 10cm, height by aspect
      const defaultW = 10
      const defaultH = Number((defaultW / aspect).toFixed(2))
      setUnit('cm')
      setPrintW(defaultW)
      setPrintH(defaultH)
    }
    img.src = url
  }, [])

  const clearImage = useCallback(() => {
    setSourceUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setSourceName('')
    setNaturalW(0)
    setNaturalH(0)
  }, [])

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    }
  }, [sourceUrl])

  const onPrintWChange = (v: number) => {
    setPrintW(v)
    if (lockAspect && aspectRef.current > 0) {
      setPrintH(Number((v / aspectRef.current).toFixed(3)))
    }
  }

  const onPrintHChange = (v: number) => {
    setPrintH(v)
    if (lockAspect && aspectRef.current > 0) {
      setPrintW(Number((v * aspectRef.current).toFixed(3)))
    }
  }

  const applyPreset = (preset: (typeof PRESET_SIZES)[0]) => {
    setUnit(preset.unit)
    if (lockAspect && aspectRef.current > 0) {
      // Fit inside preset box keeping aspect
      const presetAspect = preset.w / preset.h
      if (aspectRef.current > presetAspect) {
        setPrintW(preset.w)
        setPrintH(Number((preset.w / aspectRef.current).toFixed(3)))
      } else {
        setPrintH(preset.h)
        setPrintW(Number((preset.h * aspectRef.current).toFixed(3)))
      }
    } else {
      setPrintW(preset.w)
      setPrintH(preset.h)
    }
  }

  const setDpiFromCurrentSize = () => {
    // Keep print size, adjust nothing — DPI already drives px
    // Convenience: set print size from natural px at current DPI
    if (!naturalW) return
    setPrintW(Number(currentPrintSize.w.toFixed(3)))
    setPrintH(Number(currentPrintSize.h.toFixed(3)))
  }

  const exportImage = useCallback(async () => {
    if (!sourceUrl) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = sourceUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = targetPx.w
    canvas.height = targetPx.h
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!transparentBg) {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    let dx = 0
    let dy = 0
    let dw = canvas.width
    let dh = canvas.height

    if (fitMode === 'stretch') {
      // use full canvas
    } else {
      const scale =
        fitMode === 'contain'
          ? Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight)
          : Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight)
      dw = img.naturalWidth * scale
      dh = img.naturalHeight * scale
      dx = (canvas.width - dw) / 2
      dy = (canvas.height - dh) / 2
    }

    ctx.drawImage(img, dx, dy, dw, dh)

    // Embed pHYs DPI chunk via PNG
    const mime = transparentBg ? 'image/png' : 'image/png'
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), mime, 1)
    )
    if (!blob) return

    const withDpi = await embedPngDpi(blob, dpi)
    const a = document.createElement('a')
    const base = sourceName.replace(/\.[^.]+$/, '') || 'image'
    a.download = `${base}_${targetPx.w}x${targetPx.h}_${dpi}dpi.png`
    a.href = URL.createObjectURL(withDpi)
    a.click()
    URL.revokeObjectURL(a.href)
  }, [sourceUrl, targetPx, transparentBg, bgColor, fitMode, dpi, sourceName])

  const unitLabel = unit === 'cm' ? 'cm' : unit === 'mm' ? 'mm' : 'in'

  return (
    <div className="flex-1 bg-slate-950 min-h-[calc(100vh-7.5rem)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <header className="mb-8">
          <p className="text-sm text-emerald-300 flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5" />
            Scout System · DPI Maker
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl mt-1">DPI / 列印尺寸工具</h1>
          <p className="mt-2 text-slate-300">
            設定目標 DPI 與實際列印尺寸，預覽像素輸出並匯出含 DPI 資訊的 PNG。
          </p>
          <p className="mt-1 text-xs text-slate-500">© 2026 Scout System. All rights reserved.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Controls */}
          <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 h-fit">
            <div>
              <label className="mb-2 block text-sm font-medium">1) 上傳圖片</label>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  loadFile(e.dataTransfer.files?.[0])
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border border-dashed p-6 text-center transition-colors ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'
                }`}
              >
                <Upload className="w-6 h-6 mx-auto text-slate-500 mb-2" />
                <p className="text-xs text-slate-400">拖放或點擊上傳</p>
                {sourceName && (
                  <p className="mt-2 text-[11px] text-emerald-300 truncate">{sourceName}</p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => loadFile(e.target.files?.[0])}
              />
              {sourceUrl && (
                <button
                  onClick={clearImage}
                  className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  清除圖片
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">2) 目標 DPI</label>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                  {dpi}
                </span>
              </div>
              <input
                type="range"
                min={36}
                max={600}
                step={1}
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRESET_DPI.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDpi(d)}
                    className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                      dpi === d
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={36}
                max={1200}
                value={dpi}
                onChange={(e) => setDpi(Math.max(1, Number(e.target.value) || 1))}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">3) 列印尺寸</label>
                <div className="flex gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-700">
                  {(['cm', 'mm', 'inch'] as Unit[]).map((u) => (
                    <button
                      key={u}
                      onClick={() => {
                        // convert values when switching unit
                        const wInch = unitToInch(printW, unit)
                        const hInch = unitToInch(printH, unit)
                        setUnit(u)
                        setPrintW(Number(inchToUnit(wInch, u).toFixed(3)))
                        setPrintH(Number(inchToUnit(hInch, u).toFixed(3)))
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        unit === u ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-slate-400">
                  寬 ({unitLabel})
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={printW}
                    onChange={(e) => onPrintWChange(Number(e.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  高 ({unitLabel})
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={printH}
                    onChange={(e) => onPrintHChange(Number(e.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </label>
              </div>

              <label className="flex items-center justify-between cursor-pointer group text-sm">
                <span className="text-slate-300 group-hover:text-white transition-colors">
                  鎖定長寬比
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={lockAspect}
                    onChange={(e) => setLockAspect(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-9 h-5 rounded-full transition-colors ${
                      lockAspect ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  />
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      lockAspect ? 'translate-x-4' : ''
                    }`}
                  />
                </div>
              </label>

              <div>
                <p className="text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider">
                  快速預設
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_SIZES.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p)}
                      className="px-2.5 py-1 rounded-md text-[11px] border border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-200 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {sourceUrl && (
                <button
                  onClick={setDpiFromCurrentSize}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-300 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  以原圖像素 + 目前 DPI 回填列印尺寸
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">4) 輸出適配</label>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {(
                  [
                    ['contain', '完整'],
                    ['cover', '裁切填滿'],
                    ['stretch', '拉伸'],
                  ] as [FitMode, string][]
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setFitMode(mode)}
                    className={`rounded-md border px-2 py-1.5 text-xs transition ${
                      fitMode === mode
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                        : 'border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="flex items-center justify-between rounded-lg border border-slate-700 p-2 text-sm">
                <span className="flex items-center gap-2">
                  背景色
                  <input
                    type="checkbox"
                    checked={transparentBg}
                    onChange={(e) => setTransparentBg(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span className="text-xs text-slate-500">透明</span>
                </span>
                <input
                  type="color"
                  value={bgColor}
                  disabled={transparentBg}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="disabled:opacity-40"
                />
              </label>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Info className="w-3.5 h-3.5" />
                輸出資訊
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">原圖像素</span>
                <span className="font-mono text-slate-300">
                  {naturalW || '—'} × {naturalH || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">目標像素</span>
                <span className="font-mono text-emerald-300">
                  {targetPx.w} × {targetPx.h}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">列印尺寸</span>
                <span className="font-mono text-slate-300">
                  {formatNum(printW)} × {formatNum(printH)} {unitLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DPI</span>
                <span className="font-mono text-slate-300">{dpi}</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={exportImage}
              disabled={!sourceUrl}
              className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              匯出 PNG（含 DPI）
            </motion.button>
          </section>

          {/* Preview */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              預覽
            </h2>
            <div
              className="flex min-h-[480px] items-center justify-center overflow-hidden rounded-xl border border-slate-700 relative"
              style={{
                backgroundImage: transparentBg
                  ? 'linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)'
                  : undefined,
                backgroundSize: transparentBg ? '20px 20px' : undefined,
                backgroundPosition: transparentBg
                  ? '0 0, 0 10px, 10px -10px, -10px 0'
                  : undefined,
                backgroundColor: transparentBg ? '#1e293b' : bgColor,
              }}
            >
              {sourceUrl ? (
                <div className="relative max-w-full max-h-[70vh] p-6 flex items-center justify-center">
                  {/* Paper frame proportional to print size */}
                  <div
                    className="relative shadow-2xl border border-black/10 overflow-hidden"
                    style={{
                      width: 'min(100%, 480px)',
                      aspectRatio: `${printW} / ${printH}`,
                      background: transparentBg ? 'transparent' : bgColor,
                    }}
                  >
                    <img
                      src={sourceUrl}
                      alt="preview"
                      className={`w-full h-full ${
                        fitMode === 'contain'
                          ? 'object-contain'
                          : fitMode === 'cover'
                            ? 'object-cover'
                            : 'object-fill'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                <p className="px-4 text-center text-slate-500">
                  請先上傳圖片，設定 DPI 與列印尺寸後即可預覽與匯出。
                </p>
              )}
            </div>
            {sourceUrl && (
              <p className="mt-3 text-center text-[11px] text-slate-500">
                預覽框比例 = 列印尺寸 · 實際輸出 {targetPx.w}×{targetPx.h}px @ {dpi} DPI
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

/** Embed pHYs chunk into a PNG blob so viewers respect DPI. */
async function embedPngDpi(pngBlob: Blob, dpi: number): Promise<Blob> {
  const buffer = await pngBlob.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // PNG signature
  const signature = [137, 80, 78, 71, 13, 10, 26, 10]
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== signature[i]) return pngBlob
  }

  // pixels per meter
  const ppm = Math.round(dpi / 0.0254)

  // Build pHYs chunk: length(4) + type(4) + data(9) + crc(4)
  const type = new TextEncoder().encode('pHYs')
  const data = new Uint8Array(9)
  const view = new DataView(data.buffer)
  view.setUint32(0, ppm) // X
  view.setUint32(4, ppm) // Y
  data[8] = 1 // unit = meter

  const crcInput = new Uint8Array(4 + 9)
  crcInput.set(type, 0)
  crcInput.set(data, 4)
  const crc = crc32(crcInput)

  const chunk = new Uint8Array(4 + 4 + 9 + 4)
  const chunkView = new DataView(chunk.buffer)
  chunkView.setUint32(0, 9) // length
  chunk.set(type, 4)
  chunk.set(data, 8)
  chunkView.setUint32(17, crc)

  // Insert after IHDR (signature 8 + IHDR 25 = 33)
  // Find IHDR end
  let offset = 8
  const ihdrLen = new DataView(bytes.buffer).getUint32(offset)
  const ihdrEnd = offset + 4 + 4 + ihdrLen + 4 // len + type + data + crc

  // Remove existing pHYs if present
  const parts: Uint8Array[] = [bytes.slice(0, ihdrEnd)]
  let cursor = ihdrEnd
  while (cursor < bytes.length) {
    const len = new DataView(bytes.buffer, bytes.byteOffset + cursor, 4).getUint32(0)
    const typeStr = String.fromCharCode(
      bytes[cursor + 4],
      bytes[cursor + 5],
      bytes[cursor + 6],
      bytes[cursor + 7]
    )
    const next = cursor + 4 + 4 + len + 4
    if (typeStr !== 'pHYs') {
      parts.push(bytes.slice(cursor, next))
    }
    cursor = next
  }

  // Insert pHYs right after IHDR
  const result = new Uint8Array(
    parts[0].length + chunk.length + parts.slice(1).reduce((s, p) => s + p.length, 0)
  )
  let pos = 0
  result.set(parts[0], pos)
  pos += parts[0].length
  result.set(chunk, pos)
  pos += chunk.length
  for (let i = 1; i < parts.length; i++) {
    result.set(parts[i], pos)
    pos += parts[i].length
  }
  return new Blob([result], { type: 'image/png' })
}

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
  }
  return (c ^ 0xffffffff) >>> 0
}
