import React, { useState, useRef } from 'react';
import { Type, Sparkles, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { FileUploader } from '../../components/common/FileUploader';
import { Button } from '../../components/common/Button';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { DownloadResult } from '../../components/common/DownloadResult';
import { addTextToPdf } from '../../services/pdf/add-text';
import { usePdfProcessing } from '../../hooks/usePdfProcessing';
import { usePdfDocument } from '../../hooks/usePdfDocument';
import { screenToPdfCoordinates } from '../../lib/pdf/coordinates';
import type { TextOverlayItem } from '../../types/pdf';
import { sanitizeFilename } from '../../lib/utils/formatting';

export const AddTextToPdfPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [overlays, setOverlays] = useState<TextOverlayItem[]>([]);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const { pages, totalPages, isLoading: isDocLoading } = usePdfDocument(file);

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
    }
  };

  const handleAddTextBox = () => {
    // Standard PDF page size fallback is 612 x 792 points (Letter) or 595 x 842 (A4)
    const newOverlay: TextOverlayItem = {
      id: `text_${Date.now()}`,
      pageIndex: currentPageIndex,
      text: 'New Text',
      x: 100,
      y: 700,
      fontSize: 16,
      color: '#000000',
      rotation: 0,
    };
    setOverlays((prev) => [...prev, newOverlay]);
    setActiveOverlayId(newOverlay.id);
  };

  const updateActiveOverlay = (updates: Partial<TextOverlayItem>) => {
    if (!activeOverlayId) return;
    setOverlays((prev) =>
      prev.map((item) => (item.id === activeOverlayId ? { ...item, ...updates } : item))
    );
  };

  const removeActiveOverlay = () => {
    if (!activeOverlayId) return;
    setOverlays((prev) => prev.filter((item) => item.id !== activeOverlayId));
    setActiveOverlayId(null);
  };

  // Click on the preview to position or create a text box
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click coordinates to standard PDF points assuming 595 x 842 A4 baseline
    const { pdfX, pdfY } = screenToPdfCoordinates(clickX, clickY, {
      pageWidth: 595,
      pageHeight: 842,
      displayWidth: rect.width,
      displayHeight: rect.height,
    });

    if (activeOverlayId) {
      updateActiveOverlay({ x: Math.round(pdfX), y: Math.round(pdfY) });
    } else {
      const newOverlay: TextOverlayItem = {
        id: `text_${Date.now()}`,
        pageIndex: currentPageIndex,
        text: 'Type your text here',
        x: Math.round(pdfX),
        y: Math.round(pdfY),
        fontSize: 16,
        color: '#000000',
        rotation: 0,
      };
      setOverlays((prev) => [...prev, newOverlay]);
      setActiveOverlayId(newOverlay.id);
    }
  };

  const handleApplyText = async () => {
    if (!file || overlays.length === 0) return;
    try {
      startProcessing('Drawing text onto PDF...');
      const resultBytes = await addTextToPdf(file, overlays, updateProgress);
      const finalName = sanitizeFilename(`text_${file.name}`, 'text_document.pdf');
      finishProcessing(resultBytes, finalName);
    } catch (err) {
      failProcessing(err);
    }
  };

  const handleReset = () => {
    setFile(null);
    setOverlays([]);
    setActiveOverlayId(null);
    resetProcessing();
  };

  const activeOverlay = overlays.find((o) => o.id === activeOverlayId);
  const currentPageOverlays = overlays.filter((o) => o.pageIndex === currentPageIndex);

  return (
    <ToolLayout
      title="Add Text to PDF"
      description="Type and position custom text overlays anywhere on your PDF pages."
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
          subtitle={`Embedded ${overlays.length} text annotations into the PDF.`}
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
              subtitle="Place custom text boxes anywhere on your document pages."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Interactive Page Viewport */}
              <div className="lg:col-span-2 space-y-4">
                {/* Page pagination toolbar */}
                <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPageIndex === 0}
                      onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-slate-700">
                      Page {currentPageIndex + 1} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPageIndex === totalPages - 1}
                      onClick={() =>
                        setCurrentPageIndex((prev) => Math.min(totalPages - 1, prev + 1))
                      }
                      className="p-1.5 text-slate-600 hover:text-indigo-600 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-xs text-slate-400">
                    Click anywhere on page to place text
                  </span>
                </div>

                {/* Canvas / Image preview area */}
                <div className="bg-slate-100/70 p-6 rounded-3xl border border-slate-200/70 flex justify-center min-h-[500px]">
                  {pages[currentPageIndex]?.thumbnailUrl ? (
                    <div
                      ref={previewContainerRef}
                      onClick={handlePreviewClick}
                      className="relative border-4 border-white rounded-2xl shadow-xl max-w-md w-full bg-white cursor-crosshair select-none"
                    >
                      <img
                        src={pages[currentPageIndex].thumbnailUrl}
                        alt={`Page ${currentPageIndex + 1}`}
                        className="w-full h-auto object-contain block pointer-events-none"
                      />

                      {/* Overlays rendered on this page */}
                      {currentPageOverlays.map((item) => {
                        const isSelected = item.id === activeOverlayId;
                        // Transform PDF points (595 x 842) to percentage in viewport
                        const leftPct = (item.x / 595) * 100;
                        const topPct = ((842 - item.y) / 842) * 100;

                        return (
                          <div
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveOverlayId(item.id);
                            }}
                            className={`absolute px-2 py-0.5 rounded cursor-move transition-all ${
                              isSelected
                                ? 'ring-2 ring-indigo-500 bg-indigo-50/70 border border-indigo-400'
                                : 'hover:ring-1 hover:ring-slate-400 bg-white/60'
                            }`}
                            style={{
                              left: `${leftPct}%`,
                              top: `${topPct}%`,
                              color: item.color,
                              fontSize: `${item.fontSize * 0.75}px`,
                              transform: `rotate(${item.rotation}deg)`,
                            }}
                          >
                            {item.text}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm flex items-center">
                      Rendering page...
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Text Formatting Controls */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5 h-fit">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">Text Editor</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={handleAddTextBox}
                  >
                    Add Text
                  </Button>
                </div>

                {activeOverlay ? (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Text Content
                      </label>
                      <textarea
                        rows={2}
                        value={activeOverlay.text}
                        onChange={(e) => updateActiveOverlay({ text: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
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
                            updateActiveOverlay({ fontSize: parseInt(e.target.value) || 16 })
                          }
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
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
                            onChange={(e) => updateActiveOverlay({ color: e.target.value })}
                            className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                          />
                          <span className="text-xs text-slate-600 font-mono">
                            {activeOverlay.color}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Button
                        size="sm"
                        variant="danger"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={removeActiveOverlay}
                      >
                        Delete Box
                      </Button>

                      <span className="text-xs text-slate-500">
                        X: {activeOverlay.x}, Y: {activeOverlay.y}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs text-slate-500">
                    Click anywhere on the preview page or click &ldquo;Add Text&rdquo; to insert a text box.
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <Button
                    size="lg"
                    variant="primary"
                    leftIcon={<Sparkles className="w-5 h-5" />}
                    onClick={handleApplyText}
                    disabled={isDocLoading || overlays.length === 0}
                    className="w-full"
                  >
                    Apply Text & Save PDF
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
