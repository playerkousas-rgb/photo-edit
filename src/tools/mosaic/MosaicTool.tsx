import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, ScanFace, Trash2, Undo2, Plus, Eye, EyeOff } from 'lucide-react'
import ToolShell from '../../components/ui/ToolShell'
import DropZone from '../../components/ui/DropZone'
import { downloadBlob } from '../../lib/pngDpi'

type Mode = 'pixelate' | 'blur' | 'black'
type Shape = 'rect' | 'ellipse'

interface Region {
  id: string
  x: number // 0-1 relative
  y: number
  w: number
  h: number
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export default function MosaicTool() {
  const [url, setUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [natW, setNatW] = useState(0)
  const [natH, setNatH] = useState(0)
  const [regions, setRegions] = useState<Region[]>([])
  const [mode, setMode] = useState<Mode>('pixelate')
  const [shape, setShape] = useState<Shape>('ellipse')
  const [blockSize, setBlockSize] = useState(18)
  const [blurRadius, setBlurRadius] = useState(24)
  const [showOverlay, setShowOverlay] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const [draft, setDraft] = useState<Region | null>(null)

  const viewRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)

  const load = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file?.type.startsWith('image/')) return
    const u = URL.createObjectURL(file)
    const img = new Image()
    await new Promise<void>((res, rej) => {
      img.onload = () => res()
      img.onerror = rej
      img.src = u
    })
    setUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return u
    })
    setName(file.name)
    setNatW(img.naturalWidth)
    setNatH(img.naturalHeight)
    setRegions([])
    setDraft(null)
  }, [])

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url]
  )

  const relFromEvent = (e: React.PointerEvent) => {
    const el = viewRef.current
    if (!el) return { x: 0, y: 0 }
    const r = el.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!url) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = relFromEvent(e)
    dragStart.current = p
    setDrawing(true)
    setDraft({ id: 'draft', x: p.x, y: p.y, w: 0, h: 0 })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing || !dragStart.current) return
    const p = relFromEvent(e)
    const x0 = dragStart.current.x
    const y0 = dragStart.current.y
    const x = Math.min(x0, p.x)
    const y = Math.min(y0, p.y)
    const w = Math.abs(p.x - x0)
    const h = Math.abs(p.y - y0)
    setDraft({ id: 'draft', x, y, w, h })
  }

  const onPointerUp = () => {
    if (!drawing) return
    setDrawing(false)
    dragStart.current = null
    setDraft((d) => {
      if (d && d.w > 0.01 && d.h > 0.01) {
        setRegions((prev) => [...prev, { ...d, id: uid() }])
      }
      return null
    })
  }

  const applyMosaic = useCallback(
    (ctx: CanvasRenderingContext2D, img: HTMLImageElement, regs: Region[]) => {
      const W = img.naturalWidth
      const H = img.naturalHeight
      ctx.clearRect(0, 0, W, H)
      ctx.drawImage(img, 0, 0)

      for (const reg of regs) {
        const rx = Math.round(reg.x * W)
        const ry = Math.round(reg.y * H)
        const rw = Math.max(1, Math.round(reg.w * W))
        const rh = Math.max(1, Math.round(reg.h * H))

        ctx.save()
        ctx.beginPath()
        if (shape === 'ellipse') {
          ctx.ellipse(rx + rw / 2, ry + rh / 2, rw / 2, rh / 2, 0, 0, Math.PI * 2)
        } else {
          ctx.rect(rx, ry, rw, rh)
        }
        ctx.clip()

        if (mode === 'black') {
          ctx.fillStyle = '#000'
          ctx.fillRect(rx, ry, rw, rh)
        } else if (mode === 'blur') {
          // multi-pass downscale blur
          const tmp = document.createElement('canvas')
          const scale = Math.max(0.04, 1 / Math.max(2, blurRadius / 4))
          tmp.width = Math.max(1, Math.round(rw * scale))
          tmp.height = Math.max(1, Math.round(rh * scale))
          const tctx = tmp.getContext('2d')!
          tctx.imageSmoothingEnabled = true
          tctx.drawImage(img, rx, ry, rw, rh, 0, 0, tmp.width, tmp.height)
          ctx.imageSmoothingEnabled = true
          ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, rx, ry, rw, rh)
        } else {
          // pixelate
          const bs = Math.max(4, blockSize)
          const tmp = document.createElement('canvas')
          tmp.width = Math.max(1, Math.ceil(rw / bs))
          tmp.height = Math.max(1, Math.ceil(rh / bs))
          const tctx = tmp.getContext('2d')!
          tctx.imageSmoothingEnabled = false
          tctx.drawImage(img, rx, ry, rw, rh, 0, 0, tmp.width, tmp.height)
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, rx, ry, rw, rh)
        }
        ctx.restore()
      }
    },
    [mode, shape, blockSize, blurRadius]
  )

  // live preview canvas
  useEffect(() => {
    if (!url || !previewRef.current) return
    const img = new Image()
    img.onload = () => {
      const c = previewRef.current!
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const ctx = c.getContext('2d')!
      const all = draft ? [...regions, draft] : regions
      applyMosaic(ctx, img, all)
    }
    img.src = url
  }, [url, regions, draft, applyMosaic])

  const exportPng = async () => {
    if (!url) return
    const img = new Image()
    await new Promise<void>((res, rej) => {
      img.onload = () => res()
      img.onerror = rej
      img.src = url
    })
    const c = document.createElement('canvas')
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    const ctx = c.getContext('2d')!
    applyMosaic(ctx, img, regions)
    const blob: Blob | null = await new Promise((r) => c.toBlob((b) => r(b), 'image/png'))
    if (!blob) return
    const base = name.replace(/\.[^.]+$/, '') || 'mosaic'
    downloadBlob(blob, `${base}_mosaic.png`)
  }

  const removeLast = () => setRegions((r) => r.slice(0, -1))
  const clearRegions = () => setRegions([])

  return (
    <ToolShell
      icon={ScanFace}
      title="馬賽克 / 臉部打碼"
      subtitle="保護小朋友私隱 · 框選後匯出 · Scout System"
      accentClass="from-sky-500 to-blue-600"
      actions={
        <button
          onClick={exportPng}
          disabled={!url || regions.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" />
          匯出
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 h-fit">
          <DropZone
            onFiles={load}
            label="上傳活動相片"
            hint="在預覽上拖曳框選臉部"
            compact
          />
          {name && <p className="text-[11px] text-sky-300 truncate">{name}</p>}

          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-[11px] text-slate-400 leading-relaxed">
            <p className="text-sky-300 font-medium mb-1">私隱提示</p>
            發佈含未成年者相片前，請為臉部打碼。可新增多個框選區域。
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-2 block">
              打碼方式
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  ['pixelate', '馬賽克'],
                  ['blur', '模糊'],
                  ['black', '黑塊'],
                ] as [Mode, string][]
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-md border px-2 py-1.5 text-[11px] ${
                    mode === m
                      ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-2 block">
              形狀
            </label>
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  ['ellipse', '橢圓（臉）'],
                  ['rect', '矩形'],
                ] as [Shape, string][]
              ).map(([s, label]) => (
                <button
                  key={s}
                  onClick={() => setShape(s)}
                  className={`rounded-md border px-2 py-1.5 text-[11px] ${
                    shape === s
                      ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {mode === 'pixelate' && (
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>馬賽克粗細</span>
                <span>{blockSize}px</span>
              </div>
              <input
                type="range"
                min={6}
                max={48}
                value={blockSize}
                onChange={(e) => setBlockSize(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>
          )}
          {mode === 'blur' && (
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>模糊強度</span>
                <span>{blurRadius}</span>
              </div>
              <input
                type="range"
                min={8}
                max={60}
                value={blurRadius}
                onChange={(e) => setBlurRadius(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={removeLast}
              disabled={!regions.length}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] text-slate-300 disabled:opacity-40"
            >
              <Undo2 className="w-3 h-3" />
              撤銷
            </button>
            <button
              onClick={clearRegions}
              disabled={!regions.length}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] text-slate-300 disabled:opacity-40"
            >
              <Trash2 className="w-3 h-3" />
              清除全部
            </button>
            <button
              onClick={() => setShowOverlay((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] text-slate-300"
            >
              {showOverlay ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              框線
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            已標記 <span className="text-sky-300 font-mono">{regions.length}</span> 個區域
            {natW > 0 && (
              <span className="ml-2 font-mono text-slate-600">
                {natW}×{natH}
              </span>
            )}
          </p>

          <button
            onClick={exportPng}
            disabled={!url || !regions.length}
            className="w-full rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            匯出打碼 PNG
          </button>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">預覽 · 拖曳框選</h2>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Plus className="w-3 h-3" />
              按住拖曳新增區域
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center rounded-xl border border-slate-700 bg-[#0a0f1a] overflow-auto p-4">
            {url ? (
              <div
                ref={viewRef}
                className="relative inline-block max-w-full touch-none cursor-crosshair select-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                {/* hidden source for layout size */}
                <img
                  ref={imgRef}
                  src={url}
                  alt=""
                  className="max-w-full max-h-[70vh] block opacity-0 pointer-events-none"
                  draggable={false}
                />
                <canvas
                  ref={previewRef}
                  className="absolute inset-0 w-full h-full"
                  style={{ imageRendering: mode === 'pixelate' ? 'pixelated' : 'auto' }}
                />
                {showOverlay &&
                  [...regions, ...(draft ? [draft] : [])].map((reg) => (
                    <div
                      key={reg.id}
                      className={`absolute border-2 pointer-events-none ${
                        reg.id === 'draft'
                          ? 'border-sky-300 border-dashed bg-sky-400/10'
                          : 'border-sky-400/80 bg-sky-500/5'
                      } ${shape === 'ellipse' ? 'rounded-full' : 'rounded-sm'}`}
                      style={{
                        left: `${reg.x * 100}%`,
                        top: `${reg.y * 100}%`,
                        width: `${reg.w * 100}%`,
                        height: `${reg.h * 100}%`,
                      }}
                    />
                  ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center px-4">
                上傳相片後，在臉部拖曳框選即可打碼
              </p>
            )}
          </div>
        </section>
      </div>
    </ToolShell>
  )
}
