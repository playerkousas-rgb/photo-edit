import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  Ruler,
  Image as ImageIcon,
  RefreshCw,
  Info,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  FileImage,
  Zap,
  RotateCcw,
} from 'lucide-react'
import ToolShell from '../../components/ui/ToolShell'
import DropZone from '../../components/ui/DropZone'
import { embedPngDpi, readPngDpi, downloadBlob } from '../../lib/pngDpi'
import {
  type Unit,
  unitToInch,
  inchToUnit,
  formatNum,
  unitLabel,
  assessPrintQuality,
} from '../../lib/units'

type FitMode = 'contain' | 'cover' | 'stretch' | 'native'
type ExportFormat = 'png' | 'jpeg'
type WorkMode = 'size' | 'native'

interface BatchItem {
  id: string
  file: File
  url: string
  name: string
  w: number
  h: number
  sourceDpi: number | null
}

const PRESET_DPI = [72, 96, 150, 200, 300, 600]

const PRESET_SIZES: { label: string; w: number; h: number; unit: Unit; group: string }[] = [
  { label: 'A3', w: 29.7, h: 42, unit: 'cm', group: '紙張' },
  { label: 'A4', w: 21, h: 29.7, unit: 'cm', group: '紙張' },
  { label: 'A5', w: 14.8, h: 21, unit: 'cm', group: '紙張' },
  { label: 'A6', w: 10.5, h: 14.8, unit: 'cm', group: '紙張' },
  { label: '名片', w: 9, h: 5.4, unit: 'cm', group: '紙張' },
  { label: '4×6"', w: 4, h: 6, unit: 'inch', group: '相紙' },
  { label: '5×7"', w: 5, h: 7, unit: 'inch', group: '相紙' },
  { label: '8×10"', w: 8, h: 10, unit: 'inch', group: '相紙' },
  { label: '正方形 10cm', w: 10, h: 10, unit: 'cm', group: '常用' },
  { label: '徽章 5cm', w: 5, h: 5, unit: 'cm', group: '常用' },
  { label: '貼紙 7cm', w: 7, h: 7, unit: 'cm', group: '常用' },
  { label: '橫幅 30×10', w: 30, h: 10, unit: 'cm', group: '常用' },
]

const AI_QUICK: { label: string; tip: string; dpi: number; w: number; h: number; unit: Unit }[] = [
  { label: 'AI→A4 直式 300', tip: '最常用印刷', dpi: 300, w: 21, h: 29.7, unit: 'cm' },
  { label: 'AI→A4 橫式 300', tip: '簡報海報', dpi: 300, w: 29.7, h: 21, unit: 'cm' },
  { label: 'AI→相紙 4×6', tip: '沖洗店', dpi: 300, w: 4, h: 6, unit: 'inch' },
  { label: '只改 DPI 標籤', tip: '不重採樣', dpi: 300, w: 0, h: 0, unit: 'cm' },
]

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

async function loadImageMeta(file: File): Promise<Omit<BatchItem, 'id' | 'file'>> {
  const url = URL.createObjectURL(file)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })

  let sourceDpi: number | null = null
  if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
    try {
      const buf = new Uint8Array(await file.arrayBuffer())
      sourceDpi = readPngDpi(buf)
    } catch {
      sourceDpi = null
    }
  }

  return {
    url,
    name: file.name,
    w: img.naturalWidth,
    h: img.naturalHeight,
    sourceDpi,
  }
}

export default function DpiTool() {
  const [items, setItems] = useState<BatchItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dpi, setDpi] = useState(300)
  const [unit, setUnit] = useState<Unit>('cm')
  const [printW, setPrintW] = useState(21)
  const [printH, setPrintH] = useState(29.7)
  const [lockAspect, setLockAspect] = useState(true)
  const [fitMode, setFitMode] = useState<FitMode>('contain')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [transparentBg, setTransparentBg] = useState(false)
  const [workMode, setWorkMode] = useState<WorkMode>('size')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [jpegQuality, setJpegQuality] = useState(0.95)
  const [exporting, setExporting] = useState(false)
  const [exportMsg, setExportMsg] = useState<string | null>(null)
  const [upscaleWarnAck, setUpscaleWarnAck] = useState(false)
  const aspectRef = useRef(1)

  const selected = items.find((i) => i.id === selectedId) ?? items[0] ?? null

  useEffect(() => {
    if (selected) {
      aspectRef.current = selected.w / selected.h
    }
  }, [selected])

  const targetPx = useMemo(() => {
    if (workMode === 'native' && selected) {
      return { w: selected.w, h: selected.h }
    }
    const wInch = unitToInch(printW, unit)
    const hInch = unitToInch(printH, unit)
    return {
      w: Math.max(1, Math.round(wInch * dpi)),
      h: Math.max(1, Math.round(hInch * dpi)),
    }
  }, [workMode, selected, printW, printH, unit, dpi])

  const printSizeAtDpi = useMemo(() => {
    if (!selected) return { w: 0, h: 0 }
    return {
      w: inchToUnit(selected.w / dpi, unit),
      h: inchToUnit(selected.h / dpi, unit),
    }
  }, [selected, dpi, unit])

  const quality = useMemo(() => {
    if (!selected) return null
    if (workMode === 'native') {
      // quality of tagging native pixels at chosen dpi for the implied physical size
      return assessPrintQuality(selected.w, selected.w / dpi)
    }
    const wInch = unitToInch(printW, unit)
    return assessPrintQuality(selected.w, wInch)
  }, [selected, workMode, printW, unit, dpi])

  const isUpscaling = useMemo(() => {
    if (!selected || workMode === 'native') return false
    return targetPx.w > selected.w * 1.05 || targetPx.h > selected.h * 1.05
  }, [selected, targetPx, workMode])

  const megapixels = useMemo(() => (targetPx.w * targetPx.h) / 1e6, [targetPx])
  const tooLarge = megapixels > 100 || targetPx.w > 16000 || targetPx.h > 16000

  const addFiles = useCallback(async (files: File[]) => {
    const loaded: BatchItem[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      try {
        const meta = await loadImageMeta(file)
        loaded.push({ id: uid(), file, ...meta })
      } catch {
        /* skip bad file */
      }
    }
    if (!loaded.length) return
    setItems((prev) => [...prev, ...loaded])
    setSelectedId((id) => id ?? loaded[0].id)
    // Auto-fit first image aspect into current print box if lock
    const first = loaded[0]
    const aspect = first.w / first.h
    aspectRef.current = aspect
    setPrintW((pw) => {
      const ph = Number((pw / aspect).toFixed(3))
      setPrintH(ph)
      return pw
    })
    setUpscaleWarnAck(false)
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) URL.revokeObjectURL(item.url)
      const next = prev.filter((i) => i.id !== id)
      setSelectedId((cur) => {
        if (cur !== id) return cur
        return next[0]?.id ?? null
      })
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setItems((prev) => {
      prev.forEach((i) => URL.revokeObjectURL(i.url))
      return []
    })
    setSelectedId(null)
  }, [])

  useEffect(() => {
    return () => {
      items.forEach((i) => URL.revokeObjectURL(i.url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onPrintWChange = (v: number) => {
    setPrintW(v)
    setUpscaleWarnAck(false)
    if (lockAspect && aspectRef.current > 0) {
      setPrintH(Number((v / aspectRef.current).toFixed(3)))
    }
  }

  const onPrintHChange = (v: number) => {
    setPrintH(v)
    setUpscaleWarnAck(false)
    if (lockAspect && aspectRef.current > 0) {
      setPrintW(Number((v * aspectRef.current).toFixed(3)))
    }
  }

  const applyPreset = (preset: (typeof PRESET_SIZES)[0]) => {
    setWorkMode('size')
    setUnit(preset.unit)
    setUpscaleWarnAck(false)
    if (lockAspect && aspectRef.current > 0) {
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

  const applyAiQuick = (q: (typeof AI_QUICK)[0]) => {
    setDpi(q.dpi)
    setUpscaleWarnAck(false)
    if (q.w === 0) {
      // metadata-only mode
      setWorkMode('native')
      setFitMode('native')
      return
    }
    setWorkMode('size')
    setUnit(q.unit)
    if (selected && lockAspect) {
      const aspect = selected.w / selected.h
      const presetAspect = q.w / q.h
      if (aspect > presetAspect) {
        setPrintW(q.w)
        setPrintH(Number((q.w / aspect).toFixed(3)))
      } else {
        setPrintH(q.h)
        setPrintW(Number((q.h * aspect).toFixed(3)))
      }
    } else {
      setPrintW(q.w)
      setPrintH(q.h)
    }
  }

  const fitPrintToNative = () => {
    if (!selected) return
    setWorkMode('size')
    setPrintW(Number(printSizeAtDpi.w.toFixed(3)))
    setPrintH(Number(printSizeAtDpi.h.toFixed(3)))
    setUpscaleWarnAck(false)
  }

  const swapWH = () => {
    setPrintW(printH)
    setPrintH(printW)
    aspectRef.current = 1 / (aspectRef.current || 1)
  }

  const renderToCanvas = useCallback(
    async (item: BatchItem): Promise<HTMLCanvasElement> => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = item.url
      })

      const canvas = document.createElement('canvas')
      let tw = targetPx.w
      let th = targetPx.h

      if (workMode === 'native') {
        tw = item.w
        th = item.h
      }

      canvas.width = tw
      canvas.height = th
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no ctx')

      // High-quality resampling
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      if (!transparentBg || exportFormat === 'jpeg') {
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, tw, th)
      }

      if (workMode === 'native' || fitMode === 'native') {
        ctx.drawImage(img, 0, 0, tw, th)
        return canvas
      }

      let dx = 0
      let dy = 0
      let dw = tw
      let dh = th

      if (fitMode === 'stretch') {
        // full canvas
      } else {
        const scale =
          fitMode === 'contain'
            ? Math.min(tw / img.naturalWidth, th / img.naturalHeight)
            : Math.max(tw / img.naturalWidth, th / img.naturalHeight)
        dw = img.naturalWidth * scale
        dh = img.naturalHeight * scale
        dx = (tw - dw) / 2
        dy = (th - dh) / 2
      }

      ctx.drawImage(img, dx, dy, dw, dh)
      return canvas
    },
    [targetPx, workMode, transparentBg, exportFormat, bgColor, fitMode]
  )

  const canvasToBlob = useCallback(
    async (canvas: HTMLCanvasElement): Promise<Blob> => {
      if (exportFormat === 'jpeg') {
        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/jpeg', jpegQuality)
        )
        if (!blob) throw new Error('jpeg fail')
        return blob
      }
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      )
      if (!blob) throw new Error('png fail')
      return embedPngDpi(blob, dpi)
    },
    [exportFormat, jpegQuality, dpi]
  )

  const exportOne = useCallback(
    async (item: BatchItem) => {
      const canvas = await renderToCanvas(item)
      const blob = await canvasToBlob(canvas)
      const base = item.name.replace(/\.[^.]+$/, '') || 'image'
      const ext = exportFormat === 'jpeg' ? 'jpg' : 'png'
      const tw = workMode === 'native' ? item.w : targetPx.w
      const th = workMode === 'native' ? item.h : targetPx.h
      downloadBlob(blob, `${base}_${tw}x${th}_${dpi}dpi.${ext}`)
    },
    [renderToCanvas, canvasToBlob, exportFormat, workMode, targetPx, dpi]
  )

  const handleExport = async (all = false) => {
    if (!items.length) return
    if (isUpscaling && !upscaleWarnAck) {
      setExportMsg('偵測到放大輸出，請先確認品質警示後再匯出。')
      return
    }
    if (tooLarge) {
      setExportMsg('目標像素過大（>100MP 或單邊 >16000），請降低 DPI 或尺寸。')
      return
    }
    setExporting(true)
    setExportMsg(null)
    try {
      const list = all ? items : selected ? [selected] : []
      for (const item of list) {
        await exportOne(item)
        // small gap so browsers don't block multi-download
        if (list.length > 1) await new Promise((r) => setTimeout(r, 250))
      }
      setExportMsg(
        all
          ? `已匯出 ${list.length} 張 · ${dpi} DPI · ${exportFormat.toUpperCase()}`
          : `已匯出 · ${dpi} DPI · ${exportFormat.toUpperCase()}`
      )
    } catch (e) {
      setExportMsg(e instanceof Error ? e.message : '匯出失敗')
    } finally {
      setExporting(false)
    }
  }

  const uLabel = unitLabel(unit)

  return (
    <ToolShell
      icon={Ruler}
      title="DPI / 列印尺寸"
      subtitle="AI 圖 → 印刷級輸出 · Scout System"
      accentClass="from-emerald-500 to-teal-600"
      actions={
        <div className="flex items-center gap-2">
          {items.length > 1 && (
            <button
              onClick={() => handleExport(true)}
              disabled={exporting || tooLarge}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40"
            >
              <Layers className="w-3.5 h-3.5" />
              批次匯出 ({items.length})
            </button>
          )}
          <button
            onClick={() => handleExport(false)}
            disabled={!selected || exporting || tooLarge}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-40 disabled:bg-slate-700 disabled:text-slate-400"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? '匯出中…' : '匯出'}
          </button>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[340px_1fr] xl:grid-cols-[360px_1fr_280px] h-full">
        {/* Left controls */}
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 h-fit lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto custom-scrollbar">
          {/* Upload */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-300 uppercase tracking-wider">
              圖片
            </label>
            <DropZone
              onFiles={addFiles}
              multiple
              label="拖放 AI 圖 / 點擊上傳"
              hint="支援 PNG · JPG · WebP · 可多選批次"
              compact
            />
            {items.length > 0 && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{items.length} 張</span>
                <button
                  onClick={clearAll}
                  className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  全部清除
                </button>
              </div>
            )}
            {items.length > 0 && (
              <div className="mt-2 flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      selected?.id === item.id
                        ? 'border-emerald-400 ring-2 ring-emerald-500/30'
                        : 'border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItem(item.id)
                      }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded bg-black/70 text-white text-[9px] flex items-center justify-center hover:bg-rose-600"
                    >
                      ×
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Quick */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-300 uppercase tracking-wider">
              <Zap className="w-3 h-3 text-emerald-400" />
              AI 圖快速預設
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {AI_QUICK.map((q) => (
                <button
                  key={q.label}
                  onClick={() => applyAiQuick(q)}
                  className="text-left px-2.5 py-2 rounded-lg border border-slate-700 hover:border-emerald-500/40 bg-slate-950/50 hover:bg-emerald-500/5 transition-colors"
                >
                  <div className="text-[11px] font-medium text-slate-200">{q.label}</div>
                  <div className="text-[10px] text-slate-500">{q.tip}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-300 uppercase tracking-wider">
              工作模式
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-0.5 rounded-lg bg-slate-950 border border-slate-700">
              <button
                onClick={() => {
                  setWorkMode('size')
                  if (fitMode === 'native') setFitMode('contain')
                }}
                className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                  workMode === 'size'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                依尺寸重採樣
              </button>
              <button
                onClick={() => {
                  setWorkMode('native')
                  setFitMode('native')
                }}
                className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                  workMode === 'native'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                只改 DPI 標籤
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500 leading-relaxed">
              {workMode === 'size'
                ? '依列印尺寸 × DPI 計算像素並重繪（適合指定實際 cm）。'
                : '保留原始像素，只寫入 DPI 元數據（Photoshop / 印刷店會讀取）。'}
            </p>
          </div>

          {/* DPI */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                目標 DPI
              </label>
              <input
                type="number"
                min={36}
                max={1200}
                value={dpi}
                onChange={(e) => {
                  setDpi(Math.max(1, Number(e.target.value) || 1))
                  setUpscaleWarnAck(false)
                }}
                className="w-20 text-right text-xs font-mono rounded-md border border-slate-700 bg-slate-950 px-2 py-1"
              />
            </div>
            <input
              type="range"
              min={36}
              max={600}
              step={1}
              value={Math.min(600, dpi)}
              onChange={(e) => {
                setDpi(Number(e.target.value))
                setUpscaleWarnAck(false)
              }}
              className="w-full accent-emerald-500"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {PRESET_DPI.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDpi(d)
                    setUpscaleWarnAck(false)
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                    dpi === d
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Print size */}
          {workMode === 'size' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  列印尺寸
                </label>
                <div className="flex gap-0.5 p-0.5 rounded-lg bg-slate-950 border border-slate-700">
                  {(['cm', 'mm', 'inch'] as Unit[]).map((u) => (
                    <button
                      key={u}
                      onClick={() => {
                        const wInch = unitToInch(printW, unit)
                        const hInch = unitToInch(printH, unit)
                        setUnit(u)
                        setPrintW(Number(inchToUnit(wInch, u).toFixed(3)))
                        setPrintH(Number(inchToUnit(hInch, u).toFixed(3)))
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        unit === u ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                <label className="text-[11px] text-slate-400">
                  寬 ({uLabel})
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={printW}
                    onChange={(e) => onPrintWChange(Number(e.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-white"
                  />
                </label>
                <button
                  onClick={swapWH}
                  title="交換寬高"
                  className="mb-1 p-1.5 rounded-md border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <label className="text-[11px] text-slate-400">
                  高 ({uLabel})
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={printH}
                    onChange={(e) => onPrintHChange(Number(e.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-white"
                  />
                </label>
              </div>

              <label className="flex items-center justify-between cursor-pointer text-sm">
                <span className="text-slate-300 text-xs">鎖定原圖長寬比</span>
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
                <p className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">
                  紙張 / 相紙預設
                </p>
                <div className="flex flex-wrap gap-1">
                  {PRESET_SIZES.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p)}
                      className="px-2 py-0.5 rounded text-[10px] border border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-200"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {selected && (
                <button
                  onClick={fitPrintToNative}
                  className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-emerald-300"
                >
                  <RefreshCw className="w-3 h-3" />
                  以原圖像素 @ {dpi} DPI 回填尺寸（
                  {formatNum(printSizeAtDpi.w)}×{formatNum(printSizeAtDpi.h)} {uLabel}）
                </button>
              )}
            </div>
          )}

          {/* Fit + bg */}
          {workMode === 'size' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                適配方式
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    ['contain', '完整'],
                    ['cover', '裁切'],
                    ['stretch', '拉伸'],
                  ] as [FitMode, string][]
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setFitMode(mode)}
                    className={`rounded-md border px-2 py-1.5 text-[11px] ${
                      fitMode === mode
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                        : 'border-slate-700 text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="flex items-center justify-between rounded-lg border border-slate-700 p-2 text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  背景
                  <input
                    type="checkbox"
                    checked={transparentBg}
                    onChange={(e) => setTransparentBg(e.target.checked)}
                    className="accent-emerald-500"
                    disabled={exportFormat === 'jpeg'}
                  />
                  <span className="text-slate-500">透明</span>
                </span>
                <input
                  type="color"
                  value={bgColor}
                  disabled={transparentBg && exportFormat === 'png'}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="disabled:opacity-40"
                />
              </label>
            </div>
          )}

          {/* Format */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-300 uppercase tracking-wider">
              匯出格式
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setExportFormat('png')}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs ${
                  exportFormat === 'png'
                    ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200'
                    : 'border-slate-700 text-slate-400'
                }`}
              >
                <FileImage className="w-3.5 h-3.5" />
                PNG + DPI
              </button>
              <button
                onClick={() => {
                  setExportFormat('jpeg')
                  setTransparentBg(false)
                }}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs ${
                  exportFormat === 'jpeg'
                    ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200'
                    : 'border-slate-700 text-slate-400'
                }`}
              >
                <FileImage className="w-3.5 h-3.5" />
                JPEG
              </button>
            </div>
            {exportFormat === 'png' && (
              <p className="mt-1.5 text-[10px] text-slate-500">
                PNG 會寫入 pHYs 區塊，Photoshop / Affinity / 多數印刷流程可讀取 DPI。
              </p>
            )}
            {exportFormat === 'jpeg' && (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>品質</span>
                  <span>{Math.round(jpegQuality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.01}
                  value={jpegQuality}
                  onChange={(e) => setJpegQuality(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <p className="text-[10px] text-amber-500/80 mt-1">
                  注意：JPEG 無法可靠嵌入 DPI，建議印刷用 PNG。
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => handleExport(false)}
            disabled={!selected || exporting || tooLarge}
            className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 font-semibold text-slate-950 text-sm hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? '匯出中…' : `匯出 ${exportFormat.toUpperCase()}（${dpi} DPI）`}
          </button>

          <AnimatePresence>
            {exportMsg && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[11px] text-center text-emerald-300/90"
              >
                {exportMsg}
              </motion.p>
            )}
          </AnimatePresence>
        </section>

        {/* Center preview */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col min-h-[420px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              預覽
            </h2>
            {selected && (
              <span className="text-[10px] font-mono text-slate-500 truncate max-w-[50%]">
                {selected.name}
              </span>
            )}
          </div>
          <div
            className="flex-1 flex items-center justify-center overflow-hidden rounded-xl border border-slate-700 min-h-[360px]"
            style={{
              backgroundImage:
                transparentBg && exportFormat === 'png'
                  ? 'linear-gradient(45deg,#334155 25%,transparent 25%),linear-gradient(-45deg,#334155 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#334155 75%),linear-gradient(-45deg,transparent 75%,#334155 75%)'
                  : undefined,
              backgroundSize:
                transparentBg && exportFormat === 'png' ? '16px 16px' : undefined,
              backgroundPosition:
                transparentBg && exportFormat === 'png'
                  ? '0 0,0 8px,8px -8px,-8px 0'
                  : undefined,
              backgroundColor:
                transparentBg && exportFormat === 'png' ? '#1e293b' : bgColor,
            }}
          >
            {selected ? (
              <div className="p-6 max-w-full max-h-full flex items-center justify-center">
                <div
                  className="relative shadow-2xl border border-black/10 overflow-hidden bg-white"
                  style={{
                    width: 'min(100%, 520px)',
                    aspectRatio:
                      workMode === 'native'
                        ? `${selected.w} / ${selected.h}`
                        : `${Math.max(printW, 0.01)} / ${Math.max(printH, 0.01)}`,
                    background:
                      transparentBg && exportFormat === 'png' ? 'transparent' : bgColor,
                  }}
                >
                  <img
                    src={selected.url}
                    alt="preview"
                    className={`w-full h-full ${
                      fitMode === 'contain' || workMode === 'native'
                        ? 'object-contain'
                        : fitMode === 'cover'
                          ? 'object-cover'
                          : 'object-fill'
                    }`}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center px-6">
                <Ruler className="w-10 h-10 mx-auto text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm">上傳 AI 生成圖開始</p>
                <p className="text-slate-600 text-xs mt-1">
                  建議流程：選「AI→A4 300」→ 看品質燈號 → 匯出 PNG
                </p>
              </div>
            )}
          </div>
          {selected && (
            <p className="mt-3 text-center text-[11px] text-slate-500">
              輸出 {targetPx.w}×{targetPx.h}px @ {dpi} DPI
              {workMode === 'size' && (
                <>
                  {' '}
                  · {formatNum(printW)}×{formatNum(printH)} {uLabel}
                </>
              )}
              {workMode === 'native' && <> · 原圖像素 + DPI 標籤</>}
            </p>
          )}
        </section>

        {/* Right info panel */}
        <aside className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 h-fit xl:block hidden">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            輸出診斷
          </h3>

          {selected ? (
            <>
              <div className="space-y-2 text-xs">
                <Row label="檔名" value={selected.name} mono />
                <Row label="原圖像素" value={`${selected.w} × ${selected.h}`} mono />
                <Row
                  label="原圖 DPI"
                  value={selected.sourceDpi ? `${selected.sourceDpi}` : '未標記'}
                  mono
                />
                <Row label="目標像素" value={`${targetPx.w} × ${targetPx.h}`} mono accent />
                <Row label="約略大小" value={`${formatNum(megapixels, 2)} MP`} mono />
                <Row label="DPI" value={`${dpi}`} mono />
                {workMode === 'size' && (
                  <Row
                    label="列印尺寸"
                    value={`${formatNum(printW)} × ${formatNum(printH)} ${uLabel}`}
                    mono
                  />
                )}
                {workMode === 'native' && (
                  <Row
                    label="標籤後尺寸"
                    value={`${formatNum(printSizeAtDpi.w)} × ${formatNum(printSizeAtDpi.h)} ${uLabel}`}
                    mono
                  />
                )}
              </div>

              {quality && (
                <div
                  className={`rounded-xl border p-3 ${
                    quality.quality === 'excellent'
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : quality.quality === 'good'
                        ? 'border-cyan-500/30 bg-cyan-500/10'
                        : quality.quality === 'fair'
                          ? 'border-amber-500/30 bg-amber-500/10'
                          : 'border-rose-500/30 bg-rose-500/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {quality.quality === 'poor' || quality.quality === 'fair' ? (
                      <AlertTriangle className={`w-4 h-4 ${quality.color}`} />
                    ) : (
                      <CheckCircle2 className={`w-4 h-4 ${quality.color}`} />
                    )}
                    <span className={`text-xs font-semibold ${quality.color}`}>
                      {quality.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{quality.tip}</p>
                  <p className="mt-1.5 text-[11px] font-mono text-slate-500">
                    有效解析 ≈ {formatNum(quality.effectiveDpi, 0)} DPI
                  </p>
                </div>
              )}

              {isUpscaling && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-semibold text-amber-200">放大輸出</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    目標像素大於原圖，軟體放大無法憑空增加細節。建議縮小列印尺寸，或改用「只改
                    DPI 標籤」。
                  </p>
                  <label className="mt-2 flex items-center gap-2 text-[11px] text-amber-100/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={upscaleWarnAck}
                      onChange={(e) => setUpscaleWarnAck(e.target.checked)}
                      className="accent-amber-400"
                    />
                    我了解，仍要匯出
                  </label>
                </div>
              )}

              {tooLarge && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[11px] text-rose-200">
                  目標過大，瀏覽器可能無法處理。請降低 DPI 或尺寸。
                </div>
              )}

              <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-[10px] text-slate-500 leading-relaxed space-y-1">
                <p className="text-slate-400 font-medium">給 AI 圖的建議</p>
                <p>· 螢幕圖多為 72/96 DPI 標籤，列印請改 300。</p>
                <p>· 先決定實際 cm，再看「有效解析」是否 ≥200。</p>
                <p>· 印刷店 / Photoshop：用 PNG + pHYs。</p>
                <p>© 2026 Scout System</p>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500">上傳圖片後顯示品質診斷。</p>
          )}
        </aside>
      </div>
    </ToolShell>
  )
}

function Row({
  label,
  value,
  mono,
  accent,
}: {
  label: string
  value: string
  mono?: boolean
  accent?: boolean
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span
        className={`text-right truncate ${mono ? 'font-mono' : ''} ${
          accent ? 'text-emerald-300' : 'text-slate-300'
        }`}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}
