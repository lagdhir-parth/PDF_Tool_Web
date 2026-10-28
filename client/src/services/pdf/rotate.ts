import { degrees } from 'pdf-lib';
import { loadPdfLibDoc } from '../../lib/pdf/load';

export type RotationDelta = 90 | 180 | 270;

export interface RotatePdfOptions {
  rotationAngle: RotationDelta;
  targetPageIndices?: number[]; // 0-based; if empty/undefined, applies to all pages
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Rotates specific or all pages of a PDF
 */
export async function rotatePdf(
  file: File,
  options: RotatePdfOptions
): Promise<Uint8Array> {
  const pdfDoc = await loadPdfLibDoc(file);
  const pages = pdfDoc.getPages();
  const targetSet = options.targetPageIndices && options.targetPageIndices.length > 0
    ? new Set(options.targetPageIndices)
    : null; // null means rotate all

  const total = pages.length;
  for (let i = 0; i < total; i++) {
    if (targetSet === null || targetSet.has(i)) {
      const page = pages[i];
      const currentAngle = page.getRotation().angle;
      const newAngle = ((currentAngle + options.rotationAngle) % 360 + 360) % 360;
      page.setRotation(degrees(newAngle));
    }
    options.onProgress?.(
      Math.round(((i + 1) / total) * 90),
      `Rotating pages (${i + 1}/${total})...`
    );
  }

  options.onProgress?.(95, 'Saving rotated document...');
  const resultBytes = await pdfDoc.save();
  options.onProgress?.(100, 'Done!');

  return resultBytes;
}
