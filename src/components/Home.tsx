import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Sparkles, Printer, Star, ScanFace } from 'lucide-react'
import { TOOLS } from '../lib/tools'

export default function Home() {
  const featured = TOOLS.find((t) => t.featured)
  const mosaic = TOOLS.find((t) => t.id === 'mosaic')
  const others = TOOLS.filter((t) => !t.featured && t.id !== 'mosaic')

  return (
    <div className="relative flex-1 overflow-auto">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Scout System Design Tools
          </div>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-cyan-600/30 to-emerald-600/30 rounded-2xl blur-xl" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-white/10 flex items-center justify-center">
                <Shield className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Photo Edit{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Toolkit
            </span>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
            列印、私隱打碼、去背、拼圖、出血與向量工具一站完成。
          </p>
        </motion.div>

        {/* Featured row */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Link
                to={featured.to}
                className="group relative block h-full rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-slate-900/80 p-5 sm:p-6 overflow-hidden hover:border-emerald-400/40 transition-all"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent pointer-events-none" />
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${featured.accent} flex items-center justify-center shadow-lg mb-3`}
                  >
                    <Printer className="w-6 h-6 text-white" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full mb-2">
                    <Star className="w-3 h-3" />
                    最常用 · 列印
                  </span>
                  <h2 className="text-xl font-bold">{featured.label}</h2>
                  <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">{featured.desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-emerald-300 text-sm font-medium group-hover:translate-x-0.5 transition-transform">
                    開始使用 <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {mosaic && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Link
                to={mosaic.to}
                className="group relative block h-full rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-500/10 via-slate-900/80 to-slate-900/80 p-5 sm:p-6 overflow-hidden hover:border-sky-400/40 transition-all"
              >
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mosaic.accent} flex items-center justify-center shadow-lg mb-3`}
                  >
                    <ScanFace className="w-6 h-6 text-white" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-sky-300 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-full mb-2">
                    私隱保護
                  </span>
                  <h2 className="text-xl font-bold">{mosaic.label}</h2>
                  <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">{mosaic.desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-sky-300 text-sm font-medium group-hover:translate-x-0.5 transition-transform">
                    框選打碼 <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {others.map((tool, i) => (
            <motion.div
              key={tool.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.04 }}
            >
              <Link
                to={tool.to}
                className="group relative block h-full rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 p-5 transition-all"
              >
                <div
                  className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${tool.accent} opacity-0 group-hover:opacity-[0.07] transition-opacity pointer-events-none`}
                />
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.accent} flex items-center justify-center mb-3 shadow-md`}
                  >
                    <tool.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h2 className="text-base font-semibold">{tool.label}</h2>
                      <p className="text-[10px] text-slate-500 font-mono">{tool.en}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all mt-1" />
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{tool.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 rounded-2xl border border-white/5 bg-white/[0.02] p-5 sm:p-6"
        >
          <h3 className="text-sm font-semibold text-slate-200 mb-2">建議工作流</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-xs text-slate-400 leading-relaxed">
            <div>
              <p className="text-slate-300 font-medium mb-1">活動相上網</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>馬賽克 — 框選小朋友臉部</li>
                <li>裁切 / 拼圖 — 整理版面</li>
                <li>浮水印 — 自行填寫版權字</li>
              </ol>
            </div>
            <div>
              <p className="text-slate-300 font-medium mb-1">AI 圖印刷</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>去背 / 裁切 — 清底與比例</li>
                <li>邊框出血 — 3mm bleed + 裁切標記</li>
                <li>DPI 列印 — 300 DPI 匯出 PNG</li>
              </ol>
            </div>
          </div>
        </motion.div>

        <div className="mt-12 text-center">
          <div className="inline-flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="w-4 h-4 text-cyan-500" />
              <span className="text-sm font-semibold">Scout System</span>
            </div>
            <p className="text-xs text-slate-500">© 2026 Scout System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
