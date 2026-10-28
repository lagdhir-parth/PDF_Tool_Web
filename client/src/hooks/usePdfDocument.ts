import { useState, useEffect } from 'react';
import { loadPdfJsDocument, renderPageToThumbnail } from '../lib/pdf/render';
import type { PdfPageItem } from '../types/pdf';

export function usePdfDocument(file: File | null) {
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      if (!file) {
        setPages([]);
        setTotalPages(0);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const doc = await loadPdfJsDocument(file);
        if (isCancelled) return;

        const count = doc.numPages;
        setTotalPages(count);

        // First initialize placeholder items quickly so the UI responds instantly
        const initialItems: PdfPageItem[] = Array.from({ length: count }, (_, i) => ({
          id: `page_${i + 1}`,
          originalPageIndex: i,
          pageNumber: i + 1,
          rotation: 0,
          selected: false,
          thumbnailUrl: undefined,
        }));

        setPages(initialItems);

        // Sequentially render thumbnails without freezing UI
        for (let i = 1; i <= count; i++) {
          if (isCancelled) break;
          try {
            const thumbUrl = await renderPageToThumbnail(doc, i, 0.35);
            if (isCancelled) break;

            setPages((prev) =>
              prev.map((item) =>
                item.originalPageIndex === i - 1
                  ? { ...item, thumbnailUrl: thumbUrl }
                  : item
              )
            );
          } catch (thumbErr) {
            console.warn(`Failed thumbnail for page ${i}:`, thumbErr);
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  return {
    pages,
    setPages,
    totalPages,
    isLoading,
    error,
  };
}
