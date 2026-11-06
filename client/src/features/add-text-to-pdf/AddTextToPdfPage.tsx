import React, { useState, useRef, useEffect } from "react";
import {
  Type,
  Sparkles,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MousePointer,
  Move,
} from "lucide-react";
import { ToolLayout } from "../../components/layout/ToolLayout";
import { FileUploader } from "../../components/common/FileUploader";
import { Button } from "../../components/common/Button";
import { ProgressIndicator } from "../../components/common/ProgressIndicator";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { DownloadResult } from "../../components/common/DownloadResult";
import { addTextToPdf } from "../../services/pdf/add-text";
import { usePdfProcessing } from "../../hooks/usePdfProcessing";
import { usePdfDocument } from "../../hooks/usePdfDocument";
import { thumbnailCache } from "../../lib/pdf/thumbnail-cache";
import type { TextOverlayItem } from "../../types/pdf";
import { sanitizeFilename } from "../../lib/utils/formatting";

export const AddTextToPdfPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageThumbUrl, setPageThumbUrl] = useState<string | undefined>(
    undefined,
  );
  const [isThumbLoading, setIsThumbLoading] = useState(false);
  const [pageDimensions, setPageDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 595,
    height: 842,
  });

  const [overlays, setOverlays] = useState<TextOverlayItem[]>([]);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"select" | "add">("select");

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(440);
  const dragRef = useRef<{
    isDragging: boolean;
    id: string;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  } | null>(null);

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

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setCurrentPageIndex(0);
      setOverlays([]);
      setActiveOverlayId(null);
      setEditorMode("select");
    }
  };

  // Fetch true page dimensions & high-res thumbnail for current page
  useEffect(() => {
    if (!docProxy || !docFingerprint || totalPages === 0) return;

    let isCancelled = false;
    queueMicrotask(() => {
      if (!isCancelled) setIsThumbLoading(true);
    });

    const pageNum = currentPageIndex + 1;
    docProxy
      .getPage(pageNum)
      .then((page) => {
        if (isCancelled) return;
        const vp = page.getViewport({ scale: 1 });
        setPageDimensions({ width: vp.width, height: vp.height });
      })
      .catch((err) => {
        console.warn("Error reading page viewport:", err);
      });

    thumbnailCache
      .getOrRenderThumbnail(docProxy, docFingerprint, pageNum, 0.9)
      .then((url) => {
        if (!isCancelled) {
          setPageThumbUrl(url);
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
  }, [docProxy, docFingerprint, currentPageIndex, totalPages]);

  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const updateWidth = () => {
      setContainerWidth(el.clientWidth || 440);
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageThumbUrl, currentPageIndex]);

  // Handle clicking on the PDF page
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();

    if (editorMode === "add") {
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const xRatio = Math.max(0, Math.min(1, clickX / rect.width));
      const yRatio = Math.max(0, Math.min(1, clickY / rect.height));

      const pdfX = Math.round(xRatio * pageDimensions.width);
      // PDF Y origin is at bottom of page
      const pdfY = Math.round((1 - yRatio) * pageDimensions.height);

      const newOverlay: TextOverlayItem = {
        id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        pageIndex: currentPageIndex,
        text: "Type your text here",
        x: pdfX,
        y: pdfY,
        fontSize: 16,
        color: "#000000",
        rotation: 0,
      };

      setOverlays((prev) => [...prev, newOverlay]);
      setActiveOverlayId(newOverlay.id);
      setEditorMode("select"); // Automatically return to select/edit mode
    } else {
      // In select mode, clicking empty page area deselects active text box
      setActiveOverlayId(null);
    }
  };

  const updateActiveOverlay = (updates: Partial<TextOverlayItem>) => {
    if (!activeOverlayId) return;
    setOverlays((prev) =>
      prev.map((item) =>
        item.id === activeOverlayId ? { ...item, ...updates } : item,
      ),
    );
  };

  const removeActiveOverlay = () => {
    if (!activeOverlayId) return;
    setOverlays((prev) => prev.filter((item) => item.id !== activeOverlayId));
    setActiveOverlayId(null);
  };

  // Dragging handlers using pointer capture
  const handlePointerDown = (e: React.PointerEvent, item: TextOverlayItem) => {
    e.stopPropagation();
    setActiveOverlayId(item.id);

    dragRef.current = {
      isDragging: true,
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      initX: item.x,
      initY: item.y,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (
      !dragRef.current ||
      !dragRef.current.isDragging ||
      !previewContainerRef.current
    )
      return;

    const rect = previewContainerRef.current.getBoundingClientRect();
    const deltaScreenX = e.clientX - dragRef.current.startX;
    const deltaScreenY = e.clientY - dragRef.current.startY;

    // Convert screen pixel delta to PDF points delta
    const deltaPdfX = deltaScreenX * (pageDimensions.width / rect.width);
    const deltaPdfY = -deltaScreenY * (pageDimensions.height / rect.height);

    const newPdfX = Math.round(
      Math.max(
        0,
        Math.min(pageDimensions.width - 20, dragRef.current.initX + deltaPdfX),
      ),
    );
    const newPdfY = Math.round(
      Math.max(
        10,
        Math.min(pageDimensions.height, dragRef.current.initY + deltaPdfY),
      ),
    );

    setOverlays((prev) =>
      prev.map((item) =>
        item.id === dragRef.current?.id
          ? { ...item, x: newPdfX, y: newPdfY }
          : item,
      ),
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      dragRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }
  };

  const handleApplyText = async () => {
    if (!file || overlays.length === 0) return;
    try {
      startProcessing("Drawing text onto PDF...");
      const resultBytes = await addTextToPdf(file, overlays, updateProgress);
      const finalName = sanitizeFilename(
        `text_${file.name}`,
        "text_document.pdf",
      );
      finishProcessing(resultBytes, finalName);
    } catch (err) {
      failProcessing(err);
    }
  };

  const handleReset = () => {
    setFile(null);
    setOverlays([]);
    setActiveOverlayId(null);
    setPageThumbUrl(undefined);
    resetProcessing();
  };

  const activeOverlay = overlays.find((o) => o.id === activeOverlayId);
  const currentPageOverlays = overlays.filter(
    (o) => o.pageIndex === currentPageIndex,
  );

  return (
    <ToolLayout
      title="Add Text to PDF"
      description="Visual interactive editor: click anywhere on the page to insert text boxes, drag to position, and customize font styling."
      icon={<Type className="w-5 h-5" />}
      hasFiles={!!file}
      onReset={handleReset}
    >
      {resultUrl && resultFilename ? (
        <DownloadResult
          filename={resultFilename}
          resultUrl={resultUrl}
          onReset={handleReset}
          title="Text Added Successfully!"
          subtitle={`Embedded ${overlays.length} text annotations across your PDF document.`}
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
              title="Select a PDF to add text"
              subtitle="Place custom text boxes anywhere on your document pages with drag and drop."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Interactive Page Viewport */}
              <div className="lg:col-span-2 space-y-4">
                {/* Mode & Navigation toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
                  {/* Mode switch */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEditorMode("select")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        editorMode === "select"
                          ? "bg-white text-indigo-600 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <MousePointer className="w-3.5 h-3.5" />
                      <span>Select / Move</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode("add")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        editorMode === "add"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Click to Add Text</span>
                    </button>
                  </div>

                  {/* Page pagination */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPageIndex === 0}
                      onClick={() => {
                        setCurrentPageIndex((prev) => Math.max(0, prev - 1));
                        setActiveOverlayId(null);
                      }}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-slate-700 font-mono">
                      Page {currentPageIndex + 1} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPageIndex === totalPages - 1}
                      onClick={() => {
                        setCurrentPageIndex((prev) =>
                          Math.min(totalPages - 1, prev + 1),
                        );
                        setActiveOverlayId(null);
                      }}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Editor Container area */}
                <div
                  className="bg-slate-100/70 p-6 rounded-3xl border border-slate-200/70 flex justify-center min-h-[520px] select-none"
                  onClick={() => setActiveOverlayId(null)}
                >
                  {pageThumbUrl || pages[currentPageIndex]?.thumbnailUrl ? (
                    <div className="border-4 border-white rounded-2xl shadow-xl max-w-md w-full bg-white select-none overflow-hidden h-fit">
                      <div
                        ref={previewContainerRef}
                        onClick={handlePageClick}
                        className={`relative w-full ${
                          editorMode === "add"
                            ? "cursor-crosshair"
                            : "cursor-default"
                        }`}
                        style={{
                          aspectRatio: `${pageDimensions.width} / ${pageDimensions.height}`,
                        }}
                      >
                        <img
                          src={
                            pageThumbUrl || pages[currentPageIndex]?.thumbnailUrl
                          }
                          alt={`Page ${currentPageIndex + 1}`}
                          className="w-full h-full object-contain block pointer-events-none"
                        />

                        {/* Overlays rendered on this page */}
                        {currentPageOverlays.map((item) => {
                          const isSelected = item.id === activeOverlayId;
                          const leftPct = (item.x / pageDimensions.width) * 100;
                          const topPct =
                            ((pageDimensions.height - item.y) /
                              pageDimensions.height) *
                            100;
                          const previewScale = containerWidth / pageDimensions.width;
                          const scaledFontSize = Math.max(
                            9,
                            Math.round(item.fontSize * previewScale)
                          );

                          return (
                            <div
                              key={item.id}
                              onPointerDown={(e) => handlePointerDown(e, item)}
                              onPointerMove={handlePointerMove}
                              onPointerUp={handlePointerUp}
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute select-none cursor-move touch-none leading-none ${
                                isSelected ? "z-30" : "z-20"
                              }`}
                              style={{
                                left: `${leftPct}%`,
                                top: `${topPct}%`,
                                transform: `rotate(${item.rotation}deg)`,
                                transformOrigin: "left top",
                              }}
                            >
                              <div
                                className={`inline-flex items-center px-1 py-0.5 rounded transition-all leading-none ${
                                  isSelected
                                    ? "ring-2 ring-indigo-600 bg-white/95 shadow-md border border-indigo-500"
                                    : "hover:ring-1 hover:ring-indigo-300 bg-white/70 shadow-2xs border border-slate-300/60"
                                }`}
                                style={{
                                  color: item.color,
                                  fontSize: `${scaledFontSize}px`,
                                  lineHeight: 1,
                                }}
                              >
                                <span className="font-sans whitespace-nowrap leading-none select-none">
                                  {item.text || "Empty text"}
                                </span>
                                {isSelected && (
                                  <Move className="w-2.5 h-2.5 text-indigo-500 ml-1 shrink-0 pointer-events-none" />
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {isThumbLoading && (
                          <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                      <span>Loading page view...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Text Formatting Controls */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5 h-fit">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">
                    {activeOverlay ? "Edit Text Box" : "Text Box Controls"}
                  </h3>
                  <Button
                    size="sm"
                    variant={editorMode === "add" ? "primary" : "outline"}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() =>
                      setEditorMode(editorMode === "add" ? "select" : "add")
                    }
                  >
                    {editorMode === "add" ? "Click on Page" : "Add Text"}
                  </Button>
                </div>

                {activeOverlay ? (
                  <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Text Content
                      </label>
                      <textarea
                        rows={2}
                        value={activeOverlay.text}
                        onChange={(e) =>
                          updateActiveOverlay({ text: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Type text..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Font Size ({activeOverlay.fontSize}pt)
                        </label>
                        <input
                          type="number"
                          min="8"
                          max="72"
                          value={activeOverlay.fontSize}
                          onChange={(e) =>
                            updateActiveOverlay({
                              fontSize: parseInt(e.target.value) || 16,
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                          Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeOverlay.color}
                            onChange={(e) =>
                              updateActiveOverlay({ color: e.target.value })
                            }
                            className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                          />
                          <span className="text-xs text-slate-600 font-mono">
                            {activeOverlay.color}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Rotation Angle ({activeOverlay.rotation}°)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="15"
                        value={activeOverlay.rotation}
                        onChange={(e) =>
                          updateActiveOverlay({
                            rotation: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="danger"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={removeActiveOverlay}
                      >
                        Delete Box
                      </Button>

                      <span className="text-[11px] text-slate-400 font-mono">
                        Page {activeOverlay.pageIndex + 1}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs text-slate-500 space-y-2">
                    <p className="font-medium text-slate-700">
                      No text box selected
                    </p>
                    <p>
                      Click <strong>&ldquo;Add Text&rdquo;</strong> and click
                      anywhere on the page to insert a text box, or select an
                      existing one to edit or drag.
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
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
                    onClick={handleApplyText}
                    disabled={isDocLoading || overlays.length === 0}
                    className="w-full"
                  >
                    {isDocLoading
                      ? "Loading Document..."
                      : `Apply Text & Save (${overlays.length})`}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
