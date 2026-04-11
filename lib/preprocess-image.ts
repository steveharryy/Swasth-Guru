/**
 * Pre-processes an image file for better OCR results.
 * Converts to grayscale and boosts contrast using the Canvas API.
 */
export async function preprocessForOCR(file: File): Promise<Blob> {
  const img = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  
  // First draw the image
  ctx.drawImage(img, 0, 0);

  // Apply visual filters for OCR optimization
  // Grayscale + contrast boost + brightness adjustment
  ctx.filter = 'grayscale(1) contrast(1.8) brightness(1.1)';
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas toBlob failed'));
      }
    }, 'image/png');
  });
}
