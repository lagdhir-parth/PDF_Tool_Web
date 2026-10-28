export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function sanitizeFilename(name: string, fallback: string = 'document.pdf'): string {
  const sanitized = name.replace(/[^a-zA-Z0-9-_. ]/g, '').trim();
  if (!sanitized) return fallback;
  return sanitized.endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;
}
