import type { PDFDocumentProxy } from 'pdfjs-dist';

interface CacheEntry {
  dataUrl: string;
  lastUsed: number;
}

class ThumbnailCacheManager {
  private cache = new Map<string, CacheEntry>();
  private inFlight = new Map<string, Promise<string>>();
  private maxEntries = 200;
  private activeRenders = 0;
  private maxConcurrency = 3;
  private queue: Array<() => void> = [];

  private getCacheKey(docFingerprint: string, pageNumber: number, scale: number): string {
    return `${docFingerprint}_p${pageNumber}_s${scale.toFixed(2)}`;
  }

  private evictIfNeeded() {
    if (this.cache.size <= this.maxEntries) return;

    // Sort by lastUsed ascending and remove oldest 20%
    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].lastUsed - b[1].lastUsed
    );
    const toRemove = Math.max(1, Math.floor(this.maxEntries * 0.2));
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  private async acquireSlot(): Promise<void> {
    if (this.activeRenders < this.maxConcurrency) {
      this.activeRenders++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.activeRenders++;
        resolve();
      });
    });
  }

  private releaseSlot(): void {
    this.activeRenders--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next?.();
    }
  }

  public getCached(docFingerprint: string, pageNumber: number, scale = 0.5): string | null {
    const key = this.getCacheKey(docFingerprint, pageNumber, scale);
    const entry = this.cache.get(key);
    if (entry) {
      entry.lastUsed = Date.now();
      return entry.dataUrl;
    }
    return null;
  }

  public async getOrRenderThumbnail(
    doc: PDFDocumentProxy,
    docFingerprint: string,
    pageNumber: number,
    scale = 0.5
  ): Promise<string> {
    const key = this.getCacheKey(docFingerprint, pageNumber, scale);

    // 1. Check existing cache
    const cached = this.getCached(docFingerprint, pageNumber, scale);
    if (cached) {
      return cached;
    }

    // 2. Check in-flight render deduplication
    const existingPromise = this.inFlight.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    // 3. Queue and execute render
    const renderPromise = (async () => {
      await this.acquireSlot();
      try {
        // Double check cache after acquiring slot
        const doubleCheck = this.cache.get(key);
        if (doubleCheck) {
          doubleCheck.lastUsed = Date.now();
          return doubleCheck.dataUrl;
        }

        const page = await doc.getPage(pageNumber);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Canvas 2D context not available');
        }

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        // @ts-expect-error pdfjs typing compatibility
        await page.render(renderContext).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        // Free canvas memory
        canvas.width = 0;
        canvas.height = 0;

        this.cache.set(key, { dataUrl, lastUsed: Date.now() });
        this.evictIfNeeded();

        return dataUrl;
      } finally {
        this.releaseSlot();
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, renderPromise);
    return renderPromise;
  }

  public clearDocCache(docFingerprint: string): void {
    const prefix = `${docFingerprint}_`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  public clearAll(): void {
    this.cache.clear();
    this.inFlight.clear();
  }
}

export const thumbnailCache = new ThumbnailCacheManager();

