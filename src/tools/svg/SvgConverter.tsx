import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Sliders, Layers, Zap, Image as ImageIcon, Trash2, Eye, EyeOff, FileDown, Sparkles, Wand2, Contrast, Droplets } from 'lucide-react';

interface ProcessedImage {
  id: string;
  file: File;
  originalUrl: string;
  svg: string;
  width: number;
  height: number;
  processing: boolean;
}

interface Params {
  threshold: number;
  contrast: number;
  denoise: number;
  smoothness: number;
  strokeWidth: number;
  mode: 'outline' | 'centerline';
  invert: boolean;
}

export default function SvgConverter() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [params, setParams] = useState<Params>({
    threshold: 128,
    contrast: 1.5,
    denoise: 2,
    smoothness: 2,
    strokeWidth: 1.5,
    mode: 'centerline',
    invert: false,
  });
  const [showOriginal, setShowOriginal] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const selectedImage = images.find(img => img.id === selectedId);

  // Zhang-Suen thinning algorithm for centerline extraction
  const zhangSuenThinning = useCallback((imageData: ImageData): ImageData => {
    const { width, height, data } = imageData;
    const binary = new Uint8Array(width * height);
    
    // Convert to binary
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      binary[idx] = data[i] < 128 ? 1 : 0;
    }

    const get = (x: number, y: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return 0;
      return binary[y * width + x];
    };

    const set = (x: number, y: number, v: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      binary[y * width + x] = v;
    };

    const neighbors = (x: number, y: number) => [
      get(x, y - 1), get(x + 1, y - 1), get(x + 1, y),
      get(x + 1, y + 1), get(x, y + 1), get(x - 1, y + 1),
      get(x - 1, y), get(x - 1, y - 1)
    ];

    const transitions = (n: number[]) => {
      let count = 0;
      for (let i = 0; i < 8; i++) {
        if (n[i] === 0 && n[(i + 1) % 8] === 1) count++;
      }
      return count;
    };

    let changed = true;
    while (changed) {
      changed = false;
      const toRemove: [number, number][] = [];

      // Step 1
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          if (get(x, y) !== 1) continue;
          const n = neighbors(x, y);
          const sum = n.reduce((a, b) => a + b, 0);
          if (sum < 2 || sum > 6) continue;
          if (transitions(n) !== 1) continue;
          if (n[0] * n[2] * n[4] !== 0) continue;
          if (n[2] * n[4] * n[6] !== 0) continue;
          toRemove.push([x, y]);
        }
      }
      if (toRemove.length > 0) {
        changed = true;
        toRemove.forEach(([x, y]) => set(x, y, 0));
      }

      // Step 2
      toRemove.length = 0;
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          if (get(x, y) !== 1) continue;
          const n = neighbors(x, y);
          const sum = n.reduce((a, b) => a + b, 0);
          if (sum < 2 || sum > 6) continue;
          if (transitions(n) !== 1) continue;
          if (n[0] * n[2] * n[6] !== 0) continue;
          if (n[0] * n[4] * n[6] !== 0) continue;
          toRemove.push([x, y]);
        }
      }
      if (toRemove.length > 0) {
        changed = true;
        toRemove.forEach(([x, y]) => set(x, y, 0));
      }
    }

    // Convert back to ImageData
    const output = new ImageData(width, height);
    for (let i = 0; i < binary.length; i++) {
      const v = binary[i] ? 0 : 255;
      output.data[i * 4] = v;
      output.data[i * 4 + 1] = v;
      output.data[i * 4 + 2] = v;
      output.data[i * 4 + 3] = 255;
    }
    return output;
  }, []);

  // Gaussian blur for denoising
  const gaussianBlur = useCallback((imageData: ImageData, radius: number): ImageData => {
    if (radius < 1) return imageData;
    const { width, height, data } = imageData;
    const output = new ImageData(width, height);
    const kernel = [];
    const sigma = radius / 3;
    const twoSigmaSq = 2 * sigma * sigma;
    let sum = 0;

    for (let i = -radius; i <= radius; i++) {
      const val = Math.exp(-(i * i) / twoSigmaSq);
      kernel.push(val);
      sum += val;
    }
    kernel.forEach((v, i) => kernel[i] = v / sum);

    // Horizontal pass
    const temp = new Uint8ClampedArray(data.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0;
        for (let k = -radius; k <= radius; k++) {
          const nx = Math.min(width - 1, Math.max(0, x + k));
          const idx = (y * width + nx) * 4;
          const weight = kernel[k + radius];
          r += data[idx] * weight;
          g += data[idx + 1] * weight;
          b += data[idx + 2] * weight;
        }
        const idx = (y * width + x) * 4;
        temp[idx] = r;
        temp[idx + 1] = g;
        temp[idx + 2] = b;
        temp[idx + 3] = 255;
      }
    }

    // Vertical pass
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let r = 0, g = 0, b = 0;
        for (let k = -radius; k <= radius; k++) {
          const ny = Math.min(height - 1, Math.max(0, y + k));
          const idx = (ny * width + x) * 4;
          const weight = kernel[k + radius];
          r += temp[idx] * weight;
          g += temp[idx + 1] * weight;
          b += temp[idx + 2] * weight;
        }
        const idx = (y * width + x) * 4;
        output.data[idx] = r;
        output.data[idx + 1] = g;
        output.data[idx + 2] = b;
        output.data[idx + 3] = 255;
      }
    }
    return output;
  }, []);

  // Trace bitmap to SVG paths (simplified Potrace-like)
  const traceToSVG = useCallback((imageData: ImageData, smoothness: number): string => {
    const { width, height, data } = imageData;
    const paths: string[] = [];
    const visited = new Uint8Array(width * height);

    const isBlack = (x: number, y: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return false;
      return data[(y * width + x) * 4] < 128;
    };

    const getVisited = (x: number, y: number) => visited[y * width + x];
    const setVisited = (x: number, y: number) => { visited[y * width + x] = 1; };

    // Find contours using marching squares simplified
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!isBlack(x, y) || getVisited(x, y)) continue;

        // Trace path
        const path: [number, number][] = [];
        let cx = x, cy = y;
        let dir = 0; // 0:right, 1:down, 2:left, 3:up
        const startX = x, startY = y;
        let steps = 0;
        const maxSteps = width * height;

        do {
          path.push([cx, cy]);
          setVisited(cx, cy);
          steps++;

          // Find next black pixel (8-connectivity)
          let found = false;
          const dirs = [[1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1]];
          for (let i = 0; i < 8; i++) {
            const d = (dir + i) % 8;
            const nx = cx + dirs[d][0];
            const ny = cy + dirs[d][1];
            if (isBlack(nx, ny) && !getVisited(nx, ny)) {
              cx = nx;
              cy = ny;
              dir = (d + 5) % 8; // Turn left-ish
              found = true;
              break;
            }
          }
          
          if (!found) {
            // Try any neighbor
            for (const [dx, dy] of dirs) {
              const nx = cx + dx;
              const ny = cy + dy;
              if (isBlack(nx, ny)) {
                cx = nx;
                cy = ny;
                found = true;
                break;
              }
            }
          }
          
          if (!found || steps > maxSteps) break;
        } while (!(cx === startX && cy === startY) && steps < 1000);

        if (path.length > 2) {
          // Simplify path using Ramer-Douglas-Peucker
          const simplify = (points: [number, number][], epsilon: number): [number, number][] => {
            if (points.length < 3) return points;
            
            let maxDist = 0;
            let index = 0;
            const end = points.length - 1;
            
            for (let i = 1; i < end; i++) {
              const dist = perpendicularDistance(points[i], points[0], points[end]);
              if (dist > maxDist) {
                maxDist = dist;
                index = i;
              }
            }
            
            if (maxDist > epsilon) {
              const left = simplify(points.slice(0, index + 1), epsilon);
              const right = simplify(points.slice(index), epsilon);
              return [...left.slice(0, -1), ...right];
            }
            return [points[0], points[end]];
          };

          const perpendicularDistance = (p: [number, number], a: [number, number], b: [number, number]) => {
            const [x, y] = p;
            const [x1, y1] = a;
            const [x2, y2] = b;
            const A = x - x1;
            const B = y - y1;
            const C = x2 - x1;
            const D = y2 - y1;
            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = -1;
            if (lenSq !== 0) param = dot / lenSq;
            let xx, yy;
            if (param < 0) {
              xx = x1; yy = y1;
            } else if (param > 1) {
              xx = x2; yy = y2;
            } else {
              xx = x1 + param * C;
              yy = y1 + param * D;
            }
            const dx = x - xx;
            const dy = y - yy;
            return Math.sqrt(dx * dx + dy * dy);
          };

          const simplified = simplify(path, smoothness);
          
          if (simplified.length > 1) {
            let d = `M ${simplified[0][0]} ${simplified[0][1]}`;
            for (let i = 1; i < simplified.length; i++) {
              d += ` L ${simplified[i][0]} ${simplified[i][1]}`;
            }
            paths.push(d);
          }
        }
      }
    }

    return paths.join(' ');
  }, []);

  const processImage = useCallback(async (img: ProcessedImage) => {
    if (!canvasRef.current) return;

    setImages(prev => prev.map(i => i.id === img.id ? { ...i, processing: true } : i));

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    
    const image = new Image();
    image.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = img.originalUrl;
    });

    // Scale down if too large (max 2000px)
    const maxSize = 2000;
    let { width, height } = image;
    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);

    let imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 1. Grayscale + Contrast
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      let val = (gray - 128) * params.contrast + 128;
      val = Math.max(0, Math.min(255, val));
      data[i] = data[i + 1] = data[i + 2] = val;
    }

    // 2. Denoise
    if (params.denoise > 0) {
      imageData = gaussianBlur(imageData, params.denoise);
    }

    ctx.putImageData(imageData, 0, 0);
    imageData = ctx.getImageData(0, 0, width, height);

    // 3. Thresholding
    for (let i = 0; i < imageData.data.length; i += 4) {
      const val = imageData.data[i] < params.threshold ? 0 : 255;
      const finalVal = params.invert ? 255 - val : val;
      imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = finalVal;
    }

    // 4. Centerline extraction if needed
    if (params.mode === 'centerline') {
      imageData = zhangSuenThinning(imageData);
    }

    ctx.putImageData(imageData, 0, 0);

    // 5. Trace to SVG
    const pathData = traceToSVG(imageData, params.smoothness);

    // 6. Create SVG
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="white"/>
  <path d="${pathData}" 
        fill="none" 
        stroke="black" 
        stroke-width="${params.strokeWidth}" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"/>
</svg>`.trim();

    setImages(prev => prev.map(i => 
      i.id === img.id 
        ? { ...i, svg, width, height, processing: false }
        : i
    ));
  }, [params, gaussianBlur, zhangSuenThinning, traceToSVG]);

  const handleFiles = useCallback((files: FileList) => {
    const newImages: ProcessedImage[] = [];
    
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const id = Math.random().toString(36).slice(2);
      const originalUrl = URL.createObjectURL(file);
      
      newImages.push({
        id,
        file,
        originalUrl,
        svg: '',
        width: 0,
        height: 0,
        processing: false,
      });
    });

    setImages(prev => [...prev, ...newImages]);
    if (newImages.length > 0 && !selectedId) {
      setSelectedId(newImages[0].id);
    }

    // Process after a tick
    setTimeout(() => {
      newImages.forEach(img => processImage(img));
    }, 100);
  }, [processImage, selectedId]);

  // Re-process when params change
  useEffect(() => {
    if (selectedImage && !selectedImage.processing) {
      processImage(selectedImage);
    }
  }, [params, selectedImage, processImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const downloadSVG = useCallback((img: ProcessedImage) => {
    const blob = new Blob([img.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = img.file.name.replace(/\.[^/.]+$/, '') + '.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadAll = useCallback(() => {
    images.forEach(img => {
      if (img.svg) downloadSVG(img);
    });
  }, [images, downloadSVG]);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.originalUrl);
      return prev.filter(i => i.id !== id);
    });
    if (selectedId === id) {
      setSelectedId(images[0]?.id || null);
    }
  }, [selectedId, images]);

  return (
    <div className="flex-1 bg-[#02133E] text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-[calc(100vh-7.5rem)]">
        {/* Header */}
        <header className="border-b border-white/5 bg-black/20 backdrop-blur-2xl">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-60" />
                <div className="relative w-10 h-10 rounded-xl bg-[#02133E] flex items-center justify-center border border-white/10">
                  <Wand2 className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-medium tracking-tight">向量化提取工具</h1>
                <p className="text-xs text-zinc-400 -mt-0.5">PNG → SVG 智慧轉換器</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block text-[11px] text-zinc-600 mr-2">© 2026 Scout System</div>
              {images.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={downloadAll}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm flex items-center gap-2 transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  批量下載
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-sm font-medium flex items-center gap-2 shadow-lg shadow-cyan-900/30"
              >
                <Upload className="w-4 h-4" />
                上傳圖片
              </motion.button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Images */}
          <div className="w-[280px] border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">圖片批次</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{images.length}</span>
              </div>
              
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative group cursor-pointer ${isDragging ? 'scale-[0.98]' : ''} transition-transform`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity ${isDragging ? 'opacity-40' : ''}`} />
                <div className="relative h-[100px] rounded-2xl bg-zinc-900/50 border border-dashed border-white/10 group-hover:border-white/20 flex flex-col items-center justify-center gap-2 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-zinc-500" />
                  </div>
                  <p className="text-xs text-zinc-500">拖放或點擊上傳</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <AnimatePresence>
                {images.map((img) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedId(img.id)}
                    className={`group relative cursor-pointer rounded-xl overflow-hidden border transition-all ${
                      selectedId === img.id 
                        ? 'border-cyan-500/50 bg-cyan-500/10' 
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                    }`}
                  >
                    <div className="aspect-video relative">
                      <img src={img.originalUrl} alt="" className="w-full h-full object-cover" />
                      {img.processing && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                        </div>
                      )}
                      {img.svg && !img.processing && (
                        <div className="absolute inset-0 bg-white p-2">
                          <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: img.svg }} />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 flex items-center justify-between">
                      <p className="text-xs truncate flex-1 text-zinc-400 group-hover:text-zinc-200">{img.file.name}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                      >
                        <Trash2 className="w-3 h-3 text-zinc-500" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {images.length === 0 && (
                <div className="text-center py-12">
                  <ImageIcon className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
                  <p className="text-xs text-zinc-600">尚無圖片</p>
                </div>
              )}
            </div>
            
            {/* Copyright Footer */}
            <div className="p-3 border-t border-white/5">
              <p className="text-[10px] text-center text-zinc-600">© 2026 Scout System. All rights reserved.</p>
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedImage ? (
              <>
                {/* Toolbar */}
                <div className="h-14 border-b border-white/5 bg-black/20 backdrop-blur-xl px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white/5 border border-white/10">
                      <button
                        onClick={() => setParams(p => ({ ...p, mode: 'centerline' }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                          params.mode === 'centerline' 
                            ? 'bg-white text-black' 
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        中心線
                      </button>
                      <button
                        onClick={() => setParams(p => ({ ...p, mode: 'outline' }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                          params.mode === 'outline' 
                            ? 'bg-white text-black' 
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        輪廓
                      </button>
                    </div>

                    <div className="h-6 w-px bg-white/10" />

                    <button
                      onClick={() => setShowOriginal(!showOriginal)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                      title={showOriginal ? "隱藏原圖" : "顯示原圖"}
                    >
                      {showOriginal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{selectedImage.width} × {selectedImage.height}</span>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => downloadSVG(selectedImage)}
                      disabled={!selectedImage.svg}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      下載 SVG
                    </motion.button>
                  </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 grid grid-cols-2 gap-px bg-white/5">
                    {/* Original */}
                    <div className={`bg-[#021028] relative overflow-hidden ${!showOriginal ? 'col-span-2' : ''}`}>
                      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
                        <ImageIcon className="w-3 h-3" />
                        原始 PNG
                      </div>
                      <div className="w-full h-full flex items-center justify-center p-8">
                        <img 
                          src={selectedImage.originalUrl} 
                          alt="original"
                          className="max-w-full max-h-full object-contain"
                          style={{ 
                            filter: `contrast(${params.contrast})`,
                            imageRendering: 'pixelated'
                          }}
                        />
                      </div>
                    </div>

                    {/* SVG Output */}
                    {showOriginal && (
                      <div className="bg-white relative overflow-hidden">
                        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          向量 SVG
                        </div>
                        <div className="w-full h-full flex items-center justify-center p-8">
                          {selectedImage.processing ? (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                              <p className="text-xs text-zinc-500">向量化中...</p>
                            </div>
                          ) : selectedImage.svg ? (
                            <div 
                              className="max-w-full max-h-full"
                              dangerouslySetInnerHTML={{ __html: selectedImage.svg }}
                              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
                            />
                          ) : (
                            <p className="text-sm text-zinc-400">處理中...</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Parameters Panel */}
                  <div className="w-[300px] border-l border-white/5 bg-black/60 backdrop-blur-2xl overflow-y-auto">
                    <div className="p-4">
                      <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5" />
                        參數調優
                      </h3>

                      <div className="space-y-5">
                        {/* Threshold */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-zinc-300 flex items-center gap-1.5">
                              <Contrast className="w-3 h-3 text-zinc-500" />
                              黑白閾值
                            </label>
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                              {params.threshold}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="255"
                            value={params.threshold}
                            onChange={(e) => setParams(p => ({ ...p, threshold: Number(e.target.value) }))}
                            className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                          />
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-zinc-600">暗</span>
                            <span className="text-[10px] text-zinc-600">亮</span>
                          </div>
                        </div>

                        {/* Contrast */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-zinc-300">對比增強</label>
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                              {params.contrast.toFixed(1)}×
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={params.contrast}
                            onChange={(e) => setParams(p => ({ ...p, contrast: Number(e.target.value) }))}
                            className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                          />
                        </div>

                        {/* Denoise */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-zinc-300 flex items-center gap-1.5">
                              <Droplets className="w-3 h-3 text-zinc-500" />
                              去噪點
                            </label>
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                              {params.denoise}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="1"
                            value={params.denoise}
                            onChange={(e) => setParams(p => ({ ...p, denoise: Number(e.target.value) }))}
                            className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                          />
                        </div>

                        {/* Smoothness */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-zinc-300">平滑度</label>
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                              {params.smoothness}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="5"
                            step="0.5"
                            value={params.smoothness}
                            onChange={(e) => setParams(p => ({ ...p, smoothness: Number(e.target.value) }))}
                            className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                          />
                          <p className="text-[10px] text-zinc-600 mt-1">控制節點密度</p>
                        </div>

                        {/* Stroke Width */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-zinc-300">線條細度</label>
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                              {params.strokeWidth.toFixed(1)}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="5"
                            step="0.1"
                            value={params.strokeWidth}
                            onChange={(e) => setParams(p => ({ ...p, strokeWidth: Number(e.target.value) }))}
                            className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                          />
                        </div>

                        <div className="pt-4 border-t border-white/5">
                          <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">反轉顏色</span>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={params.invert}
                                onChange={(e) => setParams(p => ({ ...p, invert: e.target.checked }))}
                                className="sr-only"
                              />
                              <div className={`w-9 h-5 rounded-full transition-colors ${params.invert ? 'bg-cyan-600' : 'bg-zinc-800'}`} />
                              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${params.invert ? 'translate-x-4' : ''}`} />
                            </div>
                          </label>
                        </div>

                        {/* Presets */}
                        <div className="pt-4 border-t border-white/5">
                          <p className="text-[11px] text-zinc-500 mb-2 uppercase tracking-wider">快速預設</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { name: '手繪', p: { threshold: 128, contrast: 1.8, denoise: 2, smoothness: 1.5, strokeWidth: 1.2, mode: 'centerline' as const } },
                              { name: '草稿', p: { threshold: 140, contrast: 1.3, denoise: 3, smoothness: 2.5, strokeWidth: 1.8, mode: 'centerline' as const } },
                              { name: '墨水', p: { threshold: 110, contrast: 2, denoise: 1, smoothness: 1, strokeWidth: 1, mode: 'outline' as const } },
                              { name: '精細', p: { threshold: 128, contrast: 1.5, denoise: 1, smoothness: 0.8, strokeWidth: 0.8, mode: 'centerline' as const } },
                            ].map(preset => (
                              <button
                                key={preset.name}
                                onClick={() => setParams(p => ({ ...p, ...preset.p }))}
                                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-zinc-400 hover:text-white transition-colors"
                              >
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="relative inline-block mb-6">
                    <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-full blur-2xl" />
                    <div className="relative w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-white/10 flex items-center justify-center backdrop-blur-xl">
                      <Wand2 className="w-10 h-10 text-cyan-400" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-medium mb-2 tracking-tight">向量化提取工具</h2>
                  <p className="text-zinc-500 mb-8 leading-relaxed">
                    將 PNG 點陣圖轉換為高品質 SVG 向量<br/>
                    支援中心線與輪廓雙模式提取
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 font-medium shadow-lg shadow-cyan-900/25 flex items-center gap-2 mx-auto"
                  >
                    <Upload className="w-4 h-4" />
                    選擇 PNG 圖片
                  </motion.button>
                  <div className="mt-12 grid grid-cols-3 gap-6 text-left">
                    {[
                      { icon: Zap, title: '中心線提取', desc: '避免空心路徑' },
                      { icon: Sliders, title: '即時預覽', desc: '參數即時調整' },
                      { icon: Layers, title: '批次處理', desc: '多檔一次轉換' },
                    ].map((feature) => (
                      <div key={feature.title} className="space-y-2">
                        <feature.icon className="w-5 h-5 text-zinc-600" />
                        <h3 className="text-sm font-medium text-zinc-300">{feature.title}</h3>
                        <p className="text-xs text-zinc-600 leading-relaxed">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}