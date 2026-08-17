import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, Copy, Check, ZoomIn, ZoomOut, Maximize2, QrCode, Barcode } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';
import JsBarcode from 'jsbarcode';
import type { AppState } from '../types';
import { getContrastRatio, downloadBlob } from '../lib/utils';
import { getQRText } from '../lib/template-helpers';
import ContrastWarning from './ContrastWarning';

interface PreviewPanelProps {
  state: AppState;
}

export default function PreviewPanel({ state }: PreviewPanelProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [qrCode, setQrCode] = useState<QRCodeStyling | null>(null);
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [barcodeError, setBarcodeError] = useState(false);

  // Compute the actual QR text based on template
  const qrText = useMemo(() => {
    if (state.codeType !== 'qr') return '';
    return getQRText(state.qrTemplate, state.text, state.templateData);
  }, [state.codeType, state.qrTemplate, state.text, state.templateData]);

  const getQROptions = useCallback(() => {
    const { color, qrStyle, logo } = state;
    const dotsOptions: Record<string, unknown> = {
      type: qrStyle.dotType,
    };

    if (color.useGradient) {
      dotsOptions.gradient = {
        type: color.gradientType,
        rotation: color.gradientRotation,
        colorStops: [
          { offset: 0, color: color.gradientColor1 },
          { offset: 1, color: color.gradientColor2 },
        ],
      };
    } else {
      dotsOptions.color = color.foreground;
    }

    return {
      width: 600,
      height: 600,
      data: qrText || 'https://example.com',
      margin: qrStyle.quietZone,
      qrOptions: {
        typeNumber: 0 as const,
        mode: 'Byte' as const,
        errorCorrectionLevel: (logo.image ? 'H' : 'M') as 'L' | 'M' | 'Q' | 'H',
      },
      imageOptions: {
        hideBackgroundDots: logo.hideBackgroundDots,
        imageSize: logo.size,
        margin: logo.margin,
      },
      dotsOptions,
      cornersSquareOptions: {
        color: color.foreground,
        type: qrStyle.eyeFrameType,
      },
      cornersDotOptions: {
        color: color.foreground,
        type: qrStyle.eyeDotType,
      },
      backgroundOptions: {
        color: color.background === 'transparent' ? '#ffffff' : color.background,
      },
      image: logo.image || undefined,
    };
  }, [state, qrText]);

  // Initialize QR code - ONLY when in QR mode
  useEffect(() => {
    if (state.codeType !== 'qr' || !qrRef.current) {
      // Clean up QR when switching to barcode
      if (qrRef.current) qrRef.current.innerHTML = '';
      setQrCode(null);
      return;
    }

    const options = getQROptions();
    const qr = new QRCodeStyling(options);
    qrRef.current.innerHTML = '';
    qr.append(qrRef.current);
    setQrCode(qr);
  }, [state.codeType, getQROptions]);

  // Update QR code
  useEffect(() => {
    if (state.codeType !== 'qr' || !qrCode) return;
    const options = getQROptions();
    qrCode.update(options);
  }, [state, qrCode, getQROptions]);

  // Barcode rendering - ONLY when in barcode mode
  useEffect(() => {
    if (state.codeType !== 'barcode') {
      setBarcodeError(false);
      return;
    }

    const { barcode, text } = state;
    const value = text || 'EXAMPLE';

    try {
      setBarcodeError(false);
      if (barcodeRef.current) {
        JsBarcode(barcodeRef.current, value, {
          format: barcode.format,
          lineColor: barcode.foreground,
          background: barcode.background === 'transparent' ? '#ffffff' : barcode.background,
          width: barcode.width,
          height: barcode.height,
          displayValue: barcode.displayValue,
          fontSize: barcode.fontSize,
          font: 'Inter, sans-serif',
          margin: 10,
        });
      }
      if (barcodeCanvasRef.current) {
        JsBarcode(barcodeCanvasRef.current, value, {
          format: barcode.format,
          lineColor: barcode.foreground,
          background: barcode.background === 'transparent' ? '#ffffff' : barcode.background,
          width: barcode.width,
          height: barcode.height,
          displayValue: barcode.displayValue,
          fontSize: barcode.fontSize,
          font: 'Inter, sans-serif',
          margin: 10,
        });
      }
    } catch (e) {
      setBarcodeError(true);
    }
  }, [state]);

  const handleDownloadPNG = async () => {
    setIsExporting(true);
    try {
      if (state.codeType === 'qr' && qrCode) {
        const blob = await qrCode.getRawData('png');
        if (blob) downloadBlob(blob, 'qrcode.png');
      } else if (state.codeType === 'barcode' && barcodeCanvasRef.current) {
        const canvas = barcodeCanvasRef.current;
        canvas.toBlob((blob) => {
          if (blob) downloadBlob(blob, 'barcode.png');
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSVG = async () => {
    setIsExporting(true);
    try {
      if (state.codeType === 'qr' && qrCode) {
        const blob = await qrCode.getRawData('svg');
        if (blob) downloadBlob(blob, 'qrcode.svg');
      } else if (state.codeType === 'barcode' && barcodeRef.current) {
        const svgData = new XMLSerializer().serializeToString(barcodeRef.current);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        downloadBlob(blob, 'barcode.svg');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    try {
      if (state.codeType === 'qr' && qrCode) {
        const blob = await qrCode.getRawData('png');
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
        }
      } else if (state.codeType === 'barcode' && barcodeCanvasRef.current) {
        const canvas = barcodeCanvasRef.current;
        canvas.toBlob(async (blob) => {
          if (blob) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
          }
        });
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not supported
    }
  };

  const contrastFg = state.codeType === 'qr' ? state.color.foreground : state.barcode.foreground;
  const contrastBg = state.codeType === 'qr' ? state.color.background : state.barcode.background;

  // Get preview title based on mode
  const previewTitle = state.codeType === 'qr' ? 'QR Code 預覽' : '條碼預覽';
  const previewSubtitle = state.codeType === 'qr'
    ? (state.qrTemplate === 'url' ? '網址 / 文字' :
       state.qrTemplate === 'wifi' ? 'Wi-Fi 連線' :
       state.qrTemplate === 'map' ? 'Google Maps 定位' :
       state.qrTemplate === 'vcard' ? 'vCard 聯絡人' :
       state.qrTemplate === 'event' ? '活動報名' : '')
    : state.barcode.format;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              {state.codeType === 'qr' ? (
                <QrCode className="w-5 h-5 text-rose-400" />
              ) : (
                <Barcode className="w-5 h-5 text-rose-400" />
              )}
              <h2 className="text-lg font-semibold text-white">{previewTitle}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{previewSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-800/60 rounded-lg p-0.5 border border-slate-700/60">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono text-slate-300 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(2, s + 0.1))}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale(1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Contrast Warning */}
      <ContrastWarning foreground={contrastFg} background={contrastBg} />

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center min-h-0 mt-4">
        <AnimatePresence mode="wait">
          {state.codeType === 'qr' ? (
            <motion.div
              key="qr-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-slate-700/40 p-8 flex items-center justify-center overflow-hidden"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
              }}
            >
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div ref={qrRef} className="relative z-10" />
            </motion.div>
          ) : (
            <motion.div
              key="barcode-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-slate-700/40 p-8 flex items-center justify-center overflow-hidden"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
              }}
            >
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="relative z-10">
                <svg ref={barcodeRef} className="hidden" />
                <canvas ref={barcodeCanvasRef} className="max-w-full" />
              </div>
              {barcodeError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-2xl z-20">
                  <div className="text-center px-6">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                      <Barcode className="w-6 h-6 text-red-400" />
                    </div>
                    <p className="text-sm font-medium text-red-300">條碼格式錯誤</p>
                    <p className="text-xs text-slate-400 mt-1">輸入的內容不符合 {state.barcode.format} 格式要求</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Bar */}
      <div className="mt-4 pt-4 border-t border-slate-700/40">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPNG}
            disabled={isExporting || (state.codeType === 'barcode' && barcodeError)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/30 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            下載 PNG
          </button>
          <button
            onClick={handleDownloadSVG}
            disabled={isExporting || (state.codeType === 'barcode' && barcodeError)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/30 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            下載 SVG
          </button>
          <button
            onClick={handleCopy}
            disabled={state.codeType === 'barcode' && barcodeError}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/30 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700/60"
            title="複製到剪貼簿"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
