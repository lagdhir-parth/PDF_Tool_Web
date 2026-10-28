import { loadPdfLibDoc, createPdfDocument } from '../../lib/pdf/load';

/**
 * Extracts specified 0-based page indices into a brand new PDF document
 */
export async function extractPdfPages(
  file: File,
  pagesToExtract: number[], // 0-based
  onProgress?: (progress: number, message: string) => void
): Promise<Uint8Array> {
  if (!pagesToExtract || pagesToExtract.length === 0) {
    throw new Error('Please select at least one page to extract.');
  }

  const sourceDoc = await loadPdfLibDoc(file);
  const totalPages = sourceDoc.getPageCount();

  // Validate out-of-range
  for (const idx of pagesToExtract) {
    if (idx < 0 || idx >= totalPages) {
      throw new Error(`Page index ${idx + 1} is out of bounds (1 to ${totalPages}).`);
    }
  }

  const newDoc = await createPdfDocument();
  const copiedPages = await newDoc.copyPages(sourceDoc, pagesToExtract);

  for (let i = 0; i < copiedPages.length; i++) {
    newDoc.addPage(copiedPages[i]);
    onProgress?.(
      Math.round(((i + 1) / copiedPages.length) * 90),
      `Extracting page ${i + 1} of ${copiedPages.length}...`
    );
  }

  onProgress?.(95, 'Saving extracted PDF...');
  const resultBytes = await newDoc.save();
  onProgress?.(100, 'Done!');

  return resultBytes;
}
