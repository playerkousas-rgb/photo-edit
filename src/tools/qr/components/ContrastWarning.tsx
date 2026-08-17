import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getContrastRatio } from '../lib/utils';

interface ContrastWarningProps {
  foreground: string;
  background: string;
}

export default function ContrastWarning({ foreground, background }: ContrastWarningProps) {
  const ratio = getContrastRatio(foreground, background);
  const isWarning = ratio < 3;
  const isCritical = ratio < 1.5;

  return (
    <AnimatePresence>
      {isWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          className={`rounded-lg px-3 py-2 flex items-start gap-2 text-xs ${
            isCritical
              ? 'bg-red-500/15 border border-red-500/30 text-red-300'
              : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
          }`}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">
              {isCritical ? '對比度過低，可能無法掃描' : '對比度偏低，掃描可能困難'}
            </p>
            <p className="mt-0.5 opacity-80">
              當前對比度: {ratio.toFixed(2)}:1 (建議至少 3:1)
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
