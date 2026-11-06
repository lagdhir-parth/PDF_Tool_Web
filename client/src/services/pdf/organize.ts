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
  const { pages, onProgress } = options;
  if (!pages || pages.length === 0) {
    throw new Error('At least one page must be included in the organized PDF.');
  }

  onProgress?.(10, 'Loading original document...');
  const sourceDoc = await loadPdfLibDoc(file);
  const newDoc = await createPdfDocument();

  // Preserve document metadata
  const title = sourceDoc.getTitle();
  if (title) newDoc.setTitle(title);
  const author = sourceDoc.getAuthor();
  if (author) newDoc.setAuthor(author);
  const subject = sourceDoc.getSubject();
  if (subject) newDoc.setSubject(subject);
  const keywords = sourceDoc.getKeywords();
  if (keywords) newDoc.setKeywords([keywords]);
  const creator = sourceDoc.getCreator();
  if (creator) newDoc.setCreator(creator);
  const producer = sourceDoc.getProducer();
  if (producer) newDoc.setProducer(producer);

  const total = pages.length;
  onProgress?.(20, `Copying ${total} page${total === 1 ? '' : 's'}...`);

  // Batch-copy ALL requested pages in a single call.
  // Passing all indices together to newDoc.copyPages ensures a single PDFObjectCopier
  // is used, deduplicating shared resources (embedded fonts, images, form XObjects, etc.)
  // across all pages. Copying page-by-page in a loop recreates the copier each time,
  // causing shared resources to be duplicated onto every page and drastically inflating the file size.
  const pageIndices = pages.map((p) => p.originalPageIndex);
  const copiedPages = await newDoc.copyPages(sourceDoc, pageIndices);

  for (let i = 0; i < total; i++) {
    const item = pages[i];
    const copiedPage = copiedPages[i];

    // Apply rotation if any
    if (item.rotation !== 0) {
      const currentRotation = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees(((currentRotation + item.rotation) % 360 + 360) % 360));
    }

    newDoc.addPage(copiedPage);

    if (i % 25 === 0 || i === total - 1) {
      onProgress?.(
        20 + Math.round(((i + 1) / total) * 70),
        `Assembling page ${i + 1} of ${total}...`
      );
    }
  }

  onProgress?.(95, 'Saving reorganized PDF...');
  const resultBytes = await newDoc.save({ useObjectStreams: true });
  onProgress?.(100, 'Done!');

  return resultBytes;
}
