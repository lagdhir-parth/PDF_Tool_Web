import { loadPdfLibDoc, createPdfDocument } from '../../lib/pdf/load';

import { parsePageRangeGroups } from '../../lib/utils/page-ranges';

export type SplitMode = 'all-pages' | 'custom-ranges' | 'fixed-ranges';

export interface SplitOptions {
  mode: SplitMode;
  customRanges?: string;
  everyNPages?: number;
  baseFilename?: string;
  onProgress?: (progress: number, message: string) => void;
}

export interface SplitResultFile {
  name: string;
  data: Uint8Array;
}

/**
 * Splits a PDF document into one or multiple PDFs
 */
export async function splitPdf(
  file: File,
  options: SplitOptions
): Promise<SplitResultFile[]> {
  const sourceDoc = await loadPdfLibDoc(file);
  const totalPages = sourceDoc.getPageCount();
  const baseName = options.baseFilename
    ? options.baseFilename.replace(/\.pdf$/i, '')
    : file.name.replace(/\.pdf$/i, '');

  let groups: number[][] = [];

  if (options.mode === 'all-pages') {
    for (let i = 0; i < totalPages; i++) {
      groups.push([i]);
    }
  } else if (options.mode === 'fixed-ranges') {
    const step = options.everyNPages && options.everyNPages > 0 ? options.everyNPages : 1;
    for (let i = 0; i < totalPages; i += step) {
      const group: number[] = [];
      for (let j = i; j < Math.min(i + step, totalPages); j++) {
        group.push(j);
      }
      groups.push(group);
    }
  } else if (options.mode === 'custom-ranges') {
    if (!options.customRanges || !options.customRanges.trim()) {
      throw new Error('Please enter valid page ranges (e.g., 1-3, 5-7, 9).');
    }
    groups = parsePageRangeGroups(options.customRanges, totalPages);
  }

  if (groups.length === 0) {
    throw new Error('No valid pages to split.');
  }

  const results: SplitResultFile[] = [];

  for (let idx = 0; idx < groups.length; idx++) {
    const group = groups[idx];
    options.onProgress?.(
      Math.round(((idx) / groups.length) * 90),
      `Creating part ${idx + 1} of ${groups.length}...`
    );

    const subDoc = await createPdfDocument();
    const copiedPages = await subDoc.copyPages(sourceDoc, group);
    for (const page of copiedPages) {
      subDoc.addPage(page);
    }

    const data = await subDoc.save();
    let outputName: string;
    if (group.length === 1) {
      outputName = `${baseName}_page_${group[0] + 1}.pdf`;
    } else {
      outputName = `${baseName}_pages_${group[0] + 1}-${group[group.length - 1] + 1}.pdf`;
    }

    results.push({
      name: outputName,
      data,
    });
  }

  options.onProgress?.(100, 'Split complete!');
  return results;
}
