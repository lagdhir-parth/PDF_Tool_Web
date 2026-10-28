/**
 * Coordinate transformations between browser canvas/CSS space (origin top-left)
 * and PDF coordinate space (origin bottom-left, in PDF points where 72 points = 1 inch).
 */

export interface CoordinateContext {
  pageWidth: number;   // in PDF points
  pageHeight: number;  // in PDF points
  displayWidth: number; // rendered CSS/canvas pixel width
  displayHeight: number; // rendered CSS/canvas pixel height
  rotation?: number;   // 0, 90, 180, 270
}

/**
 * Converts screen/canvas (X, Y) top-left coordinates to PDF document point coordinates
 */
export function screenToPdfCoordinates(
  screenX: number,
  screenY: number,
  context: CoordinateContext
): { pdfX: number; pdfY: number } {
  const { pageWidth, pageHeight, displayWidth, displayHeight, rotation = 0 } = context;

  // Scale factor from display pixels to points
  const scaleX = pageWidth / displayWidth;
  const scaleY = pageHeight / displayHeight;

  // Normalized points in standard 0-rotation coordinate system
  let pointX = screenX * scaleX;
  // Convert Y from top-down to bottom-up
  let pointY = pageHeight - screenY * scaleY;

  // Handle page rotation normalization if applicable
  const normRotation = ((rotation % 360) + 360) % 360;
  if (normRotation === 90) {
    const temp = pointX;
    pointX = pointY;
    pointY = pageWidth - temp;
  } else if (normRotation === 180) {
    pointX = pageWidth - pointX;
    pointY = pageHeight - pointY;
  } else if (normRotation === 270) {
    const temp = pointX;
    pointX = pageHeight - pointY;
    pointY = temp;
  }

  return {
    pdfX: Math.max(0, Math.min(pageWidth, pointX)),
    pdfY: Math.max(0, Math.min(pageHeight, pointY)),
  };
}

/**
 * Converts PDF document point coordinates back to screen/canvas pixels
 */
export function pdfToScreenCoordinates(
  pdfX: number,
  pdfY: number,
  context: CoordinateContext
): { screenX: number; screenY: number } {
  const { pageWidth, pageHeight, displayWidth, displayHeight } = context;

  const scaleX = displayWidth / pageWidth;
  const scaleY = displayHeight / pageHeight;

  const screenX = pdfX * scaleX;
  const screenY = (pageHeight - pdfY) * scaleY;

  return {
    screenX,
    screenY,
  };
}
