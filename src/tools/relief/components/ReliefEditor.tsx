import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Box,
  Download,
  Eye,
  Image as ImageIcon,
  Layers,
  Maximize2,
  RotateCcw,
  Settings2,
  TriangleRight,
} from 'lucide-react'
import { downloadBlob } from '../../../lib/pngDpi'
import { ThreePreview } from './ThreePreview'
import ParameterPanel from './ParameterPanel'
import { useReliefMesh } from '../hooks/useReliefMesh'
import { DEFAULT_RELIEF_PARAMS, RELIEF_PRESETS, type ReliefParams } from '../lib/types'

interface ReliefEditorProps {
  /** Data URL of the uploaded image. */
  imageData: string
  fileName: string
}

/**
 * Workspace shown once an image is loaded: live 3D relief preview on the left,
 * parameter + export panel on the right.
 */
export default function ReliefEditor({ imageData, fileName }: ReliefEditorProps) {
  const [params, setParams] = useState<ReliefParams>(DEFAULT_RELIEF_PARAMS)
  const [showPanel, setShowPanel] = useState(true)
  const [showOriginal, setShowOriginal] = useState(false)
  const [wireframe, setWireframe] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const { meshData, isProcessing, imageInfo } = useReliefMesh(imageData, params)

  const baseName = useMemo(() => fileName.replace(/\.[^.]+$/, '') || 'relief', [fileName])

  const exportSTL = useCallback(async () => {
    if (!meshData) return
    setIsExporting(true)
    try {
      const { generateSTL } = await import('../lib/stlExporter')
      const buffer = generateSTL(meshData)
      downloadBlob(new Blob([buffer], { type: 'model/stl' }), `${baseName}_relief.stl`)
    } finally {
      setIsExporting(false)
    }
  }, [meshData, baseName])

  const exportOBJ = useCallback(async () => {
    if (!meshData) return
    setIsExporting(true)
    try {
      const { generateOBJ } = await import('../lib/objExporter')
      const obj = generateOBJ(meshData)
      downloadBlob(new Blob([obj], { type: 'text/plain' }), `${baseName}_relief.obj`)
    } finally {
      setIsExporting(false)
    }
  }, [meshData, baseName])

  const exportHeightMap = useCallback(async () => {
    setIsExporting(true)
    try {
      const { generateHeightMapPNG } = await import('../lib/heightMapExporter')
      const blob = await generateHeightMapPNG(imageData, params)
      downloadBlob(blob, `${baseName}_heightmap.png`)
    } finally {
      setIsExporting(false)
    }
  }, [imageData, params, baseName])

  const stats = useMemo(() => {
    if (!meshData) return null
    return {
      verts: meshData.vertices.length / 3,
      tris: meshData.indices.length / 3,
      size: `${meshData.physWidth.toFixed(1)} \u00d7 ${meshData.physHeight.toFixed(
        1
      )} \u00d7 ${meshData.maxZ.toFixed(1)} mm`,
      stlMb: ((meshData.indices.length / 3) * 50 + 84) / 1024 / 1024,
    }
  }, [meshData])

  const reset = () => {
    setParams(DEFAULT_RELIEF_PARAMS)
    setActivePreset(null)
  }

  return (
  <div className="h-[calc(100vh-11rem)] min-h-[520px] flex flex-col md:flex-row overflow-hidden">
    {/* 3D preview */}
    <div className="flex-1 relative min-h-0 min-w-0 bg-[#02133E]">
      <ThreePreview meshData={meshData} isProcessing={isProcessing} wireframe={wireframe} />

      <div className="absolute top-3 right-3 flex gap-1.5 z-10">
        {[
          {
            on: wireframe,
            onClick: () => setWireframe((v) => !v),
            icon: TriangleRight,
            title: '線框模式',
          },
          {
            on: showOriginal,
            onClick: () => setShowOriginal((v) => !v),
            icon: ImageIcon,
            title: '顯示原圖',
          },
          {
            on: showPanel,
            onClick: () => setShowPanel((v) => !v),
            icon: Settings2,
            title: '參數面板',
          },
        ].map(({ on, onClick, icon: Icon, title }) => (
          <button
            key={title}
            onClick={onClick}
            title={title}
            className={`p-2 rounded-lg border backdrop-blur-md transition-all ${
              on
                ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showOriginal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-3 left-3 max-w-[200px] rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-slate-900 z-10"
          >
            <div className="px-2 py-1 bg-white/5 text-[10px] text-slate-400 flex items-center gap-1">
              <ImageIcon size={10} />
              原始圖片
            </div>
            <img src={imageData} alt="Original" className="w-full h-auto block" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 pointer-events-none z-10">
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-slate-300">
              <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              處理中…
            </div>
          ) : (
            imageInfo && (
              <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-400">
                <Eye size={11} />
                {imageInfo.width}×{imageInfo.height}px
              </div>
            )
          )}
        </div>
        {stats && !isProcessing && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-400">
              <Maximize2 size={10} />
              {stats.size}
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-400">
              <Box size={10} />
              {(stats.verts / 1000).toFixed(1)}K 頂點 · {(stats.tris / 1000).toFixed(1)}K 面
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Parameters */}
    {showPanel && (
      <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-white/5 bg-slate-950/80 overflow-y-auto custom-scrollbar max-h-[45vh] md:max-h-full">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Settings2 size={14} className="text-cyan-400" />
              浮雕參數
            </h3>
            <button
              onClick={reset}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw size={11} />
              重設
            </button>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {RELIEF_PRESETS.map((preset) => {
              const Icon = preset.icon
              const on = activePreset === preset.id
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setParams(preset.params)
                    setActivePreset(preset.id)
                  }}
                  className={`flex flex-col items-start gap-0.5 p-2 rounded-lg border text-left transition-all ${
                    on
                      ? 'bg-cyan-500/15 border-cyan-400/40'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-200">
                    <Icon size={12} className={on ? 'text-cyan-300' : 'text-slate-500'} />
                    {preset.label}
                  </span>
                  <span className="text-[9px] text-slate-500">{preset.description}</span>
                </button>
              )
            })}
          </div>

          <ParameterPanel
            params={params}
            onChange={(p) => {
              setParams(p)
              setActivePreset(null)
            }}
          />

          {/* Export */}
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
              <Download size={10} className="text-cyan-400" />
              匯出檔案
            </p>
            <button
              onClick={exportSTL}
              disabled={!meshData || isExporting || isProcessing}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  匯出中…
                </>
              ) : (
                <>
                  <Layers size={15} />
                  匯出 STL（3D 列印）
                </>
              )}
            </button>
            <button
              onClick={exportOBJ}
              disabled={!meshData || isExporting || isProcessing}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-medium text-xs transition-all bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={13} />
              匯出 OBJ 檔案
            </button>
            <button
              onClick={exportHeightMap}
              disabled={isExporting || isProcessing}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-medium text-xs transition-all bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ImageIcon size={13} />
              匯出高度圖 PNG
            </button>
            {stats && (
              <p className="text-[10px] text-slate-600 text-center pt-1">
                STL 檔案大小估計：~{stats.stlMb.toFixed(1)} MB
              </p>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
  )
}
