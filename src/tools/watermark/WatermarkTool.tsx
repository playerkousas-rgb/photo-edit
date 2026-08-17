import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Type, Trash2 } from 'lucide-react'
import ToolShell from '../../components/ui/ToolShell'
import DropZone from '../../components/ui/DropZone'
import { downloadBlob } from '../../lib/pngDpi'

type Position =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'tile'

const POSITIONS: { id: Position; label: string }[] = [
  { id: 'bottom-right', label: '右下' },
  { id: 'bottom-left', label: '左下' },
  { id: 'top-right', label: '右上' },
  { id: 'top-left', label: '左上' },
  { id: 'center', label: '置中' },
  { id: 'tile', label: '滿版重複' },
]

export default function WatermarkTool() {
  const [url, setUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [fontSize, setFontSize] = useState(36)
  const [opacity, setOpacity] = useState(0.35)
  const [color, setColor] = useState('#ffffff')
  const [angle, setAngle] = useState(-24)
  const [position, setPosition] = useState<Position>('bottom-right')
  const [bold, setBold] = useState(true)
  const [shadow, setShadow] = useState(true)
  const [margin, setMargin] = useState(24)
  const [tileGap, setTileGap] = useState(120)
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
  }, [])

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url]
  )

  const draw = useCallback(async () => {
    if (!url || !canvasRef.current) return
    const img = new Image()
    await new Promise<void>((res, rej) => {
      img.onload = () => res()
      img.onerror = rej
      img.src = url
    })
    const c = canvasRef.current
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.drawImage(img, 0, 0)

    const wm = text.trim()
    if (!wm) return

    // scale font relative to image size
    const base = Math.max(12, Math.round((fontSize / 1000) * Math.min(c.width, c.height)))
    const size = Math.max(fontSize * 0.5, base)
    ctx.font = `${bold ? '700' : '400'} ${size}px Inter, "Noto Sans TC", system-ui, sans-serif`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.globalAlpha = opacity
    ctx.fillStyle = color

    const drawLabel = (x: number, y: number, rot = 0) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate((rot * Math.PI) / 180)
      if (shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.45)'
        ctx.shadowBlur = 6
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
      }
      ctx.fillText(wm, 0, 0)
      ctx.restore()
    }

    const m = margin
    const metrics = ctx.measureText(wm)
    const tw = metrics.width
    const th = size

    if (position === 'tile') {
      const gap = tileGap + tw * 0.3
      const stepY = tileGap + th
      for (let y = -c.height; y < c.height * 2; y += stepY) {
        for (let x = -c.width; x < c.width * 2; x += gap) {
          drawLabel(x, y, angle)
        }
      }
    } else {
      let x = c.width / 2
      let y = c.height / 2
      if (position === 'top-left') {
        x = m + tw / 2
        y = m + th / 2
      } else if (position === 'top-right') {
        x = c.width - m - tw / 2
        y = m + th / 2
      } else if (position === 'bottom-left') {
        x = m + tw / 2
        y = c.height - m - th / 2
      } else if (position === 'bottom-right') {
        x = c.width - m - tw / 2
        y = c.height - m - th / 2
      }
      drawLabel(x, y, position === 'center' ? angle : 0)
    }
    ctx.globalAlpha = 1
  }, [
    url,
    text,
    fontSize,
    opacity,
    color,
    angle,
    position,
    bold,
    shadow,
    margin,
    tileGap,
  ])

  useEffect(() => {
    void draw()
  }, [draw])

  const exportPng = async () => {
    await draw()
    const c = canvasRef.current
    if (!c) return
    const blob: Blob | null = await new Promise((r) => c.toBlob((b) => r(b), 'image/png'))
    if (!blob) return
    const base = name.replace(/\.[^.]+$/, '') || 'watermark'
    downloadBlob(blob, `${base}_wm.png`)
  }

  return (
    <ToolShell
      icon={Type}
      title="浮水印 / 版權字"
      subtitle="自訂文字 · 位置與透明度 · Scout System"
      accentClass="from-fuchsia-500 to-pink-600"
      actions={
        <button
          onClick={exportPng}
          disabled={!url || !text.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-fuchsia-500 text-white hover:bg-fuchsia-400 disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" />
          匯出
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 h-fit">
          <DropZone onFiles={load} label="上傳圖片" compact />
          {name && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-fuchsia-300 truncate">{name}</p>
              <button
                onClick={() => {
                  setUrl((p) => {
                    if (p) URL.revokeObjectURL(p)
                    return null
                  })
                  setName('')
                }}
                className="text-slate-500 hover:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 block">
              浮水印文字（自行填寫）
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="例如：© 你的名字 / 旅團名稱 / 活動名"
              rows={3}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 resize-none focus:border-fuchsia-500/50 focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-slate-600">
              不會強制加入 Scout System，內容完全由你決定。
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-2 block">位置</label>
            <div className="grid grid-cols-3 gap-1">
              {POSITIONS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPosition(p.id)}
                  className={`rounded-md border px-2 py-1.5 text-[11px] ${
                    position === p.id
                      ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-200'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-[11px] text-slate-400">
              顏色
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="mt-1 block w-full h-9"
              />
            </label>
            <label className="text-[11px] text-slate-400">
              字級 {fontSize}
              <input
                type="range"
                min={12}
                max={120}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="mt-2 w-full accent-fuchsia-500"
              />
            </label>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>透明度</span>
              <span>{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.01}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-fuchsia-500"
            />
          </div>

          {(position === 'tile' || position === 'center') && (
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>旋轉角度</span>
                <span>{angle}°</span>
              </div>
              <input
                type="range"
                min={-90}
                max={90}
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full accent-fuchsia-500"
              />
            </div>
          )}

          {position === 'tile' && (
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>間距</span>
                <span>{tileGap}</span>
              </div>
              <input
                type="range"
                min={40}
                max={280}
                value={tileGap}
                onChange={(e) => setTileGap(Number(e.target.value))}
                className="w-full accent-fuchsia-500"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>邊距</span>
              <span>{margin}px</span>
            </div>
            <input
              type="range"
              min={8}
              max={120}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="w-full accent-fuchsia-500"
            />
          </div>

          <div className="flex gap-4 text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bold}
                onChange={(e) => setBold(e.target.checked)}
                className="accent-fuchsia-500"
              />
              粗體
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shadow}
                onChange={(e) => setShadow(e.target.checked)}
                className="accent-fuchsia-500"
              />
              陰影
            </label>
          </div>

          <button
            onClick={exportPng}
            disabled={!url || !text.trim()}
            className="w-full rounded-xl bg-fuchsia-500 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-400 disabled:bg-slate-700 disabled:text-slate-400 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            匯出 PNG
          </button>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col min-h-[420px]">
          <h2 className="text-sm font-semibold mb-3">即時預覽</h2>
          <div className="flex-1 flex items-center justify-center rounded-xl border border-slate-700 bg-[#0a0f1a] overflow-auto p-4">
            {url ? (
              <canvas ref={canvasRef} className="max-w-full max-h-[70vh] shadow-2xl" />
            ) : (
              <p className="text-sm text-slate-500">上傳圖片並輸入浮水印文字</p>
            )}
          </div>
        </section>
      </div>
    </ToolShell>
  )
}
