import { NavLink, Outlet } from 'react-router-dom'
import { Home, Shield } from 'lucide-react'
import { TOOLS } from '../lib/tools'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#02133E]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-3 sm:px-5">
          <div className="h-13 sm:h-14 flex items-center justify-between gap-3">
            <NavLink to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg blur opacity-50 group-hover:opacity-70 transition-opacity" />
                <div className="relative w-8 h-8 rounded-lg bg-[#02133E] border border-white/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold tracking-tight leading-tight">
                  Scout System
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Photo Edit Toolkit
                </div>
              </div>
            </NavLink>

            <nav className="flex-1 flex items-center gap-0.5 overflow-x-auto custom-scrollbar min-w-0 px-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? 'bg-white/10 text-white border border-white/15'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">首頁</span>
              </NavLink>

              {TOOLS.map(({ to, shortLabel, icon: Icon, featured, id }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={shortLabel}
                  className={({ isActive }) =>
                    `relative flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 ${
                      isActive
                        ? featured
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                          : id === 'mosaic'
                            ? 'bg-sky-500/15 text-sky-300 border border-sky-500/35'
                            : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{shortLabel}</span>
                </NavLink>
              ))}
            </nav>

            <div className="hidden xl:block text-[10px] text-slate-500 font-mono shrink-0">
              © 2026 Scout System
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </main>

      <footer className="shrink-0 border-t border-white/5 bg-black/40 py-2.5 px-4">
        <div className="mx-auto max-w-[1600px] flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-slate-500">
          <p>
            © 2026{' '}
            <span className="text-slate-400 font-medium">Scout System</span>. All rights
            reserved.
          </p>
          <p className="text-slate-600 text-center">
            DPI · 馬賽克 · 去背 · 拼圖 · 出血 · 浮水印 · SVG · QR
          </p>
        </div>
      </footer>
    </div>
  )
}
