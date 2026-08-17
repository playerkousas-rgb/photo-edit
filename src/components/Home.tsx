import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wand2,
  ImageMinus,
  QrCode,
  Ruler,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react'

const tools = [
  {
    to: '/svg',
    icon: Wand2,
    title: 'SVG 向量轉換',
    en: 'SVG Converter',
    desc: '將 PNG / JPEG 點陣圖轉換為高品質 SVG 向量，支援中心線與輪廓雙模式提取。',
    color: 'from-cyan-500 to-blue-600',
    glow: 'cyan',
  },
  {
    to: '/background',
    icon: ImageMinus,
    title: '去背 + 換背景',
    en: 'Background Remover',
    desc: '一鍵去除圖片背景，可套用透明、純色、漸層或自訂背景圖後輸出 PNG。',
    color: 'from-violet-500 to-purple-600',
    glow: 'violet',
  },
  {
    to: '/qrcode',
    icon: QrCode,
    title: 'QR Code / 條碼',
    en: 'CodeCraft Pro',
    desc: '高度自訂 QR Code 與條碼產生器，支援 WiFi、名片、地圖模板，SVG/PNG 導出。',
    color: 'from-rose-500 to-pink-600',
    glow: 'rose',
  },
  {
    to: '/dpi',
    icon: Ruler,
    title: 'DPI / 列印尺寸',
    en: 'DPI Maker',
    desc: '設定圖片 DPI 與實際列印尺寸（cm / inch），預覽並匯出符合印刷規格的圖片。',
    color: 'from-emerald-500 to-teal-600',
    glow: 'emerald',
  },
]

export default function Home() {
  return (
    <div className="relative flex-1 overflow-auto">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Scout System Design Tools
          </div>
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 rounded-2xl blur-xl" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-white/10 flex items-center justify-center backdrop-blur-xl">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
            Photo Edit{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Toolkit
            </span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
            整合 SVG 轉換、去背換底、QR Code 產生與 DPI 列印設定的多合一圖像工具箱。
          </p>
        </motion.div>

        {/* Tool cards */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.to}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            >
              <Link
                to={tool.to}
                className="group relative block h-full rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 p-6 transition-all"
              >
                <div
                  className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-[0.07] transition-opacity pointer-events-none`}
                />
                <div className="relative flex flex-col h-full">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <tool.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight">
                        {tool.title}
                      </h2>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {tool.en}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed flex-1">
                    {tool.desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Copyright block */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="w-4 h-4 text-cyan-500" />
              <span className="text-sm font-semibold tracking-wide">
                Scout System
              </span>
            </div>
            <p className="text-xs text-slate-500">
              © 2026 Scout System. All rights reserved.
            </p>
            <p className="text-[10px] text-slate-600 max-w-sm">
              本工具集由 Scout System 開發與維護，僅供童軍及相關教育用途使用。
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
