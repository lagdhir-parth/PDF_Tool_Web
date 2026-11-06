import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Focus,
  Loader2,
  RotateCw,
  StretchHorizontal,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";

interface PdfPagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  docProxy: PDFDocumentProxy | null;
  initialPageNumber: number;
  totalPages: number;
  initialRotation?: number;
}

type ZoomMode = "page" | "width" | "custom";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const PAGE_PADDING = 64; // Matches the 32px padding around the page.

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const isRenderCancelled = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  error.name === "RenderingCancelledException";

interface IconButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
}

function IconButton({
  label,
  onClick,
  children,
  disabled = false,
  active = false,
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active || undefined}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl px-2.5
        transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-35
        ${
          active
            ? "bg-slate-900/10 text-slate-900 ring-1 ring-inset ring-slate-900/10 dark:bg-white/15 dark:text-white dark:ring-white/15"
            : "text-slate-700 hover:bg-white/65 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/15 dark:hover:text-white"
        }`}
    >
      {children}
    </button>
  );
}

export const PdfPagePreviewModal: React.FC<PdfPagePreviewModalProps> = ({
  isOpen,
  onClose,
  docProxy,
  initialPageNumber,
  totalPages,
  initialRotation = 0,
}) => {
  const pageCount = Math.max(1, totalPages || docProxy?.numPages || 1);

  const [currentPage, setCurrentPage] = useState(() =>
    clamp(initialPageNumber, 1, pageCount),
  );
  const [pageInput, setPageInput] = useState(String(initialPageNumber));
  const [rotation, setRotation] = useState(initialRotation);
  const [zoomMode, setZoomMode] = useState<ZoomMode>("page");
  const [customZoom, setCustomZoom] = useState(1);
  const [viewerSize, setViewerSize] = useState({ width: 0, height: 0 });
  const [loadedPage, setLoadedPage] = useState<{
    page: PDFPageProxy;
    number: number;
    document: PDFDocumentProxy;
  } | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const renderQueueRef = useRef<Promise<void>>(Promise.resolve());
  const zoomAnchorRef = useRef<{ x: number; y: number } | null>(null);

  // Opening a different document resets the preview to its requested page.
  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setCurrentPage(clamp(initialPageNumber, 1, pageCount));
      setRotation(initialRotation);
      setZoomMode("page");
      setCustomZoom(1);
      setError(null);
    });
  }, [isOpen, docProxy, initialPageNumber, initialRotation, pageCount]);

  useEffect(() => {
    queueMicrotask(() => {
      setPageInput(String(currentPage));
    });
    viewerRef.current?.scrollTo({ top: 0, left: 0 });
  }, [currentPage]);

  // Measure the actual available viewing space, including when the window resizes.
  useEffect(() => {
    if (!isOpen || !viewerRef.current) return;
    const element = viewerRef.current;
    const measure = () => {
      const next = { width: element.clientWidth, height: element.clientHeight };
      setViewerSize((old) =>
        old.width === next.width && old.height === next.height ? old : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isOpen]);

  // PDF.js page acquisition is asynchronous; discard out-of-date requests.
  useEffect(() => {
    if (!isOpen || !docProxy) {
      queueMicrotask(() => {
        setLoadedPage(null);
      });
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setPageLoading(true);
        setError(null);
      }
    });

    docProxy
      .getPage(currentPage)
      .then((page) => {
        if (!cancelled) {
          setLoadedPage({ page, number: currentPage, document: docProxy });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.error("Unable to load PDF page:", err);
          setLoadedPage(null);
          setError("This page could not be loaded. Try another page.");
        }
      })
      .finally(() => {
        if (!cancelled) setPageLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, docProxy, currentPage]);

  const page =
    loadedPage?.document === docProxy && loadedPage.number === currentPage
      ? loadedPage.page
      : null;

  // Preserve a PDF's built-in rotation in addition to the preview rotation.
  const effectiveRotation = page
    ? (((page.rotate + rotation) % 360) + 360) % 360
    : rotation;

  const nativeViewport = useMemo(
    () => page?.getViewport({ scale: 1, rotation: effectiveRotation }) ?? null,
    [page, effectiveRotation],
  );

  const fitPageScale = nativeViewport
    ? Math.max(
        0.01,
        Math.min(
          Math.max(1, viewerSize.width - PAGE_PADDING) / nativeViewport.width,
          Math.max(1, viewerSize.height - PAGE_PADDING) / nativeViewport.height,
        ),
      )
    : 1;

  const fitWidthScale = nativeViewport
    ? Math.max(
        0.01,
        Math.max(1, viewerSize.width - PAGE_PADDING) / nativeViewport.width,
      )
    : 1;

  const scale =
    zoomMode === "page"
      ? fitPageScale
      : zoomMode === "width"
        ? fitWidthScale
        : customZoom;

  const viewport = useMemo(
    () => page?.getViewport({ scale, rotation: effectiveRotation }) ?? null,
    [page, scale, effectiveRotation],
  );

  // Serialize renders: a cancelled render must release its canvas first.
  useEffect(() => {
    if (!isOpen || !page || !viewport || !viewerSize.width) return;
    let disposed = false;
    renderTaskRef.current?.cancel();
    queueMicrotask(() => {
      if (!disposed) setRendering(true);
    });

    const job = renderQueueRef.current.then(async () => {
      if (disposed) return;
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d", { alpha: false });
      if (!canvas || !context) {
        if (!disposed) {
          setError("Unable to initialize the PDF preview canvas.");
          setRendering(false);
        }
        return;
      }

      // High-DPI text stays sharp, with a memory limit for very large pages.
      const outputScale = Math.max(
        0.1,
        Math.min(
          window.devicePixelRatio || 1,
          2,
          Math.sqrt(16_000_000 / (viewport.width * viewport.height)),
          16_384 / viewport.width,
          16_384 / viewport.height,
        ),
      );
      canvas.width = Math.max(1, Math.floor(viewport.width * outputScale));
      canvas.height = Math.max(1, Math.floor(viewport.height * outputScale));

      // A named variable is compatible with both older PDF.js typings
      // (canvasContext) and newer typings (canvas).
      const renderContext = {
        canvas,
        canvasContext: context,
        viewport,
        transform:
          outputScale !== 1
            ? [outputScale, 0, 0, outputScale, 0, 0]
            : undefined,
        background: "rgb(255, 255, 255)",
      };
      const task = page.render(renderContext);
      renderTaskRef.current = task;

      try {
        await task.promise;
        if (!disposed) setError(null);
      } catch (err: unknown) {
        if (!isRenderCancelled(err) && !disposed) {
          console.error("PDF page render failed:", err);
          setError("Unable to render this page. Try changing the zoom.");
        }
      } finally {
        if (renderTaskRef.current === task) renderTaskRef.current = null;
        if (!disposed) setRendering(false);
      }
    });

    renderQueueRef.current = job.catch((err: unknown) => {
      if (!disposed && !isRenderCancelled(err)) {
        console.error("PDF render setup failed:", err);
        setError("Unable to display the PDF page.");
        setRendering(false);
      }
    });

    return () => {
      disposed = true;
      renderTaskRef.current?.cancel();
    };
  }, [isOpen, page, viewport, viewerSize.width]);

  // Keep the visible center roughly stable when changing zoom levels.
  const setManualZoom = useCallback((next: number) => {
    const container = viewerRef.current;
    if (container) {
      zoomAnchorRef.current = {
        x:
          (container.scrollLeft + container.clientWidth / 2) /
          Math.max(1, container.scrollWidth),
        y:
          (container.scrollTop + container.clientHeight / 2) /
          Math.max(1, container.scrollHeight),
      };
    }
    setCustomZoom(clamp(next, MIN_ZOOM, MAX_ZOOM));
    setZoomMode("custom");
  }, []);

  useEffect(() => {
    const anchor = zoomAnchorRef.current;
    const container = viewerRef.current;
    if (!anchor || !container) return;
    zoomAnchorRef.current = null;
    container.scrollLeft =
      anchor.x * container.scrollWidth - container.clientWidth / 2;
    container.scrollTop =
      anchor.y * container.scrollHeight - container.clientHeight / 2;
  }, [scale]);

  const goToPage = useCallback(
    (number: number) => {
      const next = clamp(Math.round(number), 1, pageCount);
      setCurrentPage(next);
      setPageInput(String(next));
    },
    [pageCount],
  );

  const commitPageInput = () => {
    const parsed = Number.parseInt(pageInput, 10);
    goToPage(Number.isFinite(parsed) ? parsed : currentPage);
  };

  const downloadPdf = async () => {
    if (!docProxy || downloading) return;
    setDownloading(true);
    try {
      const bytes = await docProxy.getData();
      const blob = new Blob([new Uint8Array(bytes)], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "document.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("PDF download failed:", err);
      setError("Unable to download this document.");
    } finally {
      setDownloading(false);
    }
  };

  // Set focus once on opening, instead of stealing focus on every zoom/page change.
  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen]);

  // Modal keyboard shortcuts and focus trapping.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
        );
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!dialogRef.current?.contains(document.activeElement)) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      const target = event.target as HTMLElement;
      if (target instanceof HTMLInputElement || target.isContentEditable)
        return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPage(currentPage - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToPage(currentPage + 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        goToPage(1);
      } else if (event.key === "End") {
        event.preventDefault();
        goToPage(pageCount);
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setManualZoom(scale + 0.2);
      } else if (event.key === "-") {
        event.preventDefault();
        setManualZoom(scale - 0.2);
      } else if (event.key === "0") {
        event.preventDefault();
        setZoomMode("page");
      } else if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        setRotation((old) => (old + 90) % 360);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, currentPage, pageCount, goToPage, scale, setManualZoom]);

  if (!isOpen) return null;

  const busy = pageLoading || rendering;
  const canPreview = !!docProxy && !!page;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="PDF page preview"
      className="fixed inset-0 z-[100] flex h-dvh min-h-0 flex-col bg-slate-900/20 text-slate-900 backdrop-blur-md dark:bg-slate-950/35 dark:text-slate-100"
    >
      {/* Header intentionally has no heading: tools only, with a pinned close button. */}
      <header className="relative z-20 shrink-0 border-b border-white/40 bg-white/45 px-3 py-2.5 pr-16 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/35 sm:px-6 sm:pr-20">
        {/* The toolbar scrolls on small screens; the close button never scrolls away. */}
        <div className="mx-auto flex max-w-3xl items-center justify-start overflow-x-auto rounded-2xl border border-white/60 bg-white/35 p-1.5 shadow-sm [scrollbar-width:thin] dark:border-white/10 dark:bg-white/[0.07] md:justify-center">
          <IconButton
            label="Zoom out (-)"
            disabled={!canPreview || scale <= MIN_ZOOM}
            onClick={() => setManualZoom(scale - 0.2)}
          >
            <ZoomOut size={18} />
          </IconButton>
          <span
            className="w-14 shrink-0 text-center font-mono text-xs text-slate-700 dark:text-slate-200"
            aria-live="polite"
          >
            {Math.round(scale * 100)}%
          </span>
          <IconButton
            label="Zoom in (+)"
            disabled={!canPreview || scale >= MAX_ZOOM}
            onClick={() => setManualZoom(scale + 0.2)}
          >
            <ZoomIn size={18} />
          </IconButton>

          <span className="mx-1 h-6 w-px shrink-0 bg-slate-300/80 dark:bg-white/15" />
          <IconButton
            label="Fit entire page (0)"
            active={zoomMode === "page"}
            disabled={!canPreview}
            onClick={() => setZoomMode("page")}
          >
            <Focus size={18} />
            <span className="ml-1.5 whitespace-nowrap text-xs font-medium">
              Fit page
            </span>
          </IconButton>
          <IconButton
            label="Fit page width"
            active={zoomMode === "width"}
            disabled={!canPreview}
            onClick={() => setZoomMode("width")}
          >
            <StretchHorizontal size={18} />
            <span className="ml-1.5 whitespace-nowrap text-xs font-medium">
              Fit width
            </span>
          </IconButton>

          <span className="mx-1 h-6 w-px shrink-0 bg-slate-300/80 dark:bg-white/15" />
          <IconButton
            label="Rotate clockwise (R)"
            disabled={!canPreview}
            onClick={() => setRotation((old) => (old + 90) % 360)}
          >
            <RotateCw size={18} />
          </IconButton>
          <IconButton
            label="Download PDF"
            disabled={!docProxy || downloading}
            onClick={downloadPdf}
          >
            {downloading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
          </IconButton>
        </div>

        {/* Independent from toolbar overflow; always in the top-right corner. */}
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close PDF preview"
          title="Close preview (Esc)"
          onClick={onClose}
          className="absolute right-3 top-1/2 z-30 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-white/65 bg-white/65 text-slate-700 shadow-sm backdrop-blur-xl transition-all hover:bg-white/90 hover:text-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 sm:right-6"
        >
          <X size={20} />
        </button>
      </header>

      {/* Canvas viewing surface: fit-page uses the actual available size. */}
      <main
        ref={viewerRef}
        className="relative min-h-0 flex-1 overflow-auto overscroll-contain bg-transparent backdrop-blur-sm"
        aria-busy={busy}
      >
        <div className="flex h-max min-h-full w-max min-w-full items-center justify-center p-4 sm:p-8">
          {viewport && canPreview ? (
            <div
              className="relative shrink-0 overflow-hidden rounded-md bg-white shadow-[0_18px_65px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/10 dark:shadow-[0_18px_85px_rgba(0,0,0,0.45)]"
              style={{ width: viewport.width, height: viewport.height }}
            >
              <canvas
                ref={canvasRef}
                className="block"
                style={{ width: viewport.width, height: viewport.height }}
                aria-label={`PDF page ${currentPage}`}
                role="img"
              />
              {rendering && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]"
                  aria-label="Rendering page"
                >
                  <Loader2 className="h-7 w-7 animate-spin text-sky-600" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-72 w-56 items-center justify-center rounded-2xl border border-white/55 bg-white/45 text-slate-600 shadow-lg backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/40 dark:text-slate-300">
              {pageLoading ? (
                <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
              ) : (
                <div className="text-center text-sm">
                  <FileText className="mx-auto mb-3 h-9 w-9 opacity-50" />
                  {docProxy ? "Preview unavailable" : "No PDF document loaded"}
                </div>
              )}
            </div>
          )}
        </div>
        {error && (
          <div
            role="alert"
            className="sticky bottom-4 mx-auto w-fit max-w-[90%] rounded-xl border border-rose-300/50 bg-rose-50/85 px-4 py-2 text-center text-xs text-rose-700 shadow-lg backdrop-blur-xl dark:border-rose-400/30 dark:bg-rose-950/65 dark:text-rose-100"
          >
            {error}
          </div>
        )}
      </main>

      {/* Navigation */}
      <footer className="z-20 shrink-0 border-t border-white/40 bg-white/45 px-4 py-3 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/35 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 sm:justify-between">
          <p className="hidden text-xs text-slate-500 dark:text-slate-400 md:block">
            ← → Navigate · + / − Zoom · 0 Fit · R Rotate · Esc Close
          </p>
          <nav className="flex items-center gap-2" aria-label="Page navigation">
            <IconButton
              label="Previous page (Left arrow)"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronLeft size={20} />
            </IconButton>
            <span className="text-xs text-slate-600 dark:text-slate-300">
              Page
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={pageInput}
              onChange={(event) =>
                setPageInput(event.target.value.replace(/[^0-9]/g, ""))
              }
              onBlur={commitPageInput}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitPageInput();
                  event.currentTarget.blur();
                }
              }}
              aria-label="Page number"
              className="h-9 w-12 rounded-lg border border-white/65 bg-white/55 text-center font-mono text-sm text-slate-900 outline-none backdrop-blur-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-white/15 dark:bg-white/10 dark:text-white"
            />
            <span className="text-xs text-slate-600 dark:text-slate-300">
              of {pageCount}
            </span>
            <IconButton
              label="Next page (Right arrow)"
              disabled={currentPage >= pageCount}
              onClick={() => goToPage(currentPage + 1)}
            >
              <ChevronRight size={20} />
            </IconButton>
          </nav>
          <p className="hidden min-w-24 text-right text-xs text-slate-500 dark:text-slate-400 md:block">
            {zoomMode === "page"
              ? "Fit to screen"
              : zoomMode === "width"
                ? "Fit to width"
                : "Custom zoom"}
          </p>
        </div>
      </footer>
    </div>
  );
};
