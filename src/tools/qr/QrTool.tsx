import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { AppState } from './types';
import { defaultState } from './lib/defaults';
import ControlPanel from './components/ControlPanel';
import PreviewPanel from './components/PreviewPanel';

function QrTool() {
  const [state, setState] = useState<AppState>(defaultState);

  const handleStateChange = useCallback((newState: AppState) => {
    setState(newState);
  }, []);

  return (
    <div className="flex-1 bg-slate-950 text-white flex flex-col min-h-[calc(100vh-7.5rem)]">
      {/* Top Bar */}
      <header className="h-14 border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-xl flex items-center px-4 lg:px-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
              <rect x="3" y="3" width="6" height="6" rx="1" />
              <rect x="15" y="3" width="6" height="6" rx="1" />
              <rect x="3" y="15" width="6" height="6" rx="1" />
              <rect x="15" y="15" width="6" height="6" rx="1" />
              <rect x="10" y="3" width="2" height="2" rx="0.5" />
              <rect x="3" y="10" width="2" height="2" rx="0.5" />
              <rect x="10" y="10" width="2" height="2" rx="0.5" />
              <rect x="15" y="10" width="2" height="2" rx="0.5" />
              <rect x="19" y="10" width="2" height="2" rx="0.5" />
              <rect x="10" y="15" width="2" height="2" rx="0.5" />
              <rect x="10" y="19" width="2" height="2" rx="0.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">CodeCraft Pro</h1>
            <p className="text-[10px] text-slate-400 leading-tight">高度自定義編碼生成器 · Scout System</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[10px] text-slate-500 hidden sm:inline">即時預覽 · 高解析度導出 · SVG/PNG</span>
          <div className="w-px h-4 bg-slate-700 hidden sm:block" />
          <span className="text-[10px] text-slate-500 font-mono">© 2026 Scout System</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full lg:w-[380px] xl:w-[420px] border-r border-slate-800/60 bg-slate-900/30 backdrop-blur-sm flex flex-col"
        >
          <div className="flex-1 overflow-y-auto p-4 lg:p-5">
            <ControlPanel state={state} onChange={handleStateChange} />
          </div>
        </motion.aside>

        {/* Right Panel - Preview */}
        <motion.section
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
          className="flex-1 bg-slate-950 flex flex-col overflow-hidden"
        >
          <div className="flex-1 p-4 lg:p-6 xl:p-8 overflow-hidden">
            <PreviewPanel state={state} />
          </div>
        </motion.section>
      </main>
    </div>
  );
}

export default QrTool;
