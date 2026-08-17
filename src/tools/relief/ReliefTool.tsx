import { useCallback, useState } from 'react'
import { Boxes, Upload, X } from 'lucide-react'
import ToolShell from '../../components/ui/ToolShell'
import DropZone from '../../components/ui/DropZone'
import ReliefEditor from './components/ReliefEditor'

interface LoadedImage {
  data: string
  name: string
}

const USE_CASES = [
  { t: '相片浮雕', d: '團體相、紀念相變成立體掛牌' },
  { t: '徽章 / Logo', d: '旅團徽號做襟章、紀念牌' },
  { t: '印章模具', d: '凹凸反轉 + 水平鏡像即成印章' },
]

export default function ReliefTool() {
  const [image, setImage] = useState<LoadedImage | null>(null)

  const handleFiles = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage({ data: String(reader.result), name: file.name })
    reader.readAsDataURL(file)
  }, [])

  return (
    <ToolShell
      icon={Boxes}
      title="浮雕 3D"
      subtitle="相片／Logo → 灰階高度圖 → 可 3D 列印的 STL / OBJ 浮雕"
      accentClass="from-indigo-500 to-violet-600"
      fullBleed
      actions={
        image ? (
          <button
            onClick={() => setImage(null)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            換圖
          </button>
        ) : undefined
      }
    >
      {image ? (
        // Remount on a new image so parameters start from the defaults again.
        <ReliefEditor key={image.data.slice(0, 64)} imageData={image.data} fileName={image.name} />
      ) : (
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-10">
          <DropZone onFiles={handleFiles} accept="image/*" className="py-14">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl blur opacity-40" />
                <div className="relative w-14 h-14 rounded-2xl bg-[#02133E] border border-white/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-indigo-300" />
                </div>
              </div>
              <p className="text-sm text-slate-200 font-medium">拖放或點擊上傳圖片</p>
              <p className="text-[11px] text-slate-500">
                PNG / JPG / WebP · 亮的地方變高、暗的地方變低
              </p>
            </div>
          </DropZone>

          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            {USE_CASES.map((c) => (
              <div key={c.t} className="rounded-xl border border-white/5 bg-slate-900/60 p-3">
                <p className="text-xs font-semibold text-slate-200">{c.t}</p>
                <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[11px] text-slate-600 leading-relaxed text-center">
            全部運算在瀏覽器完成，圖片不會上傳到任何伺服器。
          </p>
        </div>
      )}
    </ToolShell>
  )
}
