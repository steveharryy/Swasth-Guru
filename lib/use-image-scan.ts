import { useState, useRef, useCallback } from 'react';
import { preprocessForOCR } from './preprocess-image';

export type ScanState = 'idle' | 'processing' | 'success' | 'error';

export interface ScanResult {
  medicineName: string;
  confidence: number;
}

export function useImageScan(onSuccess: (name: string) => void) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [error, setError] = useState<string | null>(null);
  // Hidden <input type="file"> reference — mounted once, reused
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const recognise = useCallback(async (file: File) => {
    setScanState('processing');
    setError(null);

    try {
      // Preprocess image for better OCR accuracy
      const processedBlob = await preprocessForOCR(file);
      const processedFile = new File([processedBlob], 'scan.png', { type: 'image/png' });

      const formData = new FormData();
      formData.append('image', processedFile);

      // Use the local backend API
      const res = await fetch('http://localhost:8888/api/recognize-medicine', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Recognition failed');
      }

      const result = data as ScanResult;
      setScanState('success');
      onSuccess(result.medicineName);

      // Reset back to idle after 2s so the success indicator fades
      setTimeout(() => setScanState('idle'), 2000);
    } catch (err: any) {
      console.error('[SCAN ERROR]', err);
      setError(err.message ?? 'Unknown error');
      setScanState('error');
      setTimeout(() => setScanState('idle'), 4000);
    }
  }, [onSuccess]);

  /** Opens the OS file picker (or camera sheet on mobile). */
  const openPicker = useCallback((captureMode?: 'camera' | 'gallery') => {
    if (!fileInputRef.current) return;
    const input = fileInputRef.current;

    // `capture` attribute triggers camera on mobile; omit it for gallery
    if (captureMode === 'camera') {
      input.setAttribute('capture', 'environment');
    } else {
      input.removeAttribute('capture');
    }

    input.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) recognise(file);
      // Reset so the same file can be re-selected
      e.target.value = '';
    },
    [recognise]
  );

  return { scanState, error, fileInputRef, openPicker, handleFileChange };
}
