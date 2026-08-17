import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Frame, Eye, EyeOff } from 'lucide-react'
import ToolShell from '../../components/ui/ToolShell'
import DropZone from '../../components/ui/DropZone'
import { downloadBlob } from '../../lib/pngDpi'

type Unit = 'mm' | 'px'
type BorderStyle = 'none' | 'solid' | 'double' | 'dashed'

/** Convert mm to pixels at given DPI */
function mmToPx(mm: number, dpi: number) {
  return Math.round((mm / 25.4) * dpi)
}

export default function BleedTool() {
  const [url, setUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [dpi, setDpi] = useState(300)
  const [unit, setUnit] = useState<Unit>('mm')
  const [bleed, setBleed] = useState(3) // mm default
  const [safe, setSafe] = useState(5) // mm
  const [showGuides, setShowGuides] = useState(true)
  const [exportGuides, setExportGuides] = useState(false)
  const [cropMarks, setCropMarks] = useState(true)
  const [borderStyle, setBorderStyle] = useState<BorderStyle>('none')
  const [borderWidth, setBorderWidth] = useState(8) // px decorative
  const [borderColor, setBorderColor] = useState('#02133E')
  const [padColor, setPadColor] = useState('#ffffff')
  const [extendBleed, setExtendBleed] = useState(true) // pad canvas with bleed
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

  const toPx = (v: number) => (unit === 'mm' ? mmToPx(v, dpi) : Math.round(v))

  const draw = useCallback(
    async (forExport: boolean) => {
      if (!url || !canvasRef.current) return
      const img = new Image()
      await new Promise<void>((res, rej) => {
        img.onload = () => res()
        img.onerror = rej
        img.src = url
      })

      const bleedPx = toPx(bleed)
      const safePx = toPx(safe)
      const markLen = Math.max(12, Math.round(bleedPx * 0.8))
      const markGap = 2
      const outerPad = cropMarks ? bleedPx + markLen + 8 : bleedPx

      const contentW = img.naturalWidth
      const contentH = img.naturalHeight

      // final trim size = image; bleed extends outside
      const canvasW = extendBleed ? contentW + outerPad * 2 : contentW
      const canvasH = extendBleed ? contentH + outerPad * 2 : contentH

      const c = canvasRef.current
      c.width = canvasW
      c.height = canvasH
      const ctx = c.getContext('2d')!
      ctx.fillStyle = padColor
      ctx.fillRect(0, 0, canvasW, canvasH)

      const ox = extendBleed ? outerPad : 0
      const oy = extendBleed ? outerPad : 0

      // If extend bleed: mirror-edge fill into bleed zone (simple edge extend)
      if (extendBleed && bleedPx > 0) {
        // draw stretched edges into bleed
        // top
        ctx.drawImage(img, 0, 0, contentW, 1, ox, oy - bleedPx, contentW, bleedPx)
        // bottom
        ctx.drawImage(
          img,
          0,
          contentH - 1,
          contentW,
          1,
          ox,
          oy + contentH,
          contentW,
          bleedPx
        )
        // left
        ctx.drawImage(img, 0, 0, 1, contentH, ox - bleedPx, oy, bleedPx, contentH)
        // right
        ctx.drawImage(
          img,
          contentW - 1,
          0,
          1,
          contentH,
          ox + contentW,
          oy,
          bleedPx,
          contentH
        )
        // corners
        ctx.drawImage(img, 0, 0, 1, 1, ox - bleedPx, oy - bleedPx, bleedPx, bleedPx)
        ctx.drawImage(
          img,
          contentW - 1,
          0,
          1,
          1,
          ox + contentW,
          oy - bleedPx,
          bleedPx,
          bleedPx
        )
        ctx.drawImage(
          img,
          0,
          contentH - 1,
          1,
          1,
          ox - bleedPx,
          oy + contentH,
          bleedPx,
          bleedPx
        )
        ctx.drawImage(
          img,
          contentW - 1,
          contentH - 1,
          1,
          1,
          ox + contentW,
          oy + contentH,
          bleedPx,
          bleedPx
        )
      }

      ctx.drawImage(img, ox, oy, contentW, contentH)

      // decorative border inside trim
      if (borderStyle !== 'none') {
        ctx.save()
        ctx.strokeStyle = borderColor
        ctx.lineWidth = borderWidth
        const inset = borderWidth / 2 + 4
        if (borderStyle === 'dashed') ctx.setLineDash([borderWidth * 2, borderWidth])
        if (borderStyle === 'double') {
          ctx.lineWidth = Math.max(1, borderWidth / 3)
          ctx.strokeRect(ox + inset, oy + inset, contentW - inset * 2, contentH - inset * 2)
          ctx.strokeRect(
            ox + inset + borderWidth,
            oy + inset + borderWidth,
            contentW - (inset + borderWidth) * 2,
            contentH - (inset + borderWidth) * 2
          )
        } else {
          ctx.strokeRect(ox + inset, oy + inset, contentW - inset * 2, contentH - inset * 2)
        }
        ctx.restore()
      }

      const drawGuides = (!forExport && showGuides) || (forExport && exportGuides)
      if (drawGuides) {
        // bleed line (outer of trim = image edge when extend)
        ctx.save()
        ctx.lineWidth = 1
        // Trim box
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)'
        ctx.setLineDash([6, 4])
        ctx.strokeRect(ox + 0.5, oy + 0.5, contentW - 1, contentH - 1)

        // Bleed box (outside trim)
        if (extendBleed && bleedPx > 0) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)'
          ctx.setLineDash([4, 4])
          ctx.strokeRect(
            ox - bleedPx + 0.5,
            oy - bleedPx + 0.5,
            contentW + bleedPx * 2 - 1,
            contentH + bleedPx * 2 - 1
          )
        }

        // Safe area
        if (safePx > 0) {
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.9)'
          ctx.setLineDash([2, 4])
          ctx.strokeRect(
            ox + safePx + 0.5,
            oy + safePx + 0.5,
            contentW - safePx * 2 - 1,
            contentH - safePx * 2 - 1
          )
        }
        ctx.restore()

        // legend
        ctx.save()
        ctx.setLineDash([])
        ctx.font = '12px monospace'
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        const lx = 8
        let ly = 16
        const chip = (color: string, label: string) => {
          ctx.fillStyle = color
          ctx.fillRect(lx, ly - 8, 12, 3)
          ctx.fillStyle = '#e2e8f0'
          ctx.fillText(label, lx + 16, ly)
          ly += 16
        }
        ctx.fillStyle = 'rgba(15,23,42,0.75)'
        ctx.fillRect(4, 4, 130, 58)
        chip('#ef4444', '裁切 Trim')
        chip('#38bdf8', `出血 Bleed ${bleed}${unit}`)
        chip('#34d399', `安全 Safe ${safe}${unit}`)
        ctx.restore()
      }

      // crop marks
      if (cropMarks && extendBleed) {
        ctx.save()
        ctx.strokeStyle = '#111'
        ctx.lineWidth = 1
        ctx.setLineDash([])
        const marks = [
          // TL
          [
            [ox, oy - markGap],
            [ox, oy - markGap - markLen],
          ],
          [
            [ox - markGap, oy],
            [ox - markGap - markLen, oy],
          ],
          // TR
          [
            [ox + contentW, oy - markGap],
            [ox + contentW, oy - markGap - markLen],
          ],
          [
            [ox + contentW + markGap, oy],
            [ox + contentW + markGap + markLen, oy],
          ],
          // BL
          [
            [ox, oy + contentH + markGap],
            [ox, oy + contentH + markGap + markLen],
          ],
          [
            [ox - markGap, oy + contentH],
            [ox - markGap - markLen, oy + contentH],
          ],
          // BR
          [
            [ox + contentW, oy + contentH + markGap],
            [ox + contentW, oy + contentH + markGap + markLen],
          ],
          [
            [ox + contentW + markGap, oy + contentH],
            [ox + contentW + markGap + markLen, oy + contentH],
          ],
        ]
        for (const [[x1, y1], [x2, y2]] of marks) {
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
        }
        ctx.restore()
      }
    },
    [
      url,
      bleed,
      safe,
      unit,
      dpi,
      showGuides,
      exportGuides,
      cropMarks,
      borderStyle,
      borderWidth,
      borderColor,
      padColor,
      extendBleed,
    ]
  )

  useEffect(() => {
    void draw(false)
  }, [draw])

  const exportPng = async () => {
    // draw for export (maybe without on-screen-only guides)
    await draw(true)
    const c = canvasRef.current
    if (!c) return
    // re-draw once more for export state
    await draw(true)
    const blob: Blob | null = await new Promise((r) => c.toBlob((b) => r(b), 'image/png'))
    if (!blob) return
    // restore preview
    await draw(false)
    const base = name.replace(/\.[^.]+$/, '') || 'print'
    downloadBlob(blob, `${base}_bleed_${bleed}${unit}.png`)
  }

  return (
    <ToolShell
      icon={Frame}
      title="邊框 / 出血線"
      subtitle="印刷出血 · 裁切標記 · 安全區 · Scout System"
      accentClass="from-lime-500 to-green-600"
      actions={
        <button
          onClick={exportPng}
          disabled={!url}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-lime-500 text-slate-950 hover:bg-lime-400 disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" />
          匯出
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 h-fit max-h-[calc(100vh-11rem)] overflow-y-auto custom-scrollbar">
          <DropZone onFiles={load} label="上傳待印圖片" compact />
          {name && <p className="text-[11px] text-lime-300 truncate">{name}</p>}

          <div className="rounded-xl border border-lime-500/20 bg-lime-500/5 p-3 text-[11px] text-slate-400 leading-relaxed">
            <p className="text-lime-300 font-medium mb-1">印刷說明</p>
            出血（Bleed）讓裁切時不會露白邊。安全區內請放重要文字。預設 3mm 出血適合多數數位印刷。
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">單位</label>
            <div className="flex gap-0.5 p-0.5 rounded-lg bg-slate-950 border border-slate-700">
              {(['mm', 'px'] as Unit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-medium ${
                    unit === u ? 'bg-lime-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {unit === 'mm' && (
            <label className="text-[11px] text-slate-400 block">
              換算 DPI
              <input
                type="number"
                min={72}
                max={600}
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value) || 300)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
              />
            </label>
          )}

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>出血 Bleed</span>
              <span>
                {bleed}
                {unit} ≈ {toPx(bleed)}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={unit === 'mm' ? 10 : 80}
              step={unit === 'mm' ? 0.5 : 1}
              value={bleed}
              onChange={(e) => setBleed(Number(e.target.value))}
              className="w-full accent-lime-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>安全區 Safe</span>
              <span>
                {safe}
                {unit} ≈ {toPx(safe)}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={unit === 'mm' ? 20 : 120}
              step={unit === 'mm' ? 0.5 : 1}
              value={safe}
              onChange={(e) => setSafe(Number(e.target.value))}
              className="w-full accent-lime-500"
            />
          </div>

          <label className="flex items-center justify-between text-xs text-slate-300">
            延伸畫布 + 出血補邊
            <input
              type="checkbox"
              checked={extendBleed}
              onChange={(e) => setExtendBleed(e.target.checked)}
              className="accent-lime-500"
            />
          </label>
          <label className="flex items-center justify-between text-xs text-slate-300">
            裁切標記 Crop marks
            <input
              type="checkbox"
              checked={cropMarks}
              onChange={(e) => setCropMarks(e.target.checked)}
              className="accent-lime-500"
            />
          </label>
          <label className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1">
              {showGuides ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              預覽輔助線
            </span>
            <input
              type="checkbox"
              checked={showGuides}
              onChange={(e) => setShowGuides(e.target.checked)}
              className="accent-lime-500"
            />
          </label>
          <label className="flex items-center justify-between text-xs text-slate-300">
            匯出時保留輔助線
            <input
              type="checkbox"
              checked={exportGuides}
              onChange={(e) => setExportGuides(e.target.checked)}
              className="accent-lime-500"
            />
          </label>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-2 block">裝飾邊框</label>
            <div className="grid grid-cols-4 gap-1">
              {(
                [
                  ['none', '無'],
                  ['solid', '實線'],
                  ['double', '雙線'],
                  ['dashed', '虛線'],
                ] as [BorderStyle, string][]
              ).map(([s, label]) => (
                <button
                  key={s}
                  onClick={() => setBorderStyle(s)}
                  className={`rounded-md border px-1 py-1.5 text-[10px] ${
                    borderStyle === s
                      ? 'border-lime-400 bg-lime-500/20 text-lime-200'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {borderStyle !== 'none' && (
              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>粗細</span>
                  <span>{borderWidth}px</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={borderWidth}
                  onChange={(e) => setBorderWidth(Number(e.target.value))}
                  className="w-full accent-lime-500"
                />
                <label className="flex items-center justify-between text-xs text-slate-300">
                  邊框色
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                  />
                </label>
              </div>
            )}
          </div>

          <label className="flex items-center justify-between text-xs text-slate-300">
            出血底色
            <input type="color" value={padColor} onChange={(e) => setPadColor(e.target.value)} />
          </label>

          <button
            onClick={exportPng}
            disabled={!url}
            className="w-full rounded-xl bg-lime-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-lime-400 disabled:bg-slate-700 disabled:text-slate-400 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            匯出印刷 PNG
          </button>
          <p className="text-[10px] text-slate-600 text-center">
            匯出後可到 DPI 工具確認尺寸 · © Scout System
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col min-h-[420px]">
          <h2 className="text-sm font-semibold mb-3">預覽</h2>
          <div className="flex-1 flex items-center justify-center rounded-xl border border-slate-700 bg-[#0a0f1a] overflow-auto p-4">
            {url ? (
              <canvas ref={canvasRef} className="max-w-full max-h-[70vh] shadow-2xl bg-white" />
            ) : (
              <p className="text-sm text-slate-500 text-center px-4">
                上傳圖片後顯示出血、裁切與安全區輔助線
              </p>
            )}
          </div>
        </section>
      </div>
    </ToolShell>
  )
}
