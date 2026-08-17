import type { ReliefParams } from './types';

export interface ProcessedImage {
  heightMap: Float32Array;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Load image from data URL, downsample to target resolution,
 * convert to grayscale heightmap with full image processing pipeline.
 */
export function processImage(
  imageData: string,
  params: ReliefParams
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const result = processImageSync(img, params);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageData;
  });
}

function processImageSync(img: HTMLImageElement, params: ReliefParams): ProcessedImage {
  const originalWidth = img.naturalWidth;
  const originalHeight = img.naturalHeight;
  const aspect = originalHeight / originalWidth;

  // Downsample to target resolution while preserving aspect ratio.
  // If the image is very tall, clamp the long side and reduce width instead of
  // independently clamping height (which would distort the exported model).
  const maxResolution = Math.max(10, Math.min(600, Math.round(params.resolution)));
  let w = maxResolution;
  let h = Math.round(w * aspect);
  if (h > 600) {
    h = 600;
    w = Math.max(10, Math.round(h / aspect));
  }
  if (h < 10) {
    h = 10;
    w = Math.min(600, Math.max(10, Math.round(h / aspect)));
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Apply transforms
  ctx.save();
  let tx = 0;
  let ty = 0;
  let sx = 1;
  let sy = 1;

  if (params.mirrorX) {
    tx = w;
    sx = -1;
  }
  if (params.mirrorY) {
    ty = h;
    sy = -1;
  }

  ctx.translate(tx, ty);
  ctx.scale(sx, sy);
  ctx.drawImage(img, 0, 0, w, h);
  ctx.restore();

  const pixels = ctx.getImageData(0, 0, w, h).data;

  // === STEP 1: Convert to grayscale luminance ===
  let heightMap = new Float32Array(w * h) as Float32Array<ArrayBuffer>;
  for (let i = 0; i < w * h; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    const a = pixels[i * 4 + 3] / 255;
    // Luminance formula (ITU-R BT.709)
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    // Pre-multiply alpha (transparent = 0 height)
    heightMap[i] = lum * a;
  }

  // === STEP 2: Brightness adjustment ===
  if (params.brightness !== 0) {
    const offset = params.brightness / 100;
    for (let i = 0; i < heightMap.length; i++) {
      heightMap[i] = Math.max(0, Math.min(1, heightMap[i] + offset));
    }
  }

  // === STEP 3: Contrast adjustment ===
  if (params.contrast !== 0) {
    const factor = (100 + params.contrast) / 100;
    // contrast around midpoint 0.5
    for (let i = 0; i < heightMap.length; i++) {
      heightMap[i] = Math.max(0, Math.min(1, (heightMap[i] - 0.5) * factor + 0.5));
    }
  }

  // === STEP 4: Gamma correction ===
  if (params.gamma !== 1.0) {
    const invGamma = 1.0 / params.gamma;
    for (let i = 0; i < heightMap.length; i++) {
      heightMap[i] = Math.pow(Math.max(0, heightMap[i]), invGamma);
    }
  }

  // === STEP 5: Invert grayscale depth ===
  if (params.invertDepth) {
    for (let i = 0; i < heightMap.length; i++) {
      heightMap[i] = 1.0 - heightMap[i];
    }
  }

  // === STEP 6: Gaussian smoothing ===
  if (params.smoothing > 0) {
    for (let pass = 0; pass < params.smoothing; pass++) {
      heightMap = gaussianBlur5x5(heightMap, w, h);
    }
  }

  // === STEP 7: Sharpening (unsharp mask) ===
  if (params.sharpen > 0) {
    heightMap = unsharpMask(heightMap, w, h, params.sharpen);
  }

  // === STEP 8: Optional normalize to [0, 1] range ===
  // Keeping this optional makes brightness/contrast more predictable for users
  // who want to preserve the original tonal range.
  if (params.autoNormalize) {
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let i = 0; i < heightMap.length; i++) {
      if (heightMap[i] < minVal) minVal = heightMap[i];
      if (heightMap[i] > maxVal) maxVal = heightMap[i];
    }
    const range = maxVal - minVal;
    if (range > 0.001) {
      for (let i = 0; i < heightMap.length; i++) {
        heightMap[i] = (heightMap[i] - minVal) / range;
      }
    }
  }

  // === STEP 9: Edge fade for cleaner printable borders ===
  if (params.edgeFade > 0) {
    applyEdgeFade(heightMap, w, h, params.edgeFade);
  }

  return {
    heightMap,
    width: w,
    height: h,
    originalWidth,
    originalHeight,
  };
}

/**
 * 5x5 Gaussian blur for better quality smoothing.
 */
function gaussianBlur5x5(data: Float32Array<ArrayBuffer>, w: number, h: number): Float32Array<ArrayBuffer> {
  // 5x5 Gaussian kernel (sigma ≈ 1.0)
  const kernel = [
    1, 4, 7, 4, 1,
    4, 16, 26, 16, 4,
    7, 26, 41, 26, 7,
    4, 16, 26, 16, 4,
    1, 4, 7, 4, 1,
  ];
  const kernelSum = 273;
  const result = new Float32Array(w * h) as Float32Array<ArrayBuffer>;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let ky = -2; ky <= 2; ky++) {
        for (let kx = -2; kx <= 2; kx++) {
          const sx = Math.max(0, Math.min(w - 1, x + kx));
          const sy = Math.max(0, Math.min(h - 1, y + ky));
          sum += data[sy * w + sx] * kernel[(ky + 2) * 5 + (kx + 2)];
        }
      }
      result[y * w + x] = sum / kernelSum;
    }
  }

  return result;
}

/**
 * Unsharp mask sharpening.
 * Sharpened = Original + amount * (Original - Blurred)
 */
function unsharpMask(
  data: Float32Array<ArrayBuffer>,
  w: number,
  h: number,
  amount: number
): Float32Array<ArrayBuffer> {
  const blurred = gaussianBlur5x5(data, w, h);
  const result = new Float32Array(w * h) as Float32Array<ArrayBuffer>;
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] + amount * (data[i] - blurred[i]);
    // Clamp
    if (result[i] < 0) result[i] = 0;
    if (result[i] > 1) result[i] = 1;
  }
  return result;
}

/**
 * Fade relief height near the image border so the mesh transitions back to the
 * base plate instead of forming tall vertical walls at the perimeter.
 */
function applyEdgeFade(
  data: Float32Array<ArrayBuffer>,
  w: number,
  h: number,
  percent: number
) {
  const fadePx = Math.max(1, Math.min(w, h) * Math.max(0, percent) / 100);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const distToEdge = Math.min(x, y, w - 1 - x, h - 1 - y);
      const t = Math.max(0, Math.min(1, distToEdge / fadePx));
      // Smoothstep easing keeps the transition visually soft.
      const eased = t * t * (3 - 2 * t);
      data[y * w + x] *= eased;
    }
  }
}
