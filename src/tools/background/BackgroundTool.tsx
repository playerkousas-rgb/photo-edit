import { useMemo, useState, type CSSProperties } from 'react'
import { Download, ImageMinus, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import ToolShell from '../../components/ui/ToolShell'
import DropZone from '../../components/ui/DropZone'

type BackgroundMode = 'transparent' | 'solid' | 'gradient'

export default function BackgroundTool() {
  const [sourceImage, setSourceImage] = useState<string | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [cutoutImage, setCutoutImage] = useState<string | null>(null)
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('transparent')
  const [solidColor, setSolidColor] = useState('#0ea5e9')
  const [gradientA, setGradientA] = useState('#a78bfa')
  const [gradientB, setGradientB] = useState('#06b6d4')
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [threshold, setThreshold] = useState(38)
  const [feather, setFeather] = useState(0)

  const previewStyle = useMemo(() => {
    if (backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } as CSSProperties
    }
    if (backgroundMode === 'solid') return { background: solidColor }
    if (backgroundMode === 'gradient') {
      return { background: `linear-gradient(120deg, ${gradientA}, ${gradientB})` }
    }
    return {
      backgroundImage:
        'linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)',
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
      backgroundColor: '#1e293b',
    }
  }, [backgroundMode, solidColor, gradientA, gradientB, backgroundImage])

  const onUploadMain = (files: File[]) => {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setSourceImage(result)
      setCutoutImage(result)
      setSourceName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const onUploadBackground = (files: File[]) => {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setBackgroundImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const removeBackgroundColor = () => {
    if (!sourceImage) return
    const image = new Image()
    image.src = sourceImage
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(image, 0, 0)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imgData.data

      const cornerSamples = [
        [0, 0],
        [canvas.width - 1, 0],
        [0, canvas.height - 1],
        [canvas.width - 1, canvas.height - 1],
      ]
      let avgR = 0
      let avgG = 0
      let avgB = 0
      cornerSamples.forEach(([x, y]) => {
        const i = (y * canvas.width + x) * 4
        avgR += data[i]
        avgG += data[i + 1]
        avgB += data[i + 2]
      })
      avgR /= 4
      avgG /= 4
      avgB /= 4

      const thr = threshold
      const soft = feather
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const distance = Math.sqrt((r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2)
        if (distance < thr) {
          data[i + 3] = 0
        } else if (soft > 0 && distance < thr + soft) {
          const t = (distance - thr) / soft
          data[i + 3] = Math.round(data[i + 3] * t)
        }
      }
      ctx.putImageData(imgData, 0, 0)
      setCutoutImage(canvas.toDataURL('image/png'))
    }
  }

  const downloadImage = () => {
    if (!cutoutImage) return
    const subject = new Image()
    subject.src = cutoutImage
    subject.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = subject.width
      canvas.height = subject.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const finish = () => {
        ctx.drawImage(subject, 0, 0)
        const link = document.createElement('a')
        link.download = `cutout-${sourceName || 'image'}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }

      if (backgroundImage) {
        const bg = new Image()
        bg.src = backgroundImage
        bg.onload = () => {
          ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)
          finish()
        }
        return
      }

      if (backgroundMode === 'solid') {
        ctx.fillStyle = solidColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      } else if (backgroundMode === 'gradient') {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        grad.addColorStop(0, gradientA)
        grad.addColorStop(1, gradientB)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      finish()
    }
  }

  return (
    <ToolShell
      icon={ImageMinus}
      title="去背 + 換背景"
      subtitle="一鍵去背 · 純色 / 漸層 / 背景圖 · Scout System"
      accentClass="from-violet-500 to-purple-600"
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/dpi"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
          >
            <Link2 className="w-3.5 h-3.5" />
            接著設 DPI
          </Link>
          <button
            onClick={downloadImage}
            disabled={!cutoutImage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            下載 PNG
          </button>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 h-fit">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-300 uppercase tracking-wider">
              主圖片
            </label>
            <DropZone onFiles={onUploadMain} label="上傳要去背的圖片" compact />
            {sourceName && (
              <p className="mt-1.5 text-[11px] text-violet-300 truncate">{sourceName}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>去背靈敏度</span>
              <span>{threshold}</span>
            </div>
            <input
              type="range"
              min={10}
              max={120}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mb-1 mt-2">
              <span>邊緣柔化</span>
              <span>{feather}</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={feather}
              onChange={(e) => setFeather(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>

          <button
            onClick={removeBackgroundColor}
            disabled={!sourceImage}
            className="w-full rounded-xl bg-violet-500 px-4 py-2.5 font-semibold text-white text-sm hover:bg-violet-400 disabled:bg-slate-700 disabled:text-slate-400"
          >
            一鍵去背（取四角色）
          </button>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
              背景模式
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(['transparent', 'solid', 'gradient'] as BackgroundMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setBackgroundMode(mode)
                    if (mode !== 'transparent') setBackgroundImage(null)
                  }}
                  className={`rounded-md border px-2 py-1.5 transition ${
                    backgroundMode === mode && !backgroundImage
                      ? 'border-violet-400 bg-violet-500/20 text-violet-200'
                      : 'border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {mode === 'transparent' ? '透明' : mode === 'solid' ? '純色' : '漸層'}
                </button>
              ))}
            </div>
          </div>

          {backgroundMode === 'solid' && !backgroundImage && (
            <label className="flex items-center justify-between rounded-lg border border-slate-700 p-2 text-sm">
              背景顏色
              <input
                type="color"
                value={solidColor}
                onChange={(e) => setSolidColor(e.target.value)}
              />
            </label>
          )}

          {backgroundMode === 'gradient' && !backgroundImage && (
            <div className="space-y-2 rounded-lg border border-slate-700 p-3 text-sm">
              <label className="flex items-center justify-between">
                漸層色 A
                <input
                  type="color"
                  value={gradientA}
                  onChange={(e) => setGradientA(e.target.value)}
                />
              </label>
              <label className="flex items-center justify-between">
                漸層色 B
                <input
                  type="color"
                  value={gradientB}
                  onChange={(e) => setGradientB(e.target.value)}
                />
              </label>
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-300 uppercase tracking-wider">
              背景圖（可選）
            </label>
            <DropZone onFiles={onUploadBackground} label="上傳背景圖" compact />
            {backgroundImage && (
              <button
                onClick={() => setBackgroundImage(null)}
                className="mt-1 text-[11px] text-slate-500 hover:text-rose-400"
              >
                移除背景圖
              </button>
            )}
          </div>

          <button
            onClick={downloadImage}
            disabled={!cutoutImage}
            className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 font-semibold text-slate-950 text-sm hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            下載 PNG
          </button>
          <p className="text-[10px] text-slate-600 text-center">
            提示：去背後可到 DPI 工具設定列印尺寸 · © Scout System
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="mb-3 text-sm font-semibold">即時預覽</h2>
          <div
            className="flex min-h-[480px] items-center justify-center overflow-hidden rounded-xl border border-slate-700"
            style={previewStyle}
          >
            {cutoutImage ? (
              <img
                src={cutoutImage}
                alt="preview"
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            ) : (
              <p className="px-4 text-center text-slate-500 text-sm">
                上傳圖片後調整靈敏度，再點「一鍵去背」。
              </p>
            )}
          </div>
        </section>
      </div>
    </ToolShell>
  )
}
