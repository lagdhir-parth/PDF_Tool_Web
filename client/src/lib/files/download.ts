import JSZip from 'jszip';
import confetti from 'canvas-confetti';

/**
 * Trigger confetti celebration when a user finishes downloading a transformed document
 */
export function fireConfetti() {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#3b82f6', '#6366f1', '#10b981', '#f59e0b'],
    });
  } catch {
    // Graceful fallback if confetti fails or is blocked
  }
}

/**
 * Downloads a Blob or Uint8Array as a file in the browser
 */
export function downloadBlob(data: Blob | Uint8Array, filename: string) {
  const blob = data instanceof Blob ? data : new Blob([data as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Clean up object URL after brief delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);

  fireConfetti();
}

/**
 * Bundles multiple files into a single ZIP and downloads it
 */
export async function downloadZip(
  files: Array<{ name: string; data: Uint8Array | Blob }>,
  zipFilename: string = 'documents.zip'
) {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.name, file.data);
  }

  const zipContent = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipContent);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = zipFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);

  fireConfetti();
}
