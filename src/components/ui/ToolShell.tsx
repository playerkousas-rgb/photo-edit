import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface ToolShellProps {
  icon: LucideIcon
  title: string
  subtitle: string
  accentClass?: string
  actions?: ReactNode
  children: ReactNode
  /** full-bleed workspace without max-width padding */
  fullBleed?: boolean
}

export default function ToolShell({
  icon: Icon,
  title,
  subtitle,
  accentClass = 'from-cyan-500 to-blue-600',
  actions,
  children,
  fullBleed = false,
}: ToolShellProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
      <div className="shrink-0 border-b border-white/5 bg-[#02133E]/60 backdrop-blur-xl">
        <div
          className={`flex items-center justify-between gap-4 px-4 sm:px-6 py-3 ${
            fullBleed ? '' : 'mx-auto max-w-7xl'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div
                className={`absolute -inset-1 bg-gradient-to-r ${accentClass} rounded-xl blur opacity-50`}
              />
              <div className="relative w-9 h-9 rounded-xl bg-[#02133E] border border-white/10 flex items-center justify-center">
                <Icon className="w-[18px] h-[18px] text-cyan-300" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate">
                {title}
              </h1>
              <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
      <div
        className={`flex-1 min-h-0 ${
          fullBleed ? '' : 'mx-auto w-full max-w-7xl px-4 sm:px-6 py-6'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
