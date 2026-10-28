import { PageSizes } from 'pdf-lib';
import { createPdfDocument } from '../../lib/pdf/load';

export type PageSizeOption = 'fit' | 'a4' | 'letter';
export type PageOrientationOption = 'portrait' | 'landscape';
export type MarginOption = 'none' | 'small' | 'normal' | 'large';

export interface ImagesToPdfOptions {
  pageSize: PageSizeOption;
  orientation: PageOrientationOption;
  margin: MarginOption;
  onProgress?: (progress: number, message: string) => void;
}

const MARGIN_MAP: Record<MarginOption, number> = {
  none: 0,
  small: 18,   // 0.25 inch
  normal: 36,  // 0.5 inch
  large: 72,   // 1 inch
};

/**
 * Converts multiple JPG/PNG images to a single well-formatted PDF document
 */
export async function imagesToPdf(
  imageFiles: File[],
  options: ImagesToPdfOptions
): Promise<Uint8Array> {
  if (!imageFiles || imageFiles.length === 0) {
    throw new Error('Please select at least one image file.');
  }

  const pdfDoc = await createPdfDocument();
  const margin = MARGIN_MAP[options.margin] || 0;
  const total = imageFiles.length;

  for (let i = 0; i < total; i++) {
    const file = imageFiles[i];
    options.onProgress?.(
      Math.round(((i) / total) * 90),
      `Processing image "${file.name}" (${i + 1} of ${total})...`
    );

    const arrayBuffer = await file.arrayBuffer();
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

    let pdfImage;
    if (isPng) {
      pdfImage = await pdfDoc.embedPng(arrayBuffer);
    } else {
      pdfImage = await pdfDoc.embedJpg(arrayBuffer);
    }

    const imgWidth = pdfImage.width;
    const imgHeight = pdfImage.height;

    let targetPageWidth: number;
    let targetPageHeight: number;

    if (options.pageSize === 'fit') {
      targetPageWidth = imgWidth + margin * 2;
      targetPageHeight = imgHeight + margin * 2;
    } else {
      const baseSize = options.pageSize === 'letter' ? PageSizes.Letter : PageSizes.A4;
      if (options.orientation === 'landscape') {
        targetPageWidth = Math.max(baseSize[0], baseSize[1]);
        targetPageHeight = Math.min(baseSize[0], baseSize[1]);
      } else {
        targetPageWidth = Math.min(baseSize[0], baseSize[1]);
        targetPageHeight = Math.max(baseSize[0], baseSize[1]);
      }
    }

    const page = pdfDoc.addPage([targetPageWidth, targetPageHeight]);

    // Available space for the image
    const availWidth = targetPageWidth - margin * 2;
    const availHeight = targetPageHeight - margin * 2;

    // Scale to fit while maintaining aspect ratio
    const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    // Center image on the page
    const drawX = margin + (availWidth - drawWidth) / 2;
    const drawY = margin + (availHeight - drawHeight) / 2;

    page.drawImage(pdfImage, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });
  }

  options.onProgress?.(95, 'Building PDF...');
  const resultBytes = await pdfDoc.save();
  options.onProgress?.(100, 'Done!');

  return resultBytes;
}
