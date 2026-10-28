import { degrees } from 'pdf-lib';
import { loadPdfLibDoc, createPdfDocument } from '../../lib/pdf/load';
import type { PdfPageItem } from '../../types/pdf';

export interface OrganizePdfOptions {
  pages: PdfPageItem[];
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Creates a reorganized PDF according to the ordered page items specification
 */
export async function organizePdf(
  file: File,
  options: OrganizePdfOptions
): Promise<Uint8Array> {
  const { pages } = options;
  if (!pages || pages.length === 0) {
    throw new Error('At least one page must be included in the organized PDF.');
  }

  const sourceDoc = await loadPdfLibDoc(file);
  const newDoc = await createPdfDocument();
  const total = pages.length;

  for (let i = 0; i < total; i++) {
    const item = pages[i];
    options.onProgress?.(
      Math.round(((i) / total) * 90),
      `Assembling page ${i + 1} of ${total}...`
    );

    const [copiedPage] = await newDoc.copyPages(sourceDoc, [item.originalPageIndex]);

    // Apply rotation if any
    if (item.rotation !== 0) {
      const currentRotation = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((currentRotation + item.rotation) % 360));
    }

    newDoc.addPage(copiedPage);
  }

  options.onProgress?.(95, 'Saving reorganized PDF...');
  const resultBytes = await newDoc.save();
  options.onProgress?.(100, 'Done!');

  return resultBytes;
}
