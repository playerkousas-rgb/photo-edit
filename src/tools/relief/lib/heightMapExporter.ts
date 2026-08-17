import type { ReliefParams } from './types';
import { processImage } from './imageProcessor';

/**
 * Export the processed grayscale height map as a PNG for quick checking before
 * generating/printing the 3D model.
 */
export async function generateHeightMapPNG(
  imageData: string,
  params: ReliefParams
): Promise<Blob> {
  const processed = await processImage(imageData, params);
  const canvas = document.createElement('canvas');
  canvas.width = processed.width;
  canvas.height = processed.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');

  const imgData = ctx.createImageData(processed.width, processed.height);
  for (let i = 0; i < processed.heightMap.length; i++) {
    const v = Math.round(Math.max(0, Math.min(1, processed.heightMap[i])) * 255);
    const j = i * 4;
    imgData.data[j] = v;
    imgData.data[j + 1] = v;
    imgData.data[j + 2] = v;
    imgData.data[j + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export height map PNG'));
    }, 'image/png');
  });
}
