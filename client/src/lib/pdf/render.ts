import * as pdfjsLib from 'pdfjs-dist';
// Vite handles importing the worker file via ?url query as a local bundled asset
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Ensure worker is configured properly locally without external CDN
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
}

export { pdfjsLib };

/**
 * Loads a PDF document using PDF.js from a File or ArrayBuffer
 */
export async function loadPdfJsDocument(source: File | ArrayBuffer | Uint8Array) {
  let data: ArrayBuffer | Uint8Array;
  if (source instanceof File) {
    data = await source.arrayBuffer();
  } else {
    data = source;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(data),
    cMapUrl: undefined,
    standardFontDataUrl: undefined,
  });

  return await loadingTask.promise;
}

/**
 * Renders a PDF page to a canvas and returns a data URL or image blob
 */
export async function renderPageToThumbnail(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number = 0.4
): Promise<string> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context not available');
  }

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  // @ts-expect-error pdfjs typing compatibility
  await page.render(renderContext).promise;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

  // Clean up canvas
  canvas.width = 0;
  canvas.height = 0;

  return dataUrl;
}

/**
 * Quick helper to get page count from a File
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const doc = await loadPdfJsDocument(file);
  const count = doc.numPages;
  doc.cleanup?.();
  return count;
}
