import React, { useState, useEffect } from "react";
import { Hash, Sparkles, ChevronLeft, ChevronRight, Loader2, Eye } from "lucide-react";
import { ToolLayout } from "../../components/layout/ToolLayout";
import { FileUploader } from "../../components/common/FileUploader";
import { Button } from "../../components/common/Button";
import { ProgressIndicator } from "../../components/common/ProgressIndicator";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { DownloadResult } from "../../components/common/DownloadResult";
import { addPageNumbers } from "../../services/pdf/page-numbers";
import { usePdfProcessing } from "../../hooks/usePdfProcessing";
import { usePdfDocument } from "../../hooks/usePdfDocument";
import { thumbnailCache } from "../../lib/pdf/thumbnail-cache";
import type {
  PageNumberOptions,
  PageNumberPosition,
  PageNumberFormat,
} from "../../types/pdf";
import { sanitizeFilename } from "../../lib/utils/formatting";

export const AddPageNumbersPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);
  const [previewThumb, setPreviewThumb] = useState<string | undefined>(undefined);
  const [isThumbLoading, setIsThumbLoading] = useState<boolean>(false);

  const [options, setOptions] = useState<PageNumberOptions>({
    position: "bottom-center",
    format: "page-n-of-total",
    fontSize: 12,
    fontColor: "#000000",
    margin: 36,
    startNumber: 1,
    skipFirstPage: false,
  });

  const { pages, totalPages, isLoading: isDocLoading, docProxy, docFingerprint } = usePdfDocument(file);
  const {
    isProcessing,
    progress,
    statusMessage,
    error,
    resultUrl,
    resultFilename,
    startProcessing,
    updateProgress,
    finishProcessing,
    failProcessing,
    resetProcessing,
  } = usePdfProcessing();

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setPreviewPageIndex(0);
      setPreviewThumb(undefined);
    }
  };

  // Dynamically load current preview page thumbnail
  useEffect(() => {
    if (!docProxy || !docFingerprint || totalPages === 0) return;

    let isCancelled = false;
    queueMicrotask(() => {
      if (!isCancelled) setIsThumbLoading(true);
    });

    const pageNum = previewPageIndex + 1;
    thumbnailCache
      .getOrRenderThumbnail(docProxy, docFingerprint, pageNum, 0.6)
      .then((url) => {
        if (!isCancelled) {
          setPreviewThumb(url);
          setIsThumbLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsThumbLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [docProxy, docFingerprint, previewPageIndex, totalPages]);

  const handleAddNumbers = async () => {
    if (!file) return;
    try {
      startProcessing("Inserting page numbers...");
      const resultBytes = await addPageNumbers(file, options, updateProgress);
      const finalName = sanitizeFilename(
        `numbered_${file.name}`,
        "numbered.pdf",
      );
      finishProcessing(resultBytes, finalName);
    } catch (err) {
      failProcessing(err);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewPageIndex(0);
    setPreviewThumb(undefined);
    resetProcessing();
  };

  const positions: PageNumberPosition[] = [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ];

  // Live preview formatting
  const isPageSkipped = options.skipFirstPage && previewPageIndex === 0;
  const currentTotal = options.skipFirstPage ? Math.max(1, totalPages - 1) : totalPages;
  const currentNumber = options.startNumber + (previewPageIndex - (options.skipFirstPage ? 1 : 0));

  let previewText = "";
  if (!isPageSkipped) {
    switch (options.format) {
      case "number":
        previewText = `${currentNumber}`;
        break;
      case "page-number":
        previewText = `Page ${currentNumber}`;
        break;
      case "n-of-total":
        previewText = `${currentNumber} of ${currentTotal}`;
        break;
      case "page-n-of-total":
      default:
        previewText = `Page ${currentNumber} of ${currentTotal}`;
        break;
    }
  }

  // Margin scaling for preview container
  const marginPx = Math.max(8, Math.min(32, Math.round((options.margin || 36) * 0.35)));

  const getPositionStyles = (): React.CSSProperties => {
    switch (options.position) {
      case "top-left":
        return { top: `${marginPx}px`, left: `${marginPx}px` };
      case "top-center":
        return { top: `${marginPx}px`, left: "50%", transform: "translateX(-50%)" };
      case "top-right":
        return { top: `${marginPx}px`, right: `${marginPx}px` };
      case "bottom-left":
        return { bottom: `${marginPx}px`, left: `${marginPx}px` };
      case "bottom-center":
        return { bottom: `${marginPx}px`, left: "50%", transform: "translateX(-50%)" };
      case "bottom-right":
        return { bottom: `${marginPx}px`, right: `${marginPx}px` };
      default:
        return { bottom: `${marginPx}px`, left: "50%", transform: "translateX(-50%)" };
    }
  };

  return (
    <ToolLayout
      title="Add Page Numbers"
      description="Insert custom page numbering into header or footer locations with live interactive layout preview."
      icon={<Hash className="w-5 h-5" />}
      hasFiles={!!file}
      onReset={handleReset}
    >
      {resultUrl && resultFilename ? (
        <DownloadResult
          filename={resultFilename}
          resultUrl={resultUrl}
          onReset={handleReset}
          title="Page Numbers Added!"
          subtitle={`Numbered ${totalPages} pages with ${options.position} numbering.`}
        />
      ) : isProcessing ? (
        <ProgressIndicator progress={progress} statusMessage={statusMessage} />
      ) : (
        <div className="space-y-6">
          <ErrorMessage message={error} />

          {!file ? (
            <FileUploader
              onFilesSelected={handleFilesSelected}
              multiple={false}
              title="Select a PDF to add page numbers"
              subtitle="Add customizable page numbering directly in your browser."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Preview page viewport */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>Visual Layout Preview</span>
                  </h3>

                  {/* Page switcher */}
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <button
                      type="button"
                      disabled={previewPageIndex <= 0}
                      onClick={() => setPreviewPageIndex((p) => Math.max(0, p - 1))}
                      className="p-1 text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
                      title="Previous preview page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-slate-700 font-mono">
                      Page {previewPageIndex + 1} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={previewPageIndex >= totalPages - 1}
                      onClick={() => setPreviewPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                      className="p-1 text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
                      title="Next preview page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-100/70 p-6 rounded-3xl border border-slate-200/70 flex flex-col items-center justify-center min-h-[460px]">
                  {previewThumb || (pages.length > 0 && pages[0]?.thumbnailUrl) ? (
                    <div className="relative border-4 border-white rounded-2xl shadow-xl max-w-sm overflow-hidden bg-white select-none">
                      <img
                        src={previewThumb || pages[0]?.thumbnailUrl}
                        alt={`Preview page ${previewPageIndex + 1}`}
                        className="w-full h-auto object-contain transition-opacity duration-200"
                      />

                      {/* Live Page Number Overlay */}
                      {isPageSkipped ? (
                        <div
                          style={getPositionStyles()}
                          className="absolute px-2.5 py-1 bg-amber-500/20 text-amber-900 border border-amber-400/50 rounded text-[10px] font-semibold tracking-wide pointer-events-none shadow-xs"
                        >
                          Skipped (Cover page)
                        </div>
                      ) : (
                        <div
                          style={{
                            ...getPositionStyles(),
                            color: options.fontColor,
                            fontSize: `${Math.max(10, Math.round(options.fontSize * 0.95))}px`,
                          }}
                          className="absolute px-2 py-0.5 rounded font-mono font-medium tracking-tight pointer-events-none shadow-2xs bg-white/70 backdrop-blur-2xs border border-slate-200/50"
                        >
                          {previewText}
                        </div>
                      )}

                      {isThumbLoading && (
                        <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                      <span className="text-sm">Rendering page preview...</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 mt-4 text-center">
                    Instant live preview across all settings. Inspect any page using the top navigation.
                  </p>
                </div>
              </div>

              {/* Sidebar Settings */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5 h-fit">
                <h3 className="font-bold text-slate-900 text-base">
                  Numbering Options
                </h3>

                {/* 6-box Position Grid */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">
                    Position on Page
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {positions.map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() =>
                          setOptions({ ...options, position: pos })
                        }
                        className={`py-2 text-[11px] font-medium rounded-xl border text-center transition-colors capitalize ${
                          options.position === pos
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                            : "border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        {pos.replace("-", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Format
                  </label>
                  <select
                    value={options.format}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        format: e.target.value as PageNumberFormat,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="number">1, 2, 3...</option>
                    <option value="page-number">Page 1, Page 2...</option>
                    <option value="n-of-total">1 of 10, 2 of 10...</option>
                    <option value="page-n-of-total">
                      Page 1 of 10, Page 2 of 10...
                    </option>
                  </select>
                </div>

                {/* Font Size & Color */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Font Size ({options.fontSize}pt)
                    </label>
                    <input
                      type="number"
                      min="8"
                      max="36"
                      value={options.fontSize}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          fontSize: parseInt(e.target.value) || 12,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={options.fontColor}
                        onChange={(e) =>
                          setOptions({ ...options, fontColor: e.target.value })
                        }
                        className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                      />
                      <span className="text-xs text-slate-600 font-mono">
                        {options.fontColor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Starting Number & Margin */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Start Number
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={options.startNumber}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          startNumber: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Margin ({options.margin}pt)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={options.margin}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          margin: Math.max(10, parseInt(e.target.value) || 36),
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Skip First Page Checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={options.skipFirstPage}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        skipFirstPage: e.target.checked,
                      })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Skip first page (Cover page)</span>
                </label>

                <Button
                  size="lg"
                  variant="primary"
                  leftIcon={
                    isDocLoading ? (
                      <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )
                  }
                  onClick={handleAddNumbers}
                  disabled={isDocLoading}
                  className="w-full"
                >
                  {isDocLoading ? "Loading Document..." : "Apply Page Numbers"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
