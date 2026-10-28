import { loadPdfLibDoc, createPdfDocument } from '../../lib/pdf/load';

/**
 * Creates a new PDF excluding the specified page indices
 */
export async function deletePdfPages(
  file: File,
  pagesToDelete: number[], // 0-based
  onProgress?: (progress: number, message: string) => void
): Promise<Uint8Array> {
  const sourceDoc = await loadPdfLibDoc(file);
  const totalPages = sourceDoc.getPageCount();

  const deleteSet = new Set(pagesToDelete);
  const pagesToKeep: number[] = [];

  for (let i = 0; i < totalPages; i++) {
    if (!deleteSet.has(i)) {
      pagesToKeep.push(i);
    }
  }

  if (pagesToKeep.length === 0) {
    throw new Error('Cannot delete all pages. The output PDF must contain at least one page.');
  }

  if (pagesToKeep.length === totalPages) {
    throw new Error('No pages were selected for deletion.');
  }

  onProgress?.(30, `Keeping ${pagesToKeep.length} of ${totalPages} pages...`);

  const newDoc = await createPdfDocument();
  const copiedPages = await newDoc.copyPages(sourceDoc, pagesToKeep);

  for (let i = 0; i < copiedPages.length; i++) {
    newDoc.addPage(copiedPages[i]);
    onProgress?.(
      30 + Math.round(((i + 1) / copiedPages.length) * 60),
      `Assembling page ${i + 1} of ${copiedPages.length}...`
    );
  }

  onProgress?.(95, 'Saving updated PDF...');
  const resultBytes = await newDoc.save();
  onProgress?.(100, 'Done!');

  return resultBytes;
}
