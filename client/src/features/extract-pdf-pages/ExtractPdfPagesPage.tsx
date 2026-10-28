import React, { useState } from 'react';
import { FileOutput, Sparkles, CheckSquare, Square } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { FileUploader } from '../../components/common/FileUploader';
import { Button } from '../../components/common/Button';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { DownloadResult } from '../../components/common/DownloadResult';
import { PdfPageGrid } from '../../components/pdf/PdfPageGrid';
import { PageRangeInput } from '../../components/pdf/PageRangeInput';
import { extractPdfPages } from '../../services/pdf/extract';
import { usePdfProcessing } from '../../hooks/usePdfProcessing';
import { usePdfDocument } from '../../hooks/usePdfDocument';
import { parsePageRange } from '../../lib/utils/page-ranges';
import { sanitizeFilename } from '../../lib/utils/formatting';

export const ExtractPdfPagesPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rangeStr, setRangeStr] = useState('');
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
      setRangeStr('');
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

  // Keep thumbnail selections and range string in sync
  const handleRangeChange = (val: string) => {
    setRangeStr(val);
    try {
      const indices = parsePageRange(val, totalPages);
      const matchingIds = pages
        .filter((p) => indices.includes(p.originalPageIndex))
        .map((p) => p.id);
      setSelectedIds(matchingIds);
    } catch {
      // Keep existing selection if parse fails mid-typing
    }
  };

  const handleExtract = async () => {
    if (!file || selectedIds.length === 0) return;
    try {
      startProcessing('Extracting chosen pages...');
      const targetIndices = pages
        .filter((p) => selectedIds.includes(p.id))
        .map((p) => p.originalPageIndex);

      const resultBytes = await extractPdfPages(file, targetIndices, updateProgress);
      const finalName = sanitizeFilename(`extracted_${file.name}`, 'extracted.pdf');
      finishProcessing(resultBytes, finalName);
    } catch (err) {
      failProcessing(err);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSelectedIds([]);
    setRangeStr('');
    resetProcessing();
  };

  return (
    <ToolLayout
      title="Extract PDF Pages"
      description="Extract specific pages into a brand new standalone PDF document."
      icon={<FileOutput className="w-5 h-5" />}
      hasFiles={!!file}
      onReset={handleReset}
    >
      {resultUrl && resultFilename ? (
        <DownloadResult
          filename={resultFilename}
          resultUrl={resultUrl}
          onReset={handleReset}
          title="Pages Extracted!"
          subtitle={`Successfully created a new document with ${selectedIds.length} pages.`}
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
              title="Select a PDF to extract pages"
              subtitle="Choose which pages you want to keep in a new document."
            />
          ) : (
            <div className="space-y-6">
              {/* Range input card */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs max-w-xl">
                <PageRangeInput
                  value={rangeStr}
                  onChange={handleRangeChange}
                  totalPages={totalPages}
                  label="Quick Page Selection by Range"
                />
              </div>

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

                  <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {selectedIds.length} pages selected for extraction
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  onClick={handleExtract}
                  disabled={selectedIds.length === 0 || isDocLoading}
                >
                  Extract to PDF
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
