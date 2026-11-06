import { useState, useEffect } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { loadPdfJsDocument } from '../lib/pdf/render';
import { thumbnailCache } from '../lib/pdf/thumbnail-cache';
import type { PdfPageItem } from '../types/pdf';

export function usePdfDocument(file: File | null) {
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [docProxy, setDocProxy] = useState<PDFDocumentProxy | null>(null);
  const [docFingerprint, setDocFingerprint] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;
    let activeDoc: PDFDocumentProxy | null = null;

    async function load() {
      if (!file) {
        setPages([]);
        setTotalPages(0);
        setIsLoading(false);
        setError(null);
        setDocProxy(null);
        setDocFingerprint('');
        return;
      }

      setIsLoading(true);
      setError(null);

      const fingerprint = `${file.name}_${file.size}_${file.lastModified}`;
      setDocFingerprint(fingerprint);

      try {
        const doc = await loadPdfJsDocument(file);
        if (isCancelled) {
          doc.cleanup?.();
          return;
        }

        activeDoc = doc;
        setDocProxy(doc);
        const count = doc.numPages;
        setTotalPages(count);

        // Fast metadata & structure initialization: immediate responsive UI
        const initialItems: PdfPageItem[] = Array.from({ length: count }, (_, i) => ({
          id: `page_${i + 1}`,
          originalPageIndex: i,
          pageNumber: i + 1,
          rotation: 0,
          selected: false,
          thumbnailUrl: undefined,
        }));

        setPages(initialItems);
        // CRITICAL: Document loading is finished! Do not block the UI waiting for all thumbnails.
        setIsLoading(false);

        // Opportunistically generate page 1 thumbnail for instant single-page previews
        if (count > 0) {
          thumbnailCache
            .getOrRenderThumbnail(doc, fingerprint, 1, 0.5)
            .then((firstThumb) => {
              if (isCancelled) return;
              setPages((prev) =>
                prev.map((item) =>
                  item.originalPageIndex === 0
                    ? { ...item, thumbnailUrl: firstThumb }
                    : item
                )
              );
            })
            .catch(() => {
              // Non-blocking thumbnail generation
            });
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
      if (activeDoc) {
        activeDoc.cleanup?.();
      }
    };
  }, [file]);

  return {
    pages,
    setPages,
    totalPages,
    isLoading,
    error,
    docProxy,
    docFingerprint,
  };
}
