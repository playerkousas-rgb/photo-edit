import { useState } from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

export default function SliderControl({ label, value, min, max, step, unit = '', onChange }: SliderControlProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setLocalValue(v);
    onChange(v);
  };

  const percentage = ((localValue - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-slate-400">{label}</label>
        <span className="text-xs font-mono text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded">
          {localValue}{unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleChange}
          className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-rose-500"
          style={{
            background: `linear-gradient(to right, #e94560 ${percentage}%, #334155 ${percentage}%)`,
          }}
        />
      </div>
    </div>
  );
}
