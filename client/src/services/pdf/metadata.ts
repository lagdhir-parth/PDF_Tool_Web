import { loadPdfLibDoc } from '../../lib/pdf/load';
import type { PdfMetadata } from '../../types/pdf';

/**
 * Reads metadata from a PDF file
 */
export async function getPdfMetadata(file: File): Promise<PdfMetadata> {
  const pdfDoc = await loadPdfLibDoc(file);
  const title = pdfDoc.getTitle();
  const author = pdfDoc.getAuthor();
  const subject = pdfDoc.getSubject();
  const keywords = pdfDoc.getKeywords();
  const creator = pdfDoc.getCreator();
  const producer = pdfDoc.getProducer();
  const creationDate = pdfDoc.getCreationDate();
  const modificationDate = pdfDoc.getModificationDate();

  return {
    title: title || '',
    author: author || '',
    subject: subject || '',
    keywords: keywords || '',
    creator: creator || '',
    producer: producer || '',
    creationDate: creationDate ? creationDate.toLocaleString() : '',
    modificationDate: modificationDate ? modificationDate.toLocaleString() : '',
  };
}

/**
 * Saves updated metadata fields back into the PDF
 */
export async function updatePdfMetadata(
  file: File,
  metadata: PdfMetadata,
  onProgress?: (progress: number, message: string) => void
): Promise<Uint8Array> {
  onProgress?.(20, 'Reading PDF structure...');
  const pdfDoc = await loadPdfLibDoc(file);

  onProgress?.(50, 'Writing metadata properties...');
  if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
  if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
  if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
  if (metadata.keywords !== undefined) {
    const list = metadata.keywords ? metadata.keywords.split(',').map((k) => k.trim()) : [];
    pdfDoc.setKeywords(list);
  }
  if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator);
  if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer);

  pdfDoc.setModificationDate(new Date());

  onProgress?.(85, 'Saving PDF...');
  const resultBytes = await pdfDoc.save();
  onProgress?.(100, 'Done!');

  return resultBytes;
}
