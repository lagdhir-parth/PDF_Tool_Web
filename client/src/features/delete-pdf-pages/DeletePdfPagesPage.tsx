import React, { useState } from 'react';
import { Trash2, CheckSquare, Square } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { FileUploader } from '../../components/common/FileUploader';
import { Button } from '../../components/common/Button';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { DownloadResult } from '../../components/common/DownloadResult';
import { PdfPageGrid } from '../../components/pdf/PdfPageGrid';
import { deletePdfPages } from '../../services/pdf/delete-pages';
import { usePdfProcessing } from '../../hooks/usePdfProcessing';
import { usePdfDocument } from '../../hooks/usePdfDocument';
import { sanitizeFilename } from '../../lib/utils/formatting';

export const DeletePdfPagesPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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

  const handleDelete = async () => {
    if (!file || selectedIds.length === 0) return;
    try {
      startProcessing('Removing selected pages...');
      const targetIndices = pages
        .filter((p) => selectedIds.includes(p.id))
        .map((p) => p.originalPageIndex);

      const resultBytes = await deletePdfPages(file, targetIndices, updateProgress);
      const finalName = sanitizeFilename(`cleaned_${file.name}`, 'cleaned.pdf');
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

  const remainingPages = totalPages - selectedIds.length;

  return (
    <ToolLayout
      title="Delete PDF Pages"
      description="Remove unwanted pages from your PDF file cleanly and safely."
      icon={<Trash2 className="w-5 h-5" />}
      hasFiles={!!file}
      onReset={handleReset}
    >
      {resultUrl && resultFilename ? (
        <DownloadResult
          filename={resultFilename}
          resultUrl={resultUrl}
          onReset={handleReset}
          title="Pages Removed Successfully!"
          subtitle={`Your new document contains ${remainingPages} pages.`}
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
              title="Select a PDF to delete pages"
              subtitle="Select and discard individual or groups of pages with one click."
            />
          ) : (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={selectedIds.length === pages.length ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                    onClick={
                      selectedIds.length === pages.length
                        ? () => setSelectedIds([])
                        : () => setSelectedIds(pages.map((p) => p.id))
                    }
                  >
                    {selectedIds.length === pages.length ? 'Clear Selection' : 'Select All'}
                  </Button>

                  <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg">
                    {selectedIds.length} marked for deletion
                  </span>

                  <span className="text-xs text-slate-500 font-medium">
                    ({remainingPages} remaining)
                  </span>
                </div>

                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={handleDelete}
                  disabled={selectedIds.length === 0 || remainingPages <= 0 || isDocLoading}
                >
                  Delete Selected Pages
                </Button>
              </div>

              {/* Grid */}
              <div className="bg-slate-100/60 p-4 sm:p-6 rounded-3xl border border-slate-200/70">
                <PdfPageGrid
                  pages={pages}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
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
