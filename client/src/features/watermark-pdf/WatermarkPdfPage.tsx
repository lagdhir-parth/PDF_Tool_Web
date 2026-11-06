import React, { useState, useEffect, useMemo } from "react";
import {
  Stamp,
  Sparkles,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
} from "lucide-react";
import { ToolLayout } from "../../components/layout/ToolLayout";
import { FileUploader } from "../../components/common/FileUploader";
import { Button } from "../../components/common/Button";
import { ProgressIndicator } from "../../components/common/ProgressIndicator";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { DownloadResult } from "../../components/common/DownloadResult";
import { watermarkPdf } from "../../services/pdf/watermark";
import { usePdfProcessing } from "../../hooks/usePdfProcessing";
import { usePdfDocument } from "../../hooks/usePdfDocument";
import { thumbnailCache } from "../../lib/pdf/thumbnail-cache";
import type { WatermarkOptions, WatermarkPosition } from "../../types/pdf";
import { sanitizeFilename } from "../../lib/utils/formatting";

export const WatermarkPdfPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);
  const [previewThumb, setPreviewThumb] = useState<string | undefined>(
    undefined,
  );
  const [isThumbLoading, setIsThumbLoading] = useState<boolean>(false);

  const [options, setOptions] = useState<WatermarkOptions>({
    type: "text",
    text: "CONFIDENTIAL",
    textColor: "#e11d48",
    fontSize: 48,
    opacity: 0.35,
    rotation: 45,
    position: "center",
    imageFile: null,
  });

  const {
    pages,
    totalPages,
    isLoading: isDocLoading,
    docProxy,
    docFingerprint,
  } = usePdfDocument(file);
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

  // Create preview URL for uploaded image
  const previewImageUrl = useMemo(() => {
    if (options.type === "image" && options.imageFile) {
      return URL.createObjectURL(options.imageFile);
    }
    return null;
  }, [options.type, options.imageFile]);

  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

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
      .getOrRenderThumbnail(docProxy, docFingerprint, pageNum, 1)
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

  const handleApplyWatermark = async () => {
    if (!file) return;
    try {
      startProcessing("Applying watermark to all pages...");
      const resultBytes = await watermarkPdf(file, options, updateProgress);
      const finalName = sanitizeFilename(
        `watermarked_${file.name}`,
        "watermarked.pdf",
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

  const getImagePositionClass = () => {
    switch (options.position) {
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "center":
      default:
        return "";
    }
  };

  return (
    <ToolLayout
      title="Watermark PDF"
      description="Apply centered text or custom logo image watermarks to protect and brand your documents."
      icon={<Stamp className="w-5 h-5" />}
      hasFiles={!!file}
      onReset={handleReset}
    >
      {resultUrl && resultFilename ? (
        <DownloadResult
          filename={resultFilename}
          resultUrl={resultUrl}
          onReset={handleReset}
          title="Watermark Applied!"
          subtitle="Your document has been protected with the chosen watermark."
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
              title="Select a PDF to watermark"
              subtitle="Add text or image watermarks with full opacity and angle controls."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Visual preview */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>Visual Watermark Preview</span>
                  </h3>

                  {/* Page switcher */}
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <button
                      type="button"
                      disabled={previewPageIndex <= 0}
                      onClick={() =>
                        setPreviewPageIndex((p) => Math.max(0, p - 1))
                      }
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
                      onClick={() =>
                        setPreviewPageIndex((p) =>
                          Math.min(totalPages - 1, p + 1),
                        )
                      }
                      className="p-1 text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
                      title="Next preview page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-100/70 p-6 rounded-3xl border border-slate-200/70 flex flex-col items-center justify-center min-h-[460px]">
                  {previewThumb ||
                  (pages.length > 0 && pages[0]?.thumbnailUrl) ? (
                    <div className="relative border-4 border-white rounded-2xl shadow-xl max-w-sm overflow-hidden bg-white select-none">
                      <img
                        src={previewThumb || pages[0]?.thumbnailUrl}
                        alt={`Watermark preview page ${previewPageIndex + 1}`}
                        className="w-full h-auto object-contain transition-opacity duration-200"
                      />

                      {/* Text Watermark Overlay — Always Centered */}
                      {options.type === "text" && (
                        <div
                          className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
                          style={{ opacity: options.opacity }}
                        >
                          <span
                            className="font-extrabold tracking-widest text-center select-none whitespace-nowrap"
                            style={{
                              color: options.textColor,
                              fontSize: `${Math.max(16, Math.round(options.fontSize * 0.42))}px`,
                              transform: `rotate(${options.rotation}deg)`,
                              transformOrigin: "center center",
                            }}
                          >
                            {options.text || "CONFIDENTIAL"}
                          </span>
                        </div>
                      )}

                      {/* Image Watermark Overlay — True Image Rendering with Positioning */}
                      {options.type === "image" &&
                        previewImageUrl &&
                        (options.position === "center" ? (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                            <img
                              src={previewImageUrl}
                              alt="Watermark logo"
                              className="max-w-[140px] max-h-[140px] object-contain transition-all"
                              style={{
                                opacity: options.opacity,
                                transform: `rotate(${options.rotation}deg)`,
                                transformOrigin: "center center",
                              }}
                            />
                          </div>
                        ) : (
                          <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <img
                              src={previewImageUrl}
                              alt="Watermark logo"
                              className={`absolute max-w-[140px] max-h-[140px] object-contain transition-all ${getImagePositionClass()}`}
                              style={{
                                opacity: options.opacity,
                                transform: `rotate(${options.rotation}deg)`,
                                transformOrigin: "center center",
                              }}
                            />
                          </div>
                        ))}

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
                    {options.type === "text"
                      ? "Text watermark is always centered on page with exact rotation."
                      : "Image watermark accurately renders your logo with scale and position."}
                  </p>
                </div>
              </div>

              {/* Sidebar Watermark Controls */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5 h-fit">
                <h3 className="font-bold text-slate-900 text-base">
                  Watermark Options
                </h3>

                {/* Watermark Type Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOptions({
                        ...options,
                        type: "text",
                        position: "center",
                      })
                    }
                    className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                      options.type === "text"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Text Watermark
                  </button>
                  <button
                    type="button"
                    onClick={() => setOptions({ ...options, type: "image" })}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                      options.type === "image"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Image / Logo
                  </button>
                </div>

                {options.type === "text" ? (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Watermark Text
                      </label>
                      <input
                        type="text"
                        value={options.text}
                        onChange={(e) =>
                          setOptions({ ...options, text: e.target.value })
                        }
                        placeholder="e.g. DRAFT, CONFIDENTIAL"
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Font Size ({options.fontSize}pt)
                        </label>
                        <input
                          type="number"
                          min="16"
                          max="96"
                          value={options.fontSize}
                          onChange={(e) =>
                            setOptions({
                              ...options,
                              fontSize: parseInt(e.target.value) || 48,
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
                            value={options.textColor}
                            onChange={(e) =>
                              setOptions({
                                ...options,
                                textColor: e.target.value,
                              })
                            }
                            className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                          />
                          <span className="text-xs text-slate-600 font-mono">
                            {options.textColor}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Watermark Image
                    </label>
                    <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 text-center bg-slate-50 transition-colors">
                      <Upload className="w-5 h-5 text-indigo-600" />
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[220px]">
                        {options.imageFile
                          ? options.imageFile.name
                          : "Choose Logo (PNG / JPG)"}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setOptions({
                              ...options,
                              imageFile: e.target.files[0],
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                )}

                {/* Opacity slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Opacity
                    </label>
                    <span className="text-xs text-slate-500 font-mono font-semibold">
                      {Math.round(options.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={options.opacity}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        opacity: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Rotation slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Angle
                    </label>
                    <span className="text-xs text-slate-500 font-mono font-semibold">
                      {options.rotation}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="5"
                    value={options.rotation}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        rotation: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Positioning: ONLY displayed for Image / Logo watermark mode */}
                {options.type === "image" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Logo Placement
                    </label>
                    <select
                      value={options.position}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          position: e.target.value as WatermarkPosition,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="center">Center of Page</option>
                      <option value="top-left">Top Left Corner</option>
                      <option value="top-right">Top Right Corner</option>
                      <option value="bottom-left">Bottom Left Corner</option>
                      <option value="bottom-right">Bottom Right Corner</option>
                    </select>
                  </div>
                )}

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
                  onClick={handleApplyWatermark}
                  disabled={
                    isDocLoading ||
                    (options.type === "image" && !options.imageFile)
                  }
                  className="w-full"
                >
                  {isDocLoading ? "Loading Document..." : "Apply Watermark"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
