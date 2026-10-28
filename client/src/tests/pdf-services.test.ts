import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { mergePdfs } from '../services/pdf/merge';
import { splitPdf } from '../services/pdf/split';
import { organizePdf } from '../services/pdf/organize';
import { rotatePdf } from '../services/pdf/rotate';
import { addPageNumbers } from '../services/pdf/page-numbers';
import { watermarkPdf } from '../services/pdf/watermark';
import { deletePdfPages } from '../services/pdf/delete-pages';
import { extractPdfPages } from '../services/pdf/extract';
import { updatePdfMetadata, getPdfMetadata } from '../services/pdf/metadata';
import { parsePageRange, parsePageRangeGroups, formatPageIndices } from '../lib/utils/page-ranges';
import { validatePdfFile, validateImageFile } from '../lib/files/validation';
import { screenToPdfCoordinates } from '../lib/pdf/coordinates';

/** Helper to generate a test PDF file in memory */
async function createMockPdf(pageCount: number, name: string = 'test.pdf'): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([595, 842]);
    page.drawText(`Page ${i + 1}`, { x: 50, y: 750, size: 24 });
  }
  const bytes = await doc.save();
  return new File([bytes as unknown as BlobPart], name, { type: 'application/pdf' });
}

describe('PDF Processing Services — Automated Verification', () => {
  it('Merge PDF: Combines multiple PDFs preserving page counts and order', async () => {
    const fileA = await createMockPdf(3, 'docA.pdf');
    const fileB = await createMockPdf(2, 'docB.pdf');

    const mergedBytes = await mergePdfs([fileA, fileB]);
    expect(mergedBytes).toBeInstanceOf(Uint8Array);

    const mergedDoc = await PDFDocument.load(mergedBytes);
    expect(mergedDoc.getPageCount()).toBe(5);
  });

  it('Split PDF: Separates pages by custom ranges and all pages', async () => {
    const file = await createMockPdf(5, 'sample.pdf');

    // Split custom ranges
    const rangeResults = await splitPdf(file, {
      mode: 'custom-ranges',
      customRanges: '1-2, 4-5',
    });
    expect(rangeResults).toHaveLength(2);

    const part1 = await PDFDocument.load(rangeResults[0].data);
    expect(part1.getPageCount()).toBe(2);

    const part2 = await PDFDocument.load(rangeResults[1].data);
    expect(part2.getPageCount()).toBe(2);

    // Split all pages
    const allResults = await splitPdf(file, { mode: 'all-pages' });
    expect(allResults).toHaveLength(5);
  });

  it('Organize PDF: Reorders, duplicates, and preserves page structure', async () => {
    const file = await createMockPdf(3, 'original.pdf');

    // Reorder: Page 3, Page 1, Page 2, and Duplicate Page 1
    const organizedBytes = await organizePdf(file, {
      pages: [
        { id: '1', originalPageIndex: 2, pageNumber: 3, rotation: 0, selected: false },
        { id: '2', originalPageIndex: 0, pageNumber: 1, rotation: 0, selected: false },
        { id: '3', originalPageIndex: 1, pageNumber: 2, rotation: 0, selected: false },
        { id: '4', originalPageIndex: 0, pageNumber: 1, rotation: 90, selected: false },
      ],
    });

    const doc = await PDFDocument.load(organizedBytes);
    expect(doc.getPageCount()).toBe(4);
    expect(doc.getPage(3).getRotation().angle).toBe(90);
  });

  it('Rotate PDF: Correctly updates page rotation angles', async () => {
    const file = await createMockPdf(2, 'rotate.pdf');

    const rotatedBytes = await rotatePdf(file, {
      rotationAngle: 90,
    });

    const doc = await PDFDocument.load(rotatedBytes);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(1).getRotation().angle).toBe(90);
  });

  it('Add Page Numbers: Appends text to document pages', async () => {
    const file = await createMockPdf(3, 'numbers.pdf');

    const numberedBytes = await addPageNumbers(file, {
      position: 'bottom-center',
      format: 'page-n-of-total',
      fontSize: 12,
      fontColor: '#000000',
      margin: 36,
      startNumber: 1,
      skipFirstPage: false,
    });

    const doc = await PDFDocument.load(numberedBytes);
    expect(doc.getPageCount()).toBe(3);
  });

  it('Watermark PDF: Overlays custom text across pages', async () => {
    const file = await createMockPdf(2, 'watermark.pdf');

    const watermarkedBytes = await watermarkPdf(file, {
      type: 'text',
      text: 'SECRET TEST',
      textColor: '#e11d48',
      fontSize: 48,
      opacity: 0.5,
      rotation: 45,
      position: 'center',
    });

    const doc = await PDFDocument.load(watermarkedBytes);
    expect(doc.getPageCount()).toBe(2);
  });

  it('Delete PDF Pages: Successfully removes selected pages', async () => {
    const file = await createMockPdf(4, 'delete.pdf');

    // Delete page index 1 and 2 (2nd and 3rd page)
    const resultBytes = await deletePdfPages(file, [1, 2]);
    const doc = await PDFDocument.load(resultBytes);

    expect(doc.getPageCount()).toBe(2);
  });

  it('Extract PDF Pages: Creates new document with only selected pages', async () => {
    const file = await createMockPdf(5, 'extract.pdf');

    // Extract pages 1 and 4 (indices 0 and 3)
    const resultBytes = await extractPdfPages(file, [0, 3]);
    const doc = await PDFDocument.load(resultBytes);

    expect(doc.getPageCount()).toBe(2);
  });

  it('PDF Metadata Editor: Reads and updates document info', async () => {
    const file = await createMockPdf(1, 'metadata.pdf');

    const updatedBytes = await updatePdfMetadata(file, {
      title: 'Architectural Document',
      author: 'Lead Architect',
      subject: 'System Specifications',
      keywords: 'react, vite, pdf',
    });

    const doc = await PDFDocument.load(updatedBytes);
    expect(doc.getTitle()).toBe('Architectural Document');
    expect(doc.getAuthor()).toBe('Lead Architect');
    expect(doc.getSubject()).toBe('System Specifications');
    expect(doc.getKeywords()).toContain('react');

    const meta = await getPdfMetadata(
      new File([updatedBytes as unknown as BlobPart], 'check.pdf', { type: 'application/pdf' })
    );
    expect(meta.title).toBe('Architectural Document');
  });

  it('Page Range Parsing: Handles single, ranges, and validation', () => {
    expect(parsePageRange('1-3, 5', 10)).toEqual([0, 1, 2, 4]);
    expect(parsePageRange('2, 4, 6', 6)).toEqual([1, 3, 5]);
    expect(formatPageIndices([0, 1, 2, 4])).toBe('1-3, 5');
    expect(parsePageRangeGroups('1-2, 3-4', 5)).toEqual([[0, 1], [2, 3]]);

    expect(() => parsePageRange('invalid', 5)).toThrow();
  });

  it('File Validation: Accurately checks PDF and image validity', async () => {
    const validPdf = await createMockPdf(1, 'valid.pdf');
    expect(validatePdfFile(validPdf).valid).toBe(true);

    const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' });
    expect(validatePdfFile(emptyFile).valid).toBe(false);

    const notPdf = new File(['hello'], 'test.txt', { type: 'text/plain' });
    expect(validatePdfFile(notPdf).valid).toBe(false);

    const validJpg = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });
    expect(validateImageFile(validJpg).valid).toBe(true);
  });

  it('Coordinates Transformation: Converts screen top-left to PDF bottom-left points', () => {
    const coords = screenToPdfCoordinates(100, 100, {
      pageWidth: 595,
      pageHeight: 842,
      displayWidth: 595,
      displayHeight: 842,
    });

    expect(coords.pdfX).toBe(100);
    // Y inverted from top-down to bottom-up: 842 - 100 = 742
    expect(coords.pdfY).toBe(742);
  });
});
