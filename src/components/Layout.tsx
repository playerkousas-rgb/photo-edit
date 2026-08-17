import { NavLink, Outlet } from 'react-router-dom'
import {
  Wand2,
  ImageMinus,
  QrCode,
  Ruler,
  Home,
  Shield,
} from 'lucide-react'

const navItems = [
  { to: '/', label: '首頁', icon: Home, end: true },
  { to: '/svg', label: 'SVG 轉換', icon: Wand2 },
  { to: '/background', label: '去背工具', icon: ImageMinus },
  { to: '/qrcode', label: 'QR / 條碼', icon: QrCode },
  { to: '/dpi', label: 'DPI 工具', icon: Ruler },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top navigation */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#02133E]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between gap-4">
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

            <nav className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="hidden lg:block text-[10px] text-slate-500 font-mono shrink-0">
              © 2026 Scout System
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </main>

      {/* Global footer */}
      <footer className="border-t border-white/5 bg-black/30 py-3 px-4">
        <div className="mx-auto max-w-[1600px] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <p>
            © 2026 <span className="text-slate-400 font-medium">Scout System</span>. All rights reserved.
          </p>
          <p className="text-slate-600">
            SVG Converter · Background Remover · QR Code · DPI Maker
          </p>
        </div>
      </footer>
    </div>
  )
}
