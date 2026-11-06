import { StandardFonts, degrees, rgb } from 'pdf-lib';
import { loadPdfLibDoc } from '../../lib/pdf/load';
import type { TextOverlayItem } from '../../types/pdf';

function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

/**
 * Draws custom text overlays directly onto specified PDF pages
 */
export async function addTextToPdf(
  file: File,
  overlays: TextOverlayItem[],
  onProgress?: (progress: number, message: string) => void
): Promise<Uint8Array> {
  if (!overlays || overlays.length === 0) {
    throw new Error('Please add at least one text box to the document.');
  }

  const pdfDoc = await loadPdfLibDoc(file);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const total = overlays.length;

  for (let i = 0; i < total; i++) {
    const item = overlays[i];
    if (item.pageIndex >= 0 && item.pageIndex < pages.length) {
      const page = pages[item.pageIndex];
      const textColor = hexToRgb(item.color || '#000000');
      const ascender = font.heightAtSize(item.fontSize, { descender: false });

      // Invert angle for PDF Cartesian coordinate space (Y up) so it matches screen/CSS clockwise rotation
      const angleInPdf = -(item.rotation || 0);
      const rad = (angleInPdf * Math.PI) / 180;

      // Rotate around the top-left corner (item.x, item.y) matching CSS transform-origin: left top
      // Unrotated top-left is at (item.x, item.y); baseline is at (item.x, item.y - ascender)
      const drawX = item.x + ascender * Math.sin(rad);
      const drawY = item.y - ascender * Math.cos(rad);

      page.drawText(item.text, {
        x: drawX,
        y: drawY,
        size: item.fontSize,
        font,
        color: textColor,
        rotate: degrees(angleInPdf),
      });
    }

    onProgress?.(
      Math.round(((i + 1) / total) * 90),
      `Embedding text box ${i + 1} of ${total}...`
    );
  }

  onProgress?.(95, 'Saving document with text overlays...');
  const resultBytes = await pdfDoc.save();
  onProgress?.(100, 'Done!');

  return resultBytes;
}
