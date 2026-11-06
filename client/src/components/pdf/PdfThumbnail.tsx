import React, { useEffect, useState, useRef } from "react";
import { RotateCw, Check, Loader2, Eye } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PdfPageItem } from "../../types/pdf";
import { thumbnailCache } from "../../lib/pdf/thumbnail-cache";

interface PdfThumbnailProps {
  page: PdfPageItem;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
  onRotate?: (e: React.MouseEvent) => void;
  onPreview?: (page: PdfPageItem) => void;
  showSelectCheckbox?: boolean;
  showRotateButton?: boolean;
  showPreviewButton?: boolean;
  docProxy?: PDFDocumentProxy | null;
  docFingerprint?: string;
  className?: string;
}

export const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  page,
  isSelected = false,
  onToggleSelect,
  onRotate,
  onPreview,
  showSelectCheckbox = true,
  showRotateButton = true,
  showPreviewButton = true,
  docProxy,
  docFingerprint,
  className = "",
}) => {
  const [cachedUrl, setCachedUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(!page.thumbnailUrl);
  const containerRef = useRef<HTMLDivElement>(null);

  const thumbUrl = page.thumbnailUrl || cachedUrl;

  // Viewport-based on-demand rendering using IntersectionObserver & bounded cache
  useEffect(() => {
    if (thumbUrl || !docProxy || !docFingerprint) return;

    let isCancelled = false;
    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          observer.disconnect();
          setIsLoading(true);
          thumbnailCache
            .getOrRenderThumbnail(
              docProxy,
              docFingerprint,
              page.pageNumber,
              0.45,
            )
            .then((url) => {
              if (!isCancelled) {
                setCachedUrl(url);
                setIsLoading(false);
              }
            })
            .catch((err) => {
              if (!isCancelled) {
                console.warn(
                  `Error generating thumbnail for page ${page.pageNumber}:`,
                  err,
                );
                setIsLoading(false);
              }
            });
        }
      },
      { rootMargin: "250px" }, // Overscan buffer to render just before entering viewport
    );

    observer.observe(target);

    return () => {
      isCancelled = true;
      observer.disconnect();
    };
  }, [thumbUrl, docProxy, docFingerprint, page.pageNumber]);

  return (
    <div
      ref={containerRef}
      onClick={onToggleSelect}
      className={`group relative flex flex-col items-center bg-white rounded-2xl border-2 transition-all duration-200 select-none cursor-pointer overflow-hidden shadow-xs hover:shadow-md ${
        isSelected
          ? "border-indigo-600 ring-2 ring-indigo-500/30"
          : "border-slate-200 hover:border-slate-300"
      } ${className}`}
    >
      {/* Top Header / Checkbox, Page Number, and Action Icons */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-700">
        <span className="flex items-center gap-1.5 truncate">
          {showSelectCheckbox && (
            <div
              className={`w-4 h-4 rounded shrink-0 flex items-center justify-center transition-colors ${
                isSelected
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-300 bg-white group-hover:border-slate-400"
              }`}
            >
              {isSelected && <Check className="w-3 h-3 stroke-3" />}
            </div>
          )}
          <span className="truncate">Page {page.pageNumber}</span>
        </span>

        <div className="flex items-center gap-1">
          {page.rotation !== 0 && (
            <span className="text-[10px] text-indigo-600 font-mono bg-indigo-50 px-1.5 py-0.5 rounded">
              {page.rotation}°
            </span>
          )}
        </div>
      </div>

      {/* Thumbnail Image Viewport */}
      <div className="relative w-full aspect-[1/1.414] bg-slate-100 flex items-center justify-center p-2 overflow-hidden">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={`Page ${page.pageNumber}`}
            className="w-full h-full object-contain rounded shadow-2xs transition-transform duration-200"
            style={{ transform: `rotate(${page.rotation}deg)` }}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center text-slate-400 gap-1.5">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span className="text-[10px]">Loading preview...</span>
              </>
            ) : (
              <span className="text-[10px] font-mono text-slate-400">
                Page {page.pageNumber}
              </span>
            )}
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
          {showRotateButton && onRotate && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onRotate(e);
              }}
              className="pointer-events-auto p-2 bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-full shadow-md active:scale-95 transition-all"
              title="Rotate 90° clockwise"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          {showPreviewButton && onPreview && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onPreview(page);
              }}
              className="pointer-events-auto p-2 bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-full shadow-md active:scale-95 transition-all"
              title="Inspect page preview"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
