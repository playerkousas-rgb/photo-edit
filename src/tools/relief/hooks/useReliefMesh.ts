import { useState, useEffect, useRef } from 'react';
import type { ReliefParams } from '../lib/types';
import type { MeshData } from '../lib/meshGenerator';
import { processImage, type ProcessedImage } from '../lib/imageProcessor';
import { generateMesh } from '../lib/meshGenerator';

export interface ImageInfo {
  width: number;
  height: number;
}

export function useReliefMesh(
  imageData: string,
  params: ReliefParams
) {
  const [meshData, setMeshData] = useState<MeshData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const generationId = useRef(0);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    const currentId = ++generationId.current;

    debounceRef.current = window.setTimeout(async () => {
      setIsProcessing(true);
      try {
        const currentParams = params;
        const processed: ProcessedImage = await processImage(imageData, currentParams);

        // Check if this is still the latest request
        if (currentId !== generationId.current) return;

        setImageInfo({
          width: processed.originalWidth,
          height: processed.originalHeight,
        });
        const mesh = generateMesh(processed, currentParams);

        if (currentId !== generationId.current) return;
        setMeshData(mesh);
      } catch (err) {
        console.error('Mesh generation failed:', err);
      } finally {
        if (currentId === generationId.current) {
          setIsProcessing(false);
        }
      }
    }, 150);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [imageData, params]);

  return { meshData, isProcessing, imageInfo };
}
