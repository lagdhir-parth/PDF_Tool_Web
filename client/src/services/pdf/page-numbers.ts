import { StandardFonts, rgb } from 'pdf-lib';
import { loadPdfLibDoc } from '../../lib/pdf/load';
import type { PageNumberOptions } from '../../types/pdf';

function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

/**
 * Adds customizable page numbers to a PDF
 */
export async function addPageNumbers(
  file: File,
  options: PageNumberOptions,
  onProgress?: (progress: number, message: string) => void
): Promise<Uint8Array> {
  const pdfDoc = await loadPdfLibDoc(file);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  const textColor = hexToRgb(options.fontColor || '#000000');

  for (let i = 0; i < totalPages; i++) {
    if (i === 0 && options.skipFirstPage) {
      continue;
    }

    onProgress?.(
      Math.round(((i + 1) / totalPages) * 90),
      `Adding page number to page ${i + 1} of ${totalPages}...`
    );

    const page = pages[i];
    const { width, height } = page.getSize();
    const currentNum = options.startNumber + (options.skipFirstPage ? i - 1 : i);

    let textStr: string;
    switch (options.format) {
      case 'page-number':
        textStr = `Page ${currentNum}`;
        break;
      case 'n-of-total':
        textStr = `${currentNum} of ${totalPages}`;
        break;
      case 'page-n-of-total':
        textStr = `Page ${currentNum} of ${totalPages}`;
        break;
      case 'number':
      default:
        textStr = `${currentNum}`;
        break;
    }

    const textWidth = font.widthOfTextAtSize(textStr, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);
    const margin = options.margin;

    let x: number;
    let y: number;

    // Calculate X coordinate
    if (options.position.includes('center')) {
      x = (width - textWidth) / 2;
    } else if (options.position.includes('right')) {
      x = width - margin - textWidth;
    } else {
      x = margin;
    }

    // Calculate Y coordinate
    if (options.position.startsWith('top')) {
      y = height - margin - textHeight;
    } else {
      y = margin;
    }

    page.drawText(textStr, {
      x,
      y,
      size: options.fontSize,
      font,
      color: textColor,
    });
  }

  onProgress?.(95, 'Saving numbered PDF...');
  const resultBytes = await pdfDoc.save();
  onProgress?.(100, 'Done!');

  return resultBytes;
}
