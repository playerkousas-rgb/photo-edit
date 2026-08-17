import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './components/Home'
import SvgConverter from './tools/svg/SvgConverter'
import BackgroundTool from './tools/background/BackgroundTool'
import QrTool from './tools/qr/QrTool'
import DpiTool from './tools/dpi/DpiTool'
import ResizeTool from './tools/resize/ResizeTool'
import MosaicTool from './tools/mosaic/MosaicTool'
import WatermarkTool from './tools/watermark/WatermarkTool'
import BleedTool from './tools/bleed/BleedTool'
import CollageTool from './tools/collage/CollageTool'

/** Relief tool pulls in three.js — keep it out of the main bundle. */
const ReliefTool = lazy(() => import('./tools/relief/ReliefTool'))

function ToolFallback() {
  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500/40 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-xs text-slate-400">載入 3D 引擎…</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dpi" element={<DpiTool />} />
        <Route path="mosaic" element={<MosaicTool />} />
        <Route path="background" element={<BackgroundTool />} />
        <Route path="resize" element={<ResizeTool />} />
        <Route path="watermark" element={<WatermarkTool />} />
        <Route path="bleed" element={<BleedTool />} />
        <Route path="collage" element={<CollageTool />} />
        <Route
          path="relief"
          element={
            <Suspense fallback={<ToolFallback />}>
              <ReliefTool />
            </Suspense>
          }
        />
        <Route path="svg" element={<SvgConverter />} />
        <Route path="qrcode" element={<QrTool />} />
        <Route path="print" element={<Navigate to="/dpi" replace />} />
        <Route path="3d" element={<Navigate to="/relief" replace />} />
      </Route>
    </Routes>
  )
}
