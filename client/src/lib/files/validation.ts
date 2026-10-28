/**
 * File validation helpers for PDF and image documents
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePdfFile(file: File, maxSizeBytes: number = 100 * 1024 * 1024): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size === 0) {
    return { valid: false, error: `"${file.name}" is an empty file (0 bytes).` };
  }

  if (file.size > maxSizeBytes) {
    const sizeMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `"${file.name}" exceeds maximum allowed size of ${sizeMb} MB.` };
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return { valid: false, error: `"${file.name}" is not a valid PDF document.` };
  }

  return { valid: true };
}

export function validateImageFile(file: File, maxSizeBytes: number = 50 * 1024 * 1024): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size === 0) {
    return { valid: false, error: `"${file.name}" is empty (0 bytes).` };
  }

  if (file.size > maxSizeBytes) {
    return { valid: false, error: `"${file.name}" exceeds maximum allowed size.` };
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const ext = file.name.toLowerCase();
  const hasValidExt = ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png');

  if (!validTypes.includes(file.type) && !hasValidExt) {
    return { valid: false, error: `"${file.name}" must be a JPG or PNG image.` };
  }

  return { valid: true };
}
