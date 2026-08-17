import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './components/Home'
import SvgConverter from './tools/svg/SvgConverter'
import BackgroundTool from './tools/background/BackgroundTool'
import QrTool from './tools/qr/QrTool'
import DpiTool from './tools/dpi/DpiTool'
import ResizeTool from './tools/resize/ResizeTool'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dpi" element={<DpiTool />} />
        <Route path="background" element={<BackgroundTool />} />
        <Route path="resize" element={<ResizeTool />} />
        <Route path="svg" element={<SvgConverter />} />
        <Route path="qrcode" element={<QrTool />} />
        {/* legacy aliases */}
        <Route path="print" element={<Navigate to="/dpi" replace />} />
      </Route>
    </Routes>
  )
}
