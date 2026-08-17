import { useMemo, useState } from 'react'

type BackgroundMode = 'transparent' | 'solid' | 'gradient'

function BackgroundTool() {
  const [sourceImage, setSourceImage] = useState<string | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [cutoutImage, setCutoutImage] = useState<string | null>(null)
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('transparent')
  const [solidColor, setSolidColor] = useState('#0ea5e9')
  const [gradientA, setGradientA] = useState('#a78bfa')
  const [gradientB, setGradientB] = useState('#06b6d4')
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)

  const previewStyle = useMemo(() => {
    if (backgroundMode === 'solid') {
      return { background: solidColor }
    }
    if (backgroundMode === 'gradient') {
      return { background: `linear-gradient(120deg, ${gradientA}, ${gradientB})` }
    }
    return {
      backgroundImage:
        'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
      backgroundSize: '24px 24px',
      backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0',
      backgroundColor: '#f8fafc',
    }
  }, [backgroundMode, solidColor, gradientA, gradientB])

  const onUploadMain = (file?: File) => {
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

  const onUploadBackground = (file?: File) => {
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

      const threshold = 38
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

      avgR /= cornerSamples.length
      avgG /= cornerSamples.length
      avgB /= cornerSamples.length

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        const distance = Math.sqrt((r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2)
        if (distance < threshold) {
          data[i + 3] = 0
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

      if (backgroundImage) {
        const bg = new Image()
        bg.src = backgroundImage
        bg.onload = () => {
          ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)
          ctx.drawImage(subject, 0, 0)

          const link = document.createElement('a')
          link.download = `edited-${sourceName || 'image'}.png`
          link.href = canvas.toDataURL('image/png')
          link.click()
        }
      } else {
        ctx.drawImage(subject, 0, 0)
        const link = document.createElement('a')
        link.download = `edited-${sourceName || 'image'}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
    }
  }

  return (
    <div className="flex-1 bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-sm text-cyan-300">Scout System · Photo Tool</p>
          <h1 className="text-3xl font-bold sm:text-4xl">圖片去背 + 加入背景工具</h1>
          <p className="mt-2 text-slate-300">上傳圖片後，一鍵去除背景，再選擇純色、漸層或自訂背景圖輸出。</p>
          <p className="mt-1 text-xs text-slate-500">© 2026 Scout System. All rights reserved.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div>
              <label className="mb-2 block text-sm font-medium">1) 上傳主圖片</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onUploadMain(e.target.files?.[0])}
                className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm"
              />
            </div>

            <button
              onClick={removeBackgroundColor}
              disabled={!sourceImage}
              className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              2) 一鍵去背
            </button>

            <div className="space-y-2">
              <label className="text-sm font-medium">3) 背景模式</label>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {(['transparent', 'solid', 'gradient'] as BackgroundMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setBackgroundMode(mode)}
                    className={`rounded-md border px-2 py-1.5 capitalize transition ${
                      backgroundMode === mode
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {mode === 'transparent' ? '透明' : mode === 'solid' ? '純色' : '漸層'}
                  </button>
                ))}
              </div>
            </div>

            {backgroundMode === 'solid' && (
              <label className="flex items-center justify-between rounded-lg border border-slate-700 p-2 text-sm">
                背景顏色
                <input type="color" value={solidColor} onChange={(e) => setSolidColor(e.target.value)} />
              </label>
            )}

            {backgroundMode === 'gradient' && (
              <div className="space-y-2 rounded-lg border border-slate-700 p-3 text-sm">
                <label className="flex items-center justify-between">
                  漸層色 A
                  <input type="color" value={gradientA} onChange={(e) => setGradientA(e.target.value)} />
                </label>
                <label className="flex items-center justify-between">
                  漸層色 B
                  <input type="color" value={gradientB} onChange={(e) => setGradientB(e.target.value)} />
                </label>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">4) 上傳背景圖（可選）</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onUploadBackground(e.target.files?.[0])}
                className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-400">若有背景圖，輸出時會優先套用背景圖。</p>
            </div>

            <button
              onClick={downloadImage}
              disabled={!cutoutImage}
              className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              5) 下載 PNG
            </button>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="mb-3 text-lg font-semibold">即時預覽</h2>
            <div
              className="flex min-h-[500px] items-center justify-center overflow-hidden rounded-xl border border-slate-700"
              style={previewStyle}
            >
              {cutoutImage ? (
                <img
                  src={cutoutImage}
                  alt="preview"
                  className="max-h-[70vh] w-auto max-w-full object-contain"
                />
              ) : (
                <p className="px-4 text-center text-slate-500">請先上傳圖片，然後點擊「一鍵去背」。</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default BackgroundTool
