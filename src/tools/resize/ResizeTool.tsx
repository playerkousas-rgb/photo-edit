import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Crop, Download, FlipHorizontal, FlipVertical, RotateCw, Trash2 } from 'lucide-react'
import ToolShell from '../../components/ui/ToolShell'
import DropZone from '../../components/ui/DropZone'
import { downloadBlob } from '../../lib/pngDpi'

type AspectPreset = 'free' | '1:1' | '4:5' | '16:9' | '3:2' | 'A4' | 'original'

const ASPECTS: { id: AspectPreset; label: string; ratio: number | null }[] = [
  { id: 'free', label: '自由', ratio: null },
  { id: 'original', label: '原圖', ratio: null },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:5', label: '4:5', ratio: 4 / 5 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: 'A4', label: 'A4', ratio: 210 / 297 },
]

export default function ResizeTool() {
  const [url, setUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [naturalW, setNaturalW] = useState(0)
  const [naturalH, setNaturalH] = useState(0)
  const [outW, setOutW] = useState(1080)
  const [outH, setOutH] = useState(1080)
  const [lock, setLock] = useState(true)
  const [aspect, setAspect] = useState<AspectPreset>('original')
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [scale, setScale] = useState(100)
  const aspectRef = useRef(1)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
    setNaturalW(img.naturalWidth)
    setNaturalH(img.naturalHeight)
    aspectRef.current = img.naturalWidth / img.naturalHeight
    setOutW(img.naturalWidth)
    setOutH(img.naturalHeight)
    setScale(100)
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setAspect('original')
  }, [])

  const clear = () => {
    setUrl((p) => {
      if (p) URL.revokeObjectURL(p)
      return null
    })
    setName('')
  }

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url)
  }, [url])

  const applyAspect = (id: AspectPreset) => {
    setAspect(id)
    if (!naturalW) return
    if (id === 'free') {
      setLock(false)
      return
    }
    if (id === 'original') {
      setLock(true)
      aspectRef.current = naturalW / naturalH
      setOutW(Math.round((naturalW * scale) / 100))
      setOutH(Math.round((naturalH * scale) / 100))
      return
    }
    const preset = ASPECTS.find((a) => a.id === id)
    if (!preset?.ratio) return
    setLock(true)
    aspectRef.current = preset.ratio
    // fit width, derive height
    const w = outW || naturalW
    setOutW(w)
    setOutH(Math.round(w / preset.ratio))
  }

  const onW = (v: number) => {
    setOutW(v)
    if (lock && aspectRef.current > 0) setOutH(Math.max(1, Math.round(v / aspectRef.current)))
  }
  const onH = (v: number) => {
    setOutH(v)
    if (lock && aspectRef.current > 0) setOutW(Math.max(1, Math.round(v * aspectRef.current)))
  }

  const onScale = (s: number) => {
    setScale(s)
    if (!naturalW) return
    const baseW = naturalW
    const baseH = naturalH
    if (aspect === 'original' || aspect === 'free') {
      setOutW(Math.max(1, Math.round((baseW * s) / 100)))
      setOutH(Math.max(1, Math.round((baseH * s) / 100)))
      aspectRef.current = baseW / baseH
    } else {
      const r = aspectRef.current
      const w = Math.max(1, Math.round((baseW * s) / 100))
      setOutW(w)
      setOutH(Math.max(1, Math.round(w / r)))
    }
  }

  const draw = useCallback(async () => {
    if (!url || !canvasRef.current) return
    const img = new Image()
    await new Promise<void>((res, rej) => {
      img.onload = () => res()
      img.onerror = rej
      img.src = url
    })
    const canvas = canvasRef.current
    const rot = ((rotation % 360) + 360) % 360
    const swap = rot === 90 || rot === 270
    const tw = outW
    const th = outH
    canvas.width = tw
    canvas.height = th
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.clearRect(0, 0, tw, th)
    ctx.save()
    ctx.translate(tw / 2, th / 2)
    ctx.rotate((rot * Math.PI) / 180)
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
    // cover-fit source into target (center crop feel when aspect differs)
    const srcW = img.naturalWidth
    const srcH = img.naturalHeight
    const dstW = swap ? th : tw
    const dstH = swap ? tw : th
    const scaleCover = Math.max(dstW / srcW, dstH / srcH)
    const dw = srcW * scaleCover
    const dh = srcH * scaleCover
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
    ctx.restore()
  }, [url, outW, outH, rotation, flipH, flipV])

  useEffect(() => {
    void draw()
  }, [draw])

  const previewUrl = useMemo(() => {
    // live canvas is enough; return null placeholder
    return null
  }, [])
  void previewUrl

  const exportPng = async () => {
    await draw()
    const canvas = canvasRef.current
    if (!canvas) return
    const blob: Blob | null = await new Promise((r) => canvas.toBlob((b) => r(b), 'image/png'))
    if (!blob) return
    const base = name.replace(/\.[^.]+$/, '') || 'crop'
    downloadBlob(blob, `${base}_${outW}x${outH}.png`)
  }

  return (
    <ToolShell
      icon={Crop}
      title="裁切 / 縮放"
      subtitle="比例裁切 · 旋轉翻轉 · 像素輸出 · Scout System"
      accentClass="from-amber-500 to-orange-600"
      actions={
        <button
          onClick={exportPng}
          disabled={!url}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" />
          匯出 PNG
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 h-fit">
          <DropZone onFiles={load} label="上傳要裁切的圖片" compact />
          {url && (
            <button
              onClick={clear}
              className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              清除
            </button>
          )}

          <div>
            <label className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-2 block">
              比例
            </label>
            <div className="flex flex-wrap gap-1">
              {ASPECTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => applyAspect(a.id)}
                  className={`px-2 py-1 rounded text-[11px] border ${
                    aspect === a.id
                      ? 'border-amber-400 bg-amber-500/15 text-amber-200'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] text-slate-400">
              寬 px
              <input
                type="number"
                min={1}
                value={outW}
                onChange={(e) => onW(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-[11px] text-slate-400">
              高 px
              <input
                type="number"
                min={1}
                value={outH}
                onChange={(e) => onH(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
              />
            </label>
          </div>

          <label className="flex items-center justify-between text-xs text-slate-300">
            鎖定比例
            <input
              type="checkbox"
              checked={lock}
              onChange={(e) => setLock(e.target.checked)}
              className="accent-amber-500"
            />
          </label>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>相對原圖縮放</span>
              <span>{scale}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={200}
              value={scale}
              onChange={(e) => onScale(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 py-2 text-xs text-slate-300 hover:border-amber-500/40"
            >
              <RotateCw className="w-3.5 h-3.5" />
              旋轉
            </button>
            <button
              onClick={() => setFlipH((v) => !v)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs ${
                flipH
                  ? 'border-amber-400 text-amber-200 bg-amber-500/10'
                  : 'border-slate-700 text-slate-300'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              水平
            </button>
            <button
              onClick={() => setFlipV((v) => !v)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs ${
                flipV
                  ? 'border-amber-400 text-amber-200 bg-amber-500/10'
                  : 'border-slate-700 text-slate-300'
              }`}
            >
              <FlipVertical className="w-3.5 h-3.5" />
              垂直
            </button>
          </div>

          {url && (
            <p className="text-[11px] text-slate-500 font-mono">
              原圖 {naturalW}×{naturalH} → 輸出 {outW}×{outH}
            </p>
          )}

          <button
            onClick={exportPng}
            disabled={!url}
            className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-400 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            匯出 PNG
          </button>
          <p className="text-[10px] text-slate-600 text-center">
            裁好後可到「DPI 列印」設定實際 cm · © Scout System
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col min-h-[420px]">
          <h2 className="text-sm font-semibold mb-3">即時預覽</h2>
          <div className="flex-1 flex items-center justify-center rounded-xl border border-slate-700 bg-[#0a0f1a] overflow-auto p-4">
            {url ? (
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[70vh] shadow-2xl"
                style={{ width: 'auto', height: 'auto' }}
              />
            ) : (
              <p className="text-sm text-slate-500">上傳圖片後預覽裁切結果</p>
            )}
          </div>
        </section>
      </div>
    </ToolShell>
  )
}
