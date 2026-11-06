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
  // Invert angle for PDF Cartesian coordinate space (Y up) so it matches screen/CSS clockwise rotation
  const angleInPdf = -(options.rotation || 0);
  const rotationDeg = degrees(angleInPdf);
  const rad = (angleInPdf * Math.PI) / 180;

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

      // Text watermarks must always be centered on the PDF page,
      // accounting for rotation and text dimensions.
      const cx = textWidth / 2;
      const cy = textHeight / 2;
      const rotCx = cx * Math.cos(rad) - cy * Math.sin(rad);
      const rotCy = cx * Math.sin(rad) + cy * Math.cos(rad);

      const x = width / 2 - rotCx;
      const y = height / 2 - rotCy;

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: textColor,
        opacity,
        rotate: rotationDeg,
      });
    } else if (options.type === 'image' && embeddedImage) {
      const scale = Math.min(180 / embeddedImage.width, 180 / embeddedImage.height, 1);
      const imgWidth = embeddedImage.width * scale;
      const imgHeight = embeddedImage.height * scale;

      let targetCenterX = width / 2;
      let targetCenterY = height / 2;

      if (options.position === 'top-left') {
        targetCenterX = 40 + imgWidth / 2;
        targetCenterY = height - 40 - imgHeight / 2;
      } else if (options.position === 'top-right') {
        targetCenterX = width - 40 - imgWidth / 2;
        targetCenterY = height - 40 - imgHeight / 2;
      } else if (options.position === 'bottom-left') {
        targetCenterX = 40 + imgWidth / 2;
        targetCenterY = 40 + imgHeight / 2;
      } else if (options.position === 'bottom-right') {
        targetCenterX = width - 40 - imgWidth / 2;
        targetCenterY = 40 + imgHeight / 2;
      }

      // Rotate around image center
      const imgCx = imgWidth / 2;
      const imgCy = imgHeight / 2;
      const rotImgCx = imgCx * Math.cos(rad) - imgCy * Math.sin(rad);
      const rotImgCy = imgCx * Math.sin(rad) + imgCy * Math.cos(rad);

      const x = targetCenterX - rotImgCx;
      const y = targetCenterY - rotImgCy;

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
