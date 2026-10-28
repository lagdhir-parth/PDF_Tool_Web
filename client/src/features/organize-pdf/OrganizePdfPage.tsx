import React, { useEffect, useState } from 'react';
import {
  LayoutGrid,
  RotateCw,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  Sparkles,
  CheckSquare,
  Square,
} from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { FileUploader } from '../../components/common/FileUploader';
import { Button } from '../../components/common/Button';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { DownloadResult } from '../../components/common/DownloadResult';
import { PdfPageGrid } from '../../components/pdf/PdfPageGrid';
import { organizePdf } from '../../services/pdf/organize';
import { usePdfProcessing } from '../../hooks/usePdfProcessing';
import { usePdfDocument } from '../../hooks/usePdfDocument';
import { useEditorStore } from '../../stores/editor.store';
import { sanitizeFilename } from '../../lib/utils/formatting';

export const OrganizePdfPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const { pages: docPages, isLoading: isDocLoading } = usePdfDocument(file);

  const {
    pages,
    selectedIds,
    setPages,
    reorderPages,
    toggleSelectPage,
    selectAll,
    clearSelection,
    rotateSelected,
    deleteSelected,
    duplicateSelected,
    undo,
    redo,
    historyIndex,
    history,
    reset: resetEditor,
  } = useEditorStore();

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

  // Sync document loaded pages into editor store
  useEffect(() => {
    if (docPages.length > 0 && pages.length === 0) {
      setPages(docPages);
    }
  }, [docPages, pages.length, setPages]);

  // Keep thumbnail URLs in sync if they finish loading later
  useEffect(() => {
    if (docPages.length > 0 && pages.length > 0) {
      const needsUpdate = pages.some(
        (p) => !p.thumbnailUrl && docPages.find((dp) => dp.originalPageIndex === p.originalPageIndex)?.thumbnailUrl
      );
      if (needsUpdate) {
        setPages(
          pages.map((p) => {
            const match = docPages.find((dp) => dp.originalPageIndex === p.originalPageIndex);
            return match && match.thumbnailUrl ? { ...p, thumbnailUrl: match.thumbnailUrl } : p;
          })
        );
      }
    }
  }, [docPages, pages, setPages]);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleOrganizeSave = async () => {
    if (!file || pages.length === 0) return;
    try {
      startProcessing('Assembling organized PDF...');
      const resultBytes = await organizePdf(file, {
        pages,
        onProgress: updateProgress,
      });
      const finalName = sanitizeFilename(`organized_${file.name}`, 'organized.pdf');
      finishProcessing(resultBytes, finalName);
    } catch (err) {
      failProcessing(err);
    }
  };

  const handleReset = () => {
    setFile(null);
    resetEditor();
    resetProcessing();
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasSelection = selectedIds.length > 0;

  return (
    <ToolLayout
      title="Organize PDF Pages"
      description="Drag and drop to reorder, duplicate, rotate, or delete pages visually."
      icon={<LayoutGrid className="w-5 h-5" />}
      hasFiles={!!file}
      onReset={handleReset}
    >
      {resultUrl && resultFilename ? (
        <DownloadResult
          filename={resultFilename}
          resultUrl={resultUrl}
          onReset={handleReset}
          title="Pages Reorganized!"
          subtitle={`Updated document now has ${pages.length} pages.`}
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
              title="Select a PDF to organize"
              subtitle="Easily arrange pages with drag and drop, rotate, and delete."
            />
          ) : (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                {/* Selection Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={selectedIds.length === pages.length ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                    onClick={selectedIds.length === pages.length ? clearSelection : selectAll}
                  >
                    {selectedIds.length === pages.length ? 'Deselect All' : 'Select All'}
                  </Button>

                  <span className="text-xs text-slate-400 font-medium">|</span>

                  <span className="text-xs text-slate-600 font-semibold px-2">
                    {selectedIds.length} of {pages.length} selected
                  </span>
                </div>

                {/* Operations on selected pages */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                    disabled={!hasSelection}
                    onClick={() => rotateSelected(90)}
                  >
                    Rotate
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Copy className="w-3.5 h-3.5" />}
                    disabled={!hasSelection}
                    onClick={duplicateSelected}
                  >
                    Duplicate
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    disabled={!hasSelection || pages.length <= 1}
                    onClick={deleteSelected}
                  >
                    Delete
                  </Button>

                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">|</span>

                  <button
                    type="button"
                    disabled={!canUndo}
                    onClick={undo}
                    className="p-2 text-slate-600 hover:text-indigo-600 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Undo"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={!canRedo}
                    onClick={redo}
                    className="p-2 text-slate-600 hover:text-indigo-600 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Redo"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>

                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Sparkles className="w-4 h-4" />}
                    onClick={handleOrganizeSave}
                    disabled={pages.length === 0 || isDocLoading}
                    className="ml-2"
                  >
                    Save & Download PDF
                  </Button>
                </div>
              </div>

              {/* Grid with Sortable Drag-and-Drop */}
              <div className="bg-slate-100/60 p-4 sm:p-6 rounded-3xl border border-slate-200/70 min-h-[300px]">
                <PdfPageGrid
                  pages={pages}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelectPage}
                  onRotatePage={(id) => {
                    toggleSelectPage(id);
                    rotateSelected(90);
                  }}
                  onReorderPages={reorderPages}
                  enableDrag={true}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
