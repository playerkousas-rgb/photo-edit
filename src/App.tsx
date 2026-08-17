import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './components/Home'
import SvgConverter from './tools/svg/SvgConverter'
import BackgroundTool from './tools/background/BackgroundTool'
import QrTool from './tools/qr/QrTool'
import DpiTool from './tools/dpi/DpiTool'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="svg" element={<SvgConverter />} />
        <Route path="background" element={<BackgroundTool />} />
        <Route path="qrcode" element={<QrTool />} />
        <Route path="dpi" element={<DpiTool />} />
      </Route>
    </Routes>
  )
}
