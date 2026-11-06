import { loadPdfLibDoc, createPdfDocument } from '../../lib/pdf/load';

export interface MergeSourceItem {
  file: File;
  pageIndices?: number[];
}

export interface MergeOptions {
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Merges multiple PDF files into one single PDF document,
 * respecting user file order and per-file page selection.
 */
export async function mergePdfs(
  inputs: (File | MergeSourceItem)[],
  options?: MergeOptions
): Promise<Uint8Array> {
  if (!inputs || inputs.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge.');
  }

  const mergedDoc = await createPdfDocument();
  const totalFiles = inputs.length;

  for (let i = 0; i < totalFiles; i++) {
    const input = inputs[i];
    const file = input instanceof File ? input : input.file;
    const specifiedIndices = input instanceof File ? undefined : input.pageIndices;

    options?.onProgress?.(
      Math.round(((i) / totalFiles) * 90),
      `Merging "${file.name}" (${i + 1} of ${totalFiles})...`
    );

    const sourceDoc = await loadPdfLibDoc(file);
    const availableIndices = sourceDoc.getPageIndices();

    let indicesToCopy: number[];
    if (specifiedIndices && specifiedIndices.length > 0) {
      // Filter out indices exceeding document bounds
      indicesToCopy = specifiedIndices.filter(
        (idx) => idx >= 0 && idx < availableIndices.length
      );
    } else {
      indicesToCopy = availableIndices;
    }

    if (indicesToCopy.length > 0) {
      const copiedPages = await mergedDoc.copyPages(sourceDoc, indicesToCopy);
      for (const page of copiedPages) {
        mergedDoc.addPage(page);
      }
    }
  }

  options?.onProgress?.(95, 'Finalizing merged document...');
  const mergedBytes = await mergedDoc.save();
  options?.onProgress?.(100, 'Done!');

  return mergedBytes;
}
