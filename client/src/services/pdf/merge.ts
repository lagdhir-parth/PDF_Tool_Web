import { loadPdfLibDoc, createPdfDocument } from '../../lib/pdf/load';


export interface MergeOptions {
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Merges multiple PDF files into one single PDF document
 */
export async function mergePdfs(
  files: File[],
  options?: MergeOptions
): Promise<Uint8Array> {
  if (!files || files.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge.');
  }

  const mergedDoc = await createPdfDocument();
  const totalFiles = files.length;

  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    options?.onProgress?.(
      Math.round(((i) / totalFiles) * 90),
      `Merging "${file.name}" (${i + 1} of ${totalFiles})...`
    );

    const sourceDoc = await loadPdfLibDoc(file);
    const copiedPages = await mergedDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());

    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }
  }

  options?.onProgress?.(95, 'Finalizing merged document...');
  const mergedBytes = await mergedDoc.save();
  options?.onProgress?.(100, 'Done!');

  return mergedBytes;
}
