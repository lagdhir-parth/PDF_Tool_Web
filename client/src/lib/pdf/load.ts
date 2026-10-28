import { PDFDocument } from 'pdf-lib';

/**
 * Safely loads a PDF document using pdf-lib with clear error reporting
 */
export async function loadPdfLibDoc(source: File | ArrayBuffer | Uint8Array): Promise<PDFDocument> {
  try {
    let bytes: Uint8Array;
    if (source instanceof File) {
      const buffer = await source.arrayBuffer();
      bytes = new Uint8Array(buffer);
    } else if (source instanceof ArrayBuffer) {
      bytes = new Uint8Array(source);
    } else {
      bytes = source;
    }

    // Verify minimal PDF header (%PDF-)
    if (bytes.length < 5) {
      throw new Error('The selected file is empty or corrupted.');
    }

    const header = String.fromCharCode(...bytes.slice(0, 5));
    if (!header.startsWith('%PDF')) {
      throw new Error('The selected file does not appear to be a valid PDF document.');
    }

    return await PDFDocument.load(bytes, {
      ignoreEncryption: false,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.toLowerCase().includes('encrypt') || errorMsg.toLowerCase().includes('password')) {
      throw new Error('Password-protected or encrypted PDFs are not supported. Please remove the password first.', { cause: err });
    }
    throw new Error(`Failed to load PDF: ${errorMsg}`, { cause: err });
  }
}

/**
 * Creates a new empty PDFDocument
 */
export async function createPdfDocument(): Promise<PDFDocument> {
  return await PDFDocument.create();
}
