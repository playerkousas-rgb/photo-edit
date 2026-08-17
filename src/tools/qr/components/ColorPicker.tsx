import { useState, useRef, useEffect } from 'react';
import { Pipette, Check } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  allowTransparent?: boolean;
}

const PRESET_COLORS = [
  '#1a1a2e', '#e94560', '#0f3460', '#533483',
  '#16213e', '#0f4c75', '#3282b8', '#bbe1fa',
  '#000000', '#333333', '#666666', '#999999',
  '#ffffff', '#f5f5f5', '#e0e0e0', '#cccccc',
  '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1',
  '#5f27cd', '#ff9ff3', '#54a0ff', '#00d2d3',
];

export default function ColorPicker({ label, color, onChange, allowTransparent = false }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(color);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCustomColor(color);
  }, [color]);

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-lg hover:border-slate-600 transition-colors"
      >
        <div
          className="w-6 h-6 rounded-md border border-slate-600 flex-shrink-0"
          style={{
            backgroundColor: color === 'transparent' ? 'transparent' : color,
            backgroundImage: color === 'transparent'
              ? 'linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)'
              : 'none',
            backgroundSize: color === 'transparent' ? '8px 8px' : 'auto',
            backgroundPosition: color === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto',
          }}
        />
        <span className="text-sm text-slate-200 font-mono flex-1 text-left truncate">
          {color === 'transparent' ? 'Transparent' : color.toUpperCase()}
        </span>
        <Pipette className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-3">
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setIsOpen(false); }}
                className="w-8 h-8 rounded-md border border-slate-600/50 hover:scale-110 transition-transform relative"
                style={{ backgroundColor: c }}
              >
                {color.toLowerCase() === c.toLowerCase() && (
                  <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-md" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input
              type="color"
              value={customColor.startsWith('#') ? customColor : '#000000'}
              onChange={handleCustomChange}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  onChange(e.target.value);
                }
              }}
              className="flex-1 bg-slate-900/60 border border-slate-700 rounded-md px-2 py-1 text-xs font-mono text-slate-200 uppercase"
              placeholder="#000000"
            />
          </div>

          {allowTransparent && (
            <button
              onClick={() => { onChange('transparent'); setIsOpen(false); }}
              className="w-full mt-1 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-md transition-colors text-left flex items-center gap-2"
            >
              <div
                className="w-4 h-4 rounded border border-slate-600"
                style={{
                  backgroundImage: 'linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)',
                  backgroundSize: '6px 6px',
                  backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                }}
              />
              Transparent Background
            </button>
          )}
        </div>
      )}
    </div>
  );
}
