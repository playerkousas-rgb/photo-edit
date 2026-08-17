import { motion } from 'framer-motion';

interface SegmentedControlProps {
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (value: string) => void;
}

export default function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className="flex bg-slate-800/60 rounded-lg p-0.5 border border-slate-700/60">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
            value === opt.value ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {value === opt.value && (
            <motion.div
              layoutId="segment-bg"
              className="absolute inset-0 bg-rose-500/90 rounded-md"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1">
            {opt.icon}
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}
