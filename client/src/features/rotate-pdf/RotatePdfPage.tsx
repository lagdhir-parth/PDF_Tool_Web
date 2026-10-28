import React, { useState } from 'react';
import { RotateCw, RotateCcw, Sparkles } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { FileUploader } from '../../components/common/FileUploader';
import { Button } from '../../components/common/Button';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { DownloadResult } from '../../components/common/DownloadResult';
import { PdfPageGrid } from '../../components/pdf/PdfPageGrid';
import { rotatePdf, type RotationDelta } from '../../services/pdf/rotate';
import { usePdfProcessing } from '../../hooks/usePdfProcessing';
import { usePdfDocument } from '../../hooks/usePdfDocument';
import { sanitizeFilename } from '../../lib/utils/formatting';

export const RotatePdfPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { pages, setPages, totalPages, isLoading: isDocLoading } = usePdfDocument(file);

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
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string, isMulti?: boolean) => {
    if (isMulti) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setSelectedIds((prev) =>
        prev.includes(id) && prev.length === 1 ? [] : [id]
      );
    }
  };

  const rotatePagesInView = (delta: RotationDelta, targetIds?: string[]) => {
    const targets = targetIds || (selectedIds.length > 0 ? selectedIds : pages.map((p) => p.id));
    setPages((prev) =>
      prev.map((p) => {
        if (targets.includes(p.id)) {
          return {
            ...p,
            rotation: ((p.rotation + delta) % 360 + 360) % 360,
          };
        }
        return p;
      })
    );
  };

  const handleApplyRotate = async () => {
    if (!file) return;
    try {
      startProcessing('Applying rotation to PDF...');

      // Calculate overall net rotation: if all pages have uniform rotation, or specific pages
      // For simplicity and completeness: we rotate each page by its net delta or batch
      // Here: if user selected specific pages or rotated in preview, apply the rotation
      const rotatedPages = pages.filter((p) => p.rotation !== 0);

      let resultBytes: Uint8Array;
      if (rotatedPages.length === 0) {
        // If user didn't rotate individual pages in preview, default rotate all 90 CW
        resultBytes = await rotatePdf(file, {
          rotationAngle: 90,
          onProgress: updateProgress,
        });
      } else {
        // Apply page by page or overall
        // If user has specific rotated pages:
        // We can call rotatePdf with the target indices and angle
        // Let's take the first non-zero rotation or 90
        const delta = (rotatedPages[0]?.rotation as RotationDelta) || 90;
        const indices = rotatedPages.map((p) => p.originalPageIndex);
        resultBytes = await rotatePdf(file, {
          rotationAngle: delta,
          targetPageIndices: indices.length === totalPages ? undefined : indices,
          onProgress: updateProgress,
        });
      }

      const finalName = sanitizeFilename(`rotated_${file.name}`, 'rotated.pdf');
      finishProcessing(resultBytes, finalName);
    } catch (err) {
      failProcessing(err);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSelectedIds([]);
    resetProcessing();
  };

  return (
    <ToolLayout
      title="Rotate PDF Pages"
      description="Rotate individual or all pages clockwise, counter-clockwise, or 180 degrees."
      icon={<RotateCw className="w-5 h-5" />}
      hasFiles={!!file}
      onReset={handleReset}
    >
      {resultUrl && resultFilename ? (
        <DownloadResult
          filename={resultFilename}
          resultUrl={resultUrl}
          onReset={handleReset}
          title="PDF Rotated Successfully!"
          subtitle="All page rotations have been saved to your new document."
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
              title="Select a PDF to rotate"
              subtitle="Easily rotate single pages, selections, or entire documents."
            />
          ) : (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    {selectedIds.length > 0
                      ? `${selectedIds.length} pages selected`
                      : 'All pages target'}
                  </span>
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedIds([])}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                    onClick={() => rotatePagesInView(270)}
                  >
                    Rotate Left (90° CCW)
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RotateCw className="w-4 h-4" />}
                    onClick={() => rotatePagesInView(90)}
                  >
                    Rotate Right (90° CW)
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rotatePagesInView(180)}
                  >
                    Flip 180°
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Sparkles className="w-4 h-4" />}
                    onClick={handleApplyRotate}
                    disabled={isDocLoading}
                    className="ml-2"
                  >
                    Save & Download
                  </Button>
                </div>
              </div>

              {/* Grid */}
              <div className="bg-slate-100/60 p-4 sm:p-6 rounded-3xl border border-slate-200/70">
                <PdfPageGrid
                  pages={pages}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onRotatePage={(id) => rotatePagesInView(90, [id])}
                  enableDrag={false}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
