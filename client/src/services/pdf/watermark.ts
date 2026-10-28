import { StandardFonts, degrees, rgb } from 'pdf-lib';
import { loadPdfLibDoc } from '../../lib/pdf/load';
import type { WatermarkOptions } from '../../types/pdf';

function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

/**
 * Adds text or image watermark overlays to PDF pages
 */
export async function watermarkPdf(
  file: File,
  options: WatermarkOptions,
  onProgress?: (progress: number, message: string) => void
): Promise<Uint8Array> {
  const pdfDoc = await loadPdfLibDoc(file);
  const pages = pdfDoc.getPages();
  const total = pages.length;

  let embeddedImage: import('pdf-lib').PDFImage | null = null;
  if (options.type === 'image' && options.imageFile) {
    const imgBuffer = await options.imageFile.arrayBuffer();
    const isPng = options.imageFile.type === 'image/png' || options.imageFile.name.toLowerCase().endsWith('.png');
    embeddedImage = isPng
      ? await pdfDoc.embedPng(imgBuffer)
      : await pdfDoc.embedJpg(imgBuffer);
  }

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const textColor = hexToRgb(options.textColor || '#e11d48');
  const opacity = Math.min(1, Math.max(0, options.opacity));
  const rotationDeg = degrees(options.rotation || 0);

  for (let i = 0; i < total; i++) {
    onProgress?.(
      Math.round(((i + 1) / total) * 90),
      `Watermarking page ${i + 1} of ${total}...`
    );

    const page = pages[i];
    const { width, height } = page.getSize();

    if (options.type === 'text') {
      const text = options.text || 'CONFIDENTIAL';
      const fontSize = options.fontSize || 48;
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      if (options.position === 'tiled') {
        const stepX = textWidth + 100;
        const stepY = textHeight + 80;
        for (let x = -50; x < width + 100; x += stepX) {
          for (let y = -50; y < height + 100; y += stepY) {
            page.drawText(text, {
              x,
              y,
              size: fontSize * 0.75,
              font,
              color: textColor,
              opacity: opacity * 0.5,
              rotate: rotationDeg,
            });
          }
        }
      } else {
        let x = (width - textWidth) / 2;
        let y = (height - textHeight) / 2;

        if (options.position === 'top-left') {
          x = 40;
          y = height - 40 - textHeight;
        } else if (options.position === 'top-right') {
          x = width - 40 - textWidth;
          y = height - 40 - textHeight;
        } else if (options.position === 'bottom-left') {
          x = 40;
          y = 40;
        } else if (options.position === 'bottom-right') {
          x = width - 40 - textWidth;
          y = 40;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: textColor,
          opacity,
          rotate: rotationDeg,
        });
      }
    } else if (options.type === 'image' && embeddedImage) {
      const scale = Math.min(180 / embeddedImage.width, 180 / embeddedImage.height, 1);
      const imgWidth = embeddedImage.width * scale;
      const imgHeight = embeddedImage.height * scale;

      let x = (width - imgWidth) / 2;
      let y = (height - imgHeight) / 2;

      if (options.position === 'top-left') {
        x = 40;
        y = height - 40 - imgHeight;
      } else if (options.position === 'top-right') {
        x = width - 40 - imgWidth;
        y = height - 40 - imgHeight;
      } else if (options.position === 'bottom-left') {
        x = 40;
        y = 40;
      } else if (options.position === 'bottom-right') {
        x = width - 40 - imgWidth;
        y = 40;
      }

      page.drawImage(embeddedImage, {
        x,
        y,
        width: imgWidth,
        height: imgHeight,
        opacity,
        rotate: rotationDeg,
      });
    }
  }

  onProgress?.(95, 'Saving watermarked document...');
  const resultBytes = await pdfDoc.save();
  onProgress?.(100, 'Done!');

  return resultBytes;
}
