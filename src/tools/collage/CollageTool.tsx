import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, LayoutGrid, Trash2, Shuffle } from 'lucide-react'
import ToolShell from '../../components/ui/ToolShell'
import DropZone from '../../components/ui/DropZone'
import { downloadBlob } from '../../lib/pngDpi'

type LayoutId = '1x2' | '2x1' | '2x2' | '3x3' | '1+2' | '2+1' | '1x3' | '3x1'

interface LayoutDef {
  id: LayoutId
  label: string
  cols: number
  rows: number
  cells: number
}

const LAYOUTS: LayoutDef[] = [
  { id: '2x2', label: '2×2', cols: 2, rows: 2, cells: 4 },
  { id: '3x3', label: '九宮格', cols: 3, rows: 3, cells: 9 },
  { id: '1x2', label: '1×2 直', cols: 1, rows: 2, cells: 2 },
  { id: '2x1', label: '2×1 橫', cols: 2, rows: 1, cells: 2 },
  { id: '1x3', label: '1×3', cols: 1, rows: 3, cells: 3 },
  { id: '3x1', label: '3×1', cols: 3, rows: 1, cells: 3 },
]

interface SlotImage {
  id: string
  url: string
  name: string
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export default function CollageTool() {
  const [layoutId, setLayoutId] = useState<LayoutId>('3x3')
  const [images, setImages] = useState<SlotImage[]>([])
  const [gap, setGap] = useState(12)
  const [padding, setPadding] = useState(16)
  const [bg, setBg] = useState('#ffffff')
  const [outW, setOutW] = useState(1800)
  const [radius, setRadius] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const layout = LAYOUTS.find((l) => l.id === layoutId) ?? LAYOUTS[1]

  const addFiles = useCallback(
    async (files: File[]) => {
      const next: SlotImage[] = []
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        const url = URL.createObjectURL(file)
        next.push({ id: uid(), url, name: file.name })
      }
      if (!next.length) return
      setImages((prev) => {
        const merged = [...prev, ...next]
        // cap to layout cells * 2 for flexibility
        return merged.slice(0, 18)
      })
    },
    []
  )

  const clearAll = () => {
    setImages((prev) => {
      prev.forEach((i) => URL.revokeObjectURL(i.url))
      return []
    })
  }

  const removeAt = (id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) URL.revokeObjectURL(item.url)
      return prev.filter((i) => i.id !== id)
    })
  }

  const shuffle = () => {
    setImages((prev) => {
      const a = [...prev]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    })
  }

  useEffect(
    () => () => {
      images.forEach((i) => URL.revokeObjectURL(i.url))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const outH = useMemo(() => {
    // square-ish cells
    const cell = (outW - padding * 2 - gap * (layout.cols - 1)) / layout.cols
    return Math.round(padding * 2 + cell * layout.rows + gap * (layout.rows - 1))
  }, [outW, padding, gap, layout])

  const draw = useCallback(async () => {
    const c = canvasRef.current
    if (!c) return
    c.width = outW
    c.height = outH
    const ctx = c.getContext('2d')!
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, outW, outH)

    const cellW = (outW - padding * 2 - gap * (layout.cols - 1)) / layout.cols
    const cellH = (outH - padding * 2 - gap * (layout.rows - 1)) / layout.rows

    const loadImg = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })

    for (let i = 0; i < layout.cells; i++) {
      const col = i % layout.cols
      const row = Math.floor(i / layout.cols)
      const x = padding + col * (cellW + gap)
      const y = padding + row * (cellH + gap)

      ctx.save()
      if (radius > 0) {
        roundRect(ctx, x, y, cellW, cellH, radius)
        ctx.clip()
      }

      const slot = images[i]
      if (slot) {
        try {
          const img = await loadImg(slot.url)
          // cover fit
          const scale = Math.max(cellW / img.naturalWidth, cellH / img.naturalHeight)
          const dw = img.naturalWidth * scale
          const dh = img.naturalHeight * scale
          const dx = x + (cellW - dw) / 2
          const dy = y + (cellH - dh) / 2
          ctx.drawImage(img, dx, dy, dw, dh)
        } catch {
          ctx.fillStyle = '#e2e8f0'
          ctx.fillRect(x, y, cellW, cellH)
        }
      } else {
        ctx.fillStyle = '#f1f5f9'
        ctx.fillRect(x, y, cellW, cellH)
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 2
        ctx.setLineDash([8, 6])
        ctx.strokeRect(x + 4, y + 4, cellW - 8, cellH - 8)
        ctx.setLineDash([])
        ctx.fillStyle = '#94a3b8'
        ctx.font = `${Math.max(14, cellW * 0.06)}px system-ui`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${i + 1}`, x + cellW / 2, y + cellH / 2)
      }
      ctx.restore()
    }
  }, [outW, outH, bg, padding, gap, layout, images, radius])

  useEffect(() => {
    void draw()
  }, [draw])

  const exportPng = async () => {
    await draw()
    const c = canvasRef.current
    if (!c) return
    const blob: Blob | null = await new Promise((r) => c.toBlob((b) => r(b), 'image/png'))
    if (!blob) return
    downloadBlob(blob, `collage_${layout.label}_${outW}x${outH}.png`)
  }

  return (
    <ToolShell
      icon={LayoutGrid}
      title="拼圖 / 九宮格"
      subtitle="多圖拼版 · 活動相簿 · Scout System"
      accentClass="from-orange-500 to-red-600"
      actions={
        <button
          onClick={exportPng}
          disabled={!images.length}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-white hover:bg-orange-400 disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" />
          匯出
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 h-fit">
          <DropZone
            onFiles={addFiles}
            multiple
            label="上傳多張相片"
            hint={`目前版面需要 ${layout.cells} 張（可多選）`}
            compact
          />

          <div>
            <label className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-2 block">
              版面
            </label>
            <div className="grid grid-cols-3 gap-1">
              {LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLayoutId(l.id)}
                  className={`rounded-md border px-2 py-1.5 text-[11px] ${
                    layoutId === l.id
                      ? 'border-orange-400 bg-orange-500/20 text-orange-200'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {images.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-400">
                  {images.length} / {layout.cells} 張
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={shuffle}
                    className="p-1.5 rounded border border-slate-700 text-slate-400 hover:text-white"
                    title="打亂順序"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={clearAll}
                    className="p-1.5 rounded border border-slate-700 text-slate-400 hover:text-rose-400"
                    title="清除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => removeAt(img.id)}
                    title={`點擊移除 #${idx + 1}`}
                    className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700 hover:border-rose-400"
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 left-0 right-0 text-[9px] bg-black/60 text-center">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>輸出寬度</span>
              <span>{outW}px</span>
            </div>
            <input
              type="range"
              min={800}
              max={4000}
              step={100}
              value={outW}
              onChange={(e) => setOutW(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
            <p className="text-[10px] text-slate-600 mt-0.5">
              高度自動 ≈ {outH}px
            </p>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>間距</span>
              <span>{gap}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={48}
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>外框邊距</span>
              <span>{padding}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={64}
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>圓角</span>
              <span>{radius}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>

          <label className="flex items-center justify-between text-xs text-slate-300">
            背景色
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
          </label>

          <button
            onClick={exportPng}
            disabled={!images.length}
            className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-400 disabled:bg-slate-700 disabled:text-slate-400 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            匯出拼圖 PNG
          </button>
          <p className="text-[10px] text-slate-600 text-center">
            發佈前可用「馬賽克」保護小朋友臉部 · © Scout System
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col min-h-[420px]">
          <h2 className="text-sm font-semibold mb-3">預覽 · {layout.label}</h2>
          <div className="flex-1 flex items-center justify-center rounded-xl border border-slate-700 bg-[#0a0f1a] overflow-auto p-4">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[70vh] shadow-2xl"
              style={{ background: bg }}
            />
          </div>
        </section>
      </div>
    </ToolShell>
  )
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}
