import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Sparkles, Printer, Star } from 'lucide-react'
import { TOOLS } from '../lib/tools'

export default function Home() {
  const featured = TOOLS.find((t) => t.featured)
  const others = TOOLS.filter((t) => !t.featured)

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
            AI 圖轉列印、去背、裁切、向量化與 QR 一站完成。專為 Scout System 設計製作流程打造。
          </p>
        </motion.div>

        {/* Featured DPI — primary workflow */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-6"
          >
            <Link
              to={featured.to}
              className="group relative block rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-slate-900/80 p-6 sm:p-8 overflow-hidden hover:border-emerald-400/40 transition-all"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${featured.accent} flex items-center justify-center shadow-lg shadow-emerald-900/40 shrink-0`}
                >
                  <Printer className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3" />
                      最常用 · AI 圖轉列印
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {featured.label}
                    <span className="text-slate-500 font-normal text-sm ml-2">{featured.en}</span>
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-300 leading-relaxed max-w-xl">
                    {featured.desc} 支援批次、品質偵測、JPEG/PNG 雙格式與 Photoshop 相容 DPI 標籤。
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                    {['300 DPI 預設', 'A4 / 相紙預設', '品質評分', '批次匯出', 'pHYs 嵌入'].map(
                      (t) => (
                        <li
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10"
                        >
                          {t}
                        </li>
                      )
                    )}
                  </ul>
                </div>
                <div className="flex items-center gap-2 text-emerald-300 font-medium text-sm shrink-0 group-hover:translate-x-1 transition-transform">
                  開始使用
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          {others.map((tool, i) => (
            <motion.div
              key={tool.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.06 }}
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

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-10 rounded-2xl border border-white/5 bg-white/[0.02] p-5 sm:p-6"
        >
          <h3 className="text-sm font-semibold text-slate-200 mb-2">建議工作流 · AI 圖列印</h3>
          <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>
              <span className="text-slate-300">去背換底</span> — 去掉雜亂背景或換純色底
            </li>
            <li>
              <span className="text-slate-300">裁切縮放</span> — 對齊目標比例（1:1、A4…）
            </li>
            <li>
              <span className="text-slate-300">DPI 列印</span> — 設 300 DPI + 實際 cm，看品質燈號後匯出
            </li>
          </ol>
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
