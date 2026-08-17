import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Type, Palette, Shapes, ImageIcon, Barcode, QrCode,
  ChevronDown, Upload, X, SlidersHorizontal, Info, Sparkles
} from 'lucide-react';
import type { AppState, CodeType } from '../types';
import ColorPicker from './ColorPicker';
import SliderControl from './SliderControl';
import SegmentedControl from './SegmentedControl';
import { TemplateSelector, WiFiForm, MapForm, VCardForm, EventForm } from './TemplateForms';

interface ControlPanelProps {
  state: AppState;
  onChange: (state: AppState) => void;
}

type SectionKey = 'content' | 'color' | 'style' | 'logo' | 'barcode';

const DOT_TYPES = [
  { value: 'square', label: '方塊' },
  { value: 'dots', label: '圓點' },
  { value: 'rounded', label: '圓角' },
  { value: 'extra-rounded', label: '液態' },
  { value: 'classy', label: '短橫' },
  { value: 'classy-rounded', label: '橫圓' },
];

const EYE_FRAME_TYPES = [
  { value: 'square', label: '直角' },
  { value: 'dot', label: '圓形' },
  { value: 'extra-rounded', label: '圓角' },
];

const EYE_DOT_TYPES = [
  { value: 'square', label: '直角' },
  { value: 'dot', label: '圓點' },
];

const BARCODE_FORMATS = [
  { value: 'CODE128', label: 'CODE128' },
  { value: 'EAN13', label: 'EAN-13' },
  { value: 'EAN8', label: 'EAN-8' },
  { value: 'UPC', label: 'UPC' },
  { value: 'CODE39', label: 'CODE39' },
  { value: 'ITF14', label: 'ITF-14' },
];

export default function ControlPanel({ state, onChange }: ControlPanelProps) {
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    content: true,
    color: true,
    style: true,
    logo: false,
    barcode: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateState = useCallback((partial: Partial<AppState>) => {
    onChange({ ...state, ...partial });
  }, [state, onChange]);

  const updateColor = useCallback((partial: Partial<AppState['color']>) => {
    onChange({ ...state, color: { ...state.color, ...partial } });
  }, [state, onChange]);

  const updateQRStyle = useCallback((partial: Partial<AppState['qrStyle']>) => {
    onChange({ ...state, qrStyle: { ...state.qrStyle, ...partial } });
  }, [state, onChange]);

  const updateLogo = useCallback((partial: Partial<AppState['logo']>) => {
    onChange({ ...state, logo: { ...state.logo, ...partial } });
  }, [state, onChange]);

  const updateBarcode = useCallback((partial: Partial<AppState['barcode']>) => {
    onChange({ ...state, barcode: { ...state.barcode, ...partial } });
  }, [state, onChange]);

  const handleCodeTypeChange = (type: CodeType) => {
    updateState({ codeType: type });
    if (type === 'barcode') {
      setExpanded((prev) => ({ ...prev, barcode: true, logo: false }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        updateLogo({ image: result });
        setExpanded((prev) => ({ ...prev, logo: true }));
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    updateLogo({ image: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const SectionHeader = ({ icon: Icon, label, sectionKey }: {
    icon: React.ElementType;
    label: string;
    sectionKey: SectionKey;
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="flex items-center justify-between w-full py-2.5 text-left group"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-rose-400" />
        <span className="text-sm font-semibold text-slate-200">{label}</span>
      </div>
      <motion.div
        animate={{ rotate: expanded[sectionKey] ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
      </motion.div>
    </button>
  );

  const renderTemplateForm = () => {
    switch (state.qrTemplate) {
      case 'wifi':
        return <WiFiForm state={state} onChange={onChange} />;
      case 'map':
        return <MapForm state={state} onChange={onChange} />;
      case 'vcard':
        return <VCardForm state={state} onChange={onChange} />;
      case 'event':
        return <EventForm state={state} onChange={onChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700/40">
        <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
          <SlidersHorizontal className="w-4 h-4 text-rose-400" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white">CodeCraft Pro</h1>
          <p className="text-[10px] text-slate-400 -mt-0.5">高度自定義編碼生成器</p>
        </div>
      </div>

      {/* Code Type Switch */}
      <div className="mb-4">
        <SegmentedControl
          options={[
            { value: 'qr', label: 'QR Code', icon: <QrCode className="w-3.5 h-3.5" /> },
            { value: 'barcode', label: '條碼', icon: <Barcode className="w-3.5 h-3.5" /> },
          ]}
          value={state.codeType}
          onChange={(v) => handleCodeTypeChange(v as CodeType)}
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
        {/* QR Templates - only show for QR mode */}
        {state.codeType === 'qr' && (
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 px-3 mb-1">
            <div className="flex items-center gap-2 py-2.5">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-semibold text-slate-200">旅團模板</span>
            </div>
            <div className="pb-3">
              <TemplateSelector state={state} onChange={onChange} />
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 px-3">
          <SectionHeader icon={Type} label="內容" sectionKey="content" />
          <AnimatePresence>
            {expanded.content && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pb-3 space-y-3">
                  {/* Template-specific forms */}
                  {state.codeType === 'qr' && state.qrTemplate !== 'url' && (
                    <div className="mb-2">
                      {renderTemplateForm()}
                    </div>
                  )}

                  {/* URL text input - show for URL template or barcode */}
                  {(state.codeType === 'barcode' || state.qrTemplate === 'url') && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        {state.codeType === 'qr' ? 'URL / 文字內容' : '條碼數值'}
                      </label>
                      <textarea
                        value={state.text}
                        onChange={(e) => updateState({ text: e.target.value })}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 transition-all resize-none"
                        rows={3}
                        placeholder={state.codeType === 'qr' ? 'https://example.com' : '123456789012'}
                      />
                    </div>
                  )}

                  {state.codeType === 'barcode' && (
                    <div className="flex items-start gap-1.5 text-[10px] text-amber-400/80 bg-amber-400/10 rounded-md px-2 py-1.5">
                      <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>條碼僅支援數字和英文字母，不支援中文。格式錯誤時會顯示紅色提示。</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Color Section */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 px-3">
          <SectionHeader icon={Palette} label="顏色系統" sectionKey="color" />
          <AnimatePresence>
            {expanded.color && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pb-3 space-y-3">
                  <ColorPicker
                    label={state.codeType === 'qr' ? '前景色 (Foreground)' : '條碼顏色'}
                    color={state.codeType === 'qr' ? state.color.foreground : state.barcode.foreground}
                    onChange={(c) => state.codeType === 'qr' ? updateColor({ foreground: c }) : updateBarcode({ foreground: c })}
                  />
                  <ColorPicker
                    label={state.codeType === 'qr' ? '背景色 (Background)' : '背景色'}
                    color={state.codeType === 'qr' ? state.color.background : state.barcode.background}
                    onChange={(c) => state.codeType === 'qr' ? updateColor({ background: c }) : updateBarcode({ background: c })}
                    allowTransparent
                  />

                  {state.codeType === 'qr' && (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-400">啟用漸變色</label>
                        <button
                          onClick={() => updateColor({ useGradient: !state.color.useGradient })}
                          className={`relative w-9 h-5 rounded-full transition-colors ${
                            state.color.useGradient ? 'bg-rose-500' : 'bg-slate-600'
                          }`}
                        >
                          <motion.div
                            className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                            animate={{ x: state.color.useGradient ? 16 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        </button>
                      </div>

                      <AnimatePresence>
                        {state.color.useGradient && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-3 pt-1">
                              <SegmentedControl
                                options={[
                                  { value: 'linear', label: '線性' },
                                  { value: 'radial', label: '徑向' },
                                ]}
                                value={state.color.gradientType}
                                onChange={(v) => updateColor({ gradientType: v as 'linear' | 'radial' })}
                              />
                              <ColorPicker
                                label="漸變起點"
                                color={state.color.gradientColor1}
                                onChange={(c) => updateColor({ gradientColor1: c })}
                              />
                              <ColorPicker
                                label="漸變終點"
                                color={state.color.gradientColor2}
                                onChange={(c) => updateColor({ gradientColor2: c })}
                              />
                              {state.color.gradientType === 'linear' && (
                                <SliderControl
                                  label="旋轉角度"
                                  value={state.color.gradientRotation}
                                  min={0}
                                  max={360}
                                  step={15}
                                  unit="°"
                                  onChange={(v) => updateColor({ gradientRotation: v })}
                                />
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* QR Style Section */}
        {state.codeType === 'qr' && (
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 px-3">
            <SectionHeader icon={Shapes} label="QR 式樣" sectionKey="style" />
            <AnimatePresence>
              {expanded.style && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pb-3 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">碼點樣式 (Dots)</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {DOT_TYPES.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => updateQRStyle({ dotType: type.value as AppState['qrStyle']['dotType'] })}
                            className={`px-2 py-1.5 text-xs font-medium rounded-md border transition-all ${
                              state.qrStyle.dotType === type.value
                                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">定位點外框 (Eye Frame)</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {EYE_FRAME_TYPES.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => updateQRStyle({ eyeFrameType: type.value as AppState['qrStyle']['eyeFrameType'] })}
                            className={`px-2 py-1.5 text-xs font-medium rounded-md border transition-all ${
                              state.qrStyle.eyeFrameType === type.value
                                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">定位點內點 (Eye Dot)</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {EYE_DOT_TYPES.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => updateQRStyle({ eyeDotType: type.value as AppState['qrStyle']['eyeDotType'] })}
                            className={`px-2 py-1.5 text-xs font-medium rounded-md border transition-all ${
                              state.qrStyle.eyeDotType === type.value
                                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <SliderControl
                      label="邊框留白 (Quiet Zone)"
                      value={state.qrStyle.quietZone}
                      min={0}
                      max={40}
                      step={2}
                      unit="px"
                      onChange={(v) => updateQRStyle({ quietZone: v })}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Barcode Section */}
        {state.codeType === 'barcode' && (
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 px-3">
            <SectionHeader icon={Barcode} label="條碼設定" sectionKey="barcode" />
            <AnimatePresence>
              {expanded.barcode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pb-3 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">條碼格式</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {BARCODE_FORMATS.map((fmt) => (
                          <button
                            key={fmt.value}
                            onClick={() => updateBarcode({ format: fmt.value as AppState['barcode']['format'] })}
                            className={`px-2 py-1.5 text-xs font-medium rounded-md border transition-all ${
                              state.barcode.format === fmt.value
                                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                            }`}
                          >
                            {fmt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <SliderControl
                      label="條碼寬度"
                      value={state.barcode.width}
                      min={1}
                      max={4}
                      step={0.5}
                      unit="x"
                      onChange={(v) => updateBarcode({ width: v })}
                    />

                    <SliderControl
                      label="條碼高度"
                      value={state.barcode.height}
                      min={30}
                      max={200}
                      step={10}
                      unit="px"
                      onChange={(v) => updateBarcode({ height: v })}
                    />

                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-400">顯示數值</label>
                      <button
                        onClick={() => updateBarcode({ displayValue: !state.barcode.displayValue })}
                        className={`relative w-9 h-5 rounded-full transition-colors ${
                          state.barcode.displayValue ? 'bg-rose-500' : 'bg-slate-600'
                        }`}
                      >
                        <motion.div
                          className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                          animate={{ x: state.barcode.displayValue ? 16 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>

                    {state.barcode.displayValue && (
                      <SliderControl
                        label="字體大小"
                        value={state.barcode.fontSize}
                        min={10}
                        max={36}
                        step={1}
                        unit="px"
                        onChange={(v) => updateBarcode({ fontSize: v })}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Logo Section */}
        {state.codeType === 'qr' && (
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 px-3">
            <SectionHeader icon={ImageIcon} label="中間圖示 (Logo)" sectionKey="logo" />
            <AnimatePresence>
              {expanded.logo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pb-3 space-y-4">
                    {!state.logo.image ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-slate-600/50 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                          <Upload className="w-5 h-5 text-slate-400 group-hover:text-rose-400 transition-colors" />
                        </div>
                        <span className="text-sm text-slate-300">上傳 Logo</span>
                        <span className="text-[10px] text-slate-500">PNG, JPG, SVG</span>
                      </button>
                    ) : (
                      <div className="relative">
                        <div className="bg-slate-900/60 rounded-xl border border-slate-700/40 p-4 flex items-center justify-center">
                          <img
                            src={state.logo.image}
                            alt="Logo preview"
                            className="max-h-24 max-w-full object-contain rounded-lg"
                          />
                        </div>
                        <button
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {state.logo.image && (
                      <>
                        <SliderControl
                          label="Logo 大小"
                          value={state.logo.size}
                          min={0.05}
                          max={0.3}
                          step={0.01}
                          unit=""
                          onChange={(v) => updateLogo({ size: v })}
                        />

                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-400">遮蔽背景點</label>
                          <button
                            onClick={() => updateLogo({ hideBackgroundDots: !state.logo.hideBackgroundDots })}
                            className={`relative w-9 h-5 rounded-full transition-colors ${
                              state.logo.hideBackgroundDots ? 'bg-rose-500' : 'bg-slate-600'
                            }`}
                          >
                            <motion.div
                              className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                              animate={{ x: state.logo.hideBackgroundDots ? 16 : 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          </button>
                        </div>

                        <div className="flex items-start gap-1.5 text-[10px] text-emerald-400/80 bg-emerald-400/10 rounded-md px-2 py-1.5">
                          <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          <span>容錯率已自動設為 Level H (30%)，確保 Logo 嵌入後的識別穩定性。</span>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
