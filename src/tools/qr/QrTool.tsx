import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { QrCode } from 'lucide-react';
import type { AppState } from './types';
import { defaultState } from './lib/defaults';
import ControlPanel from './components/ControlPanel';
import PreviewPanel from './components/PreviewPanel';
import ToolShell from '../../components/ui/ToolShell';

export default function QrTool() {
  const [state, setState] = useState<AppState>(defaultState);

  const handleStateChange = useCallback((newState: AppState) => {
    setState(newState);
  }, []);

  return (
    <ToolShell
      icon={QrCode}
      title="QR Code / 條碼"
      subtitle="高度自訂編碼 · SVG/PNG 導出 · Scout System"
      accentClass="from-rose-500 to-pink-600"
      fullBleed
    >
      <div className="flex-1 bg-slate-950 text-white flex h-[calc(100vh-8.5rem)] overflow-hidden">
        <motion.aside
          initial={{ x: -12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="w-full lg:w-[380px] xl:w-[420px] border-r border-slate-800/60 bg-slate-900/30 flex flex-col"
        >
          <div className="flex-1 overflow-y-auto p-4 lg:p-5 custom-scrollbar">
            <ControlPanel state={state} onChange={handleStateChange} />
          </div>
        </motion.aside>

        <motion.section
          initial={{ x: 12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="flex-1 bg-slate-950 flex flex-col overflow-hidden"
        >
          <div className="flex-1 p-4 lg:p-6 overflow-hidden">
            <PreviewPanel state={state} />
          </div>
        </motion.section>
      </div>
    </ToolShell>
  );
}
