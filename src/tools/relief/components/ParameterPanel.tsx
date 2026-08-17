import { useCallback, useState, type ComponentType } from 'react'
import {
  Ruler,
  Mountain,
  Grid3x3,
  Blend,
  FlipHorizontal2,
  FlipVertical2,
  ArrowDownUp,
  ChevronDown,
  Sun,
  Contrast,
  Sigma,
  Sparkles,
  Layers,
  ChevronsUpDown,
  Box,
  ScanLine,
} from 'lucide-react'
import type { ReliefParams } from '../lib/types'

interface ParameterPanelProps {
  params: ReliefParams
  onChange: (params: ReliefParams) => void
}

type IconType = ComponentType<{ size?: number; className?: string }>

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon: IconType
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-1 border-b border-white/5 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 px-1 group"
        type="button"
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-cyan-400" />
          <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white transition-colors tracking-wide uppercase">
            {title}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="pb-3 px-1">{children}</div>}
    </div>
  )
}

function SliderParam({
  label,
  icon: Icon,
  value,
  min,
  max,
  step,
  unit,
  description,
  onChange,
}: {
  label: string
  icon: IconType
  value: number
  min: number
  max: number
  step: number
  unit: string
  description?: string
  onChange: (v: number) => void
}) {
  const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0
  return (
    <div className="mb-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className="text-slate-500" />
          <span className="text-[11px] font-medium text-slate-300">{label}</span>
        </div>
        <span className="text-[11px] font-mono text-cyan-300 tabular-nums">
          {value.toFixed(decimals)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full bg-slate-800"
      />
      {description && (
        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{description}</p>
      )}
    </div>
  )
}

function ToggleParam({
  label,
  icon: Icon,
  value,
  description,
  onChange,
}: {
  label: string
  icon: IconType
  value: boolean
  description?: string
  onChange: (v: boolean) => void
}) {
  return (
    <div className="mb-2.5">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="w-full flex items-center justify-between cursor-pointer group py-0.5"
      >
        <div className="flex items-center gap-1.5">
          <Icon size={12} className="text-slate-500" />
          <span className="text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors">
            {label}
          </span>
        </div>
        <div
          className={`w-8 h-[18px] rounded-full transition-all relative shrink-0 ${
            value
              ? 'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.35)]'
              : 'bg-slate-800 border border-slate-700'
          }`}
        >
          <div
            className={`absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all shadow-sm ${
              value ? 'translate-x-[14px] bg-white' : 'translate-x-[2px] bg-slate-500'
            }`}
          />
        </div>
      </button>
      {description && (
        <p className="text-[10px] text-slate-500 mt-1 ml-[22px] leading-relaxed">{description}</p>
      )}
    </div>
  )
}

export default function ParameterPanel({ params, onChange }: ParameterPanelProps) {
  const update = useCallback(
    (key: keyof ReliefParams, value: number | boolean) => {
      onChange({ ...params, [key]: value })
    },
    [params, onChange]
  )

  return (
    <div>
      {/* === GEOMETRY === */}
      <Section title="幾何尺寸" icon={Box}>
        <SliderParam
          label="浮雕深度"
          icon={Mountain}
          value={params.depth}
          min={0.5}
          max={15}
          step={0.1}
          unit="mm"
          description="浮雕最高點與底板之間的高度差"
          onChange={(v) => update('depth', v)}
        />
        <SliderParam
          label="底板厚度"
          icon={Layers}
          value={params.baseThickness}
          min={0.3}
          max={8}
          step={0.1}
          unit="mm"
          description="模型底部平板的厚度"
          onChange={(v) => update('baseThickness', v)}
        />
        <SliderParam
          label="輸出寬度"
          icon={Ruler}
          value={params.width}
          min={10}
          max={250}
          step={1}
          unit="mm"
          description="最終列印模型的實際寬度"
          onChange={(v) => update('width', v)}
        />
        <SliderParam
          label="網格解析度"
          icon={Grid3x3}
          value={params.resolution}
          min={50}
          max={600}
          step={10}
          unit="px"
          description="越高越精細，但檔案越大、處理越慢"
          onChange={(v) => update('resolution', v)}
        />
        <SliderParam
          label="邊緣緩降"
          icon={ScanLine}
          value={params.edgeFade}
          min={0}
          max={20}
          step={1}
          unit="%"
          description="讓浮雕在外框逐漸回到底板，減少邊緣高牆與列印瑕疵"
          onChange={(v) => update('edgeFade', v)}
        />
      </Section>

      {/* === IMAGE PROCESSING === */}
      <Section title="影像處理" icon={Sparkles}>
        <SliderParam
          label="亮度"
          icon={Sun}
          value={params.brightness}
          min={-50}
          max={50}
          step={1}
          unit="%"
          description="調整整體明暗"
          onChange={(v) => update('brightness', v)}
        />
        <SliderParam
          label="對比度"
          icon={Contrast}
          value={params.contrast}
          min={-50}
          max={100}
          step={1}
          unit="%"
          description="增強明暗差異可讓浮雕更立體"
          onChange={(v) => update('contrast', v)}
        />
        <SliderParam
          label="Gamma 曲線"
          icon={Sigma}
          value={params.gamma}
          min={0.2}
          max={3.0}
          step={0.05}
          unit=""
          description="< 1.0 提亮暗部，> 1.0 壓暗亮部"
          onChange={(v) => update('gamma', v)}
        />
        <SliderParam
          label="平滑度"
          icon={Blend}
          value={params.smoothing}
          min={0}
          max={10}
          step={1}
          unit=" 次"
          description="高斯模糊次數，減少雜訊與列印瑕疵"
          onChange={(v) => update('smoothing', v)}
        />
        <SliderParam
          label="銳化強度"
          icon={Sparkles}
          value={params.sharpen}
          min={0}
          max={5}
          step={0.1}
          unit=""
          description="增強邊緣細節，讓浮雕輪廓更清晰"
          onChange={(v) => update('sharpen', v)}
        />
        <ToggleParam
          label="自動高度拉伸"
          icon={ChevronsUpDown}
          value={params.autoNormalize}
          description="自動使用完整高度範圍；關閉後亮度／對比會更忠實保留原圖明暗"
          onChange={(v) => update('autoNormalize', v)}
        />
      </Section>

      {/* === TRANSFORMS === */}
      <Section title="翻轉與反轉" icon={ChevronsUpDown}>
        <ToggleParam
          label="反轉灰階深度"
          icon={ArrowDownUp}
          value={params.invertDepth}
          description="亮暗互換：原本亮的變低、暗的變高"
          onChange={(v) => update('invertDepth', v)}
        />
        <ToggleParam
          label="凹凸反轉"
          icon={ChevronsUpDown}
          value={params.invertRelief}
          description="將凸起的浮雕變成凹陷（印章／模具模式）"
          onChange={(v) => update('invertRelief', v)}
        />
        <div className="h-px bg-white/5 my-2" />
        <ToggleParam
          label="水平鏡像"
          icon={FlipHorizontal2}
          value={params.mirrorX}
          description="左右翻轉（做印章時需要鏡射）"
          onChange={(v) => update('mirrorX', v)}
        />
        <ToggleParam
          label="垂直翻轉"
          icon={FlipVertical2}
          value={params.mirrorY}
          description="上下翻轉圖片"
          onChange={(v) => update('mirrorY', v)}
        />
      </Section>

      {/* Tips */}
      <div className="mx-1 mt-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          💡 <strong className="text-slate-300">使用提示</strong>
          <br />
          • 較亮區域會產生較高的浮雕
          <br />
          • 「凹凸反轉」適合製作印章或模具
          <br />
          • 建議先調對比度與 Gamma，再調平滑
          <br />
          • 開啟「邊緣緩降」可降低外框突兀高牆
          <br />• 高解析度（400+）較精細但處理較慢
        </p>
      </div>
    </div>
  )
}
