import React, { useState } from 'react';
import { Scissors, Archive, Download, Sparkles, CheckSquare, Square, Loader2, MousePointerClick } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { FileUploader } from '../../components/common/FileUploader';
import { Button } from '../../components/common/Button';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { PageRangeInput } from '../../components/pdf/PageRangeInput';
import { PdfPageGrid } from '../../components/pdf/PdfPageGrid';
import { splitPdf, type SplitMode, type SplitResultFile } from '../../services/pdf/split';
import { usePdfProcessing } from '../../hooks/usePdfProcessing';
import { usePdfDocument } from '../../hooks/usePdfDocument';
import { downloadZip, downloadBlob } from '../../lib/files/download';
import { formatPageIndices, parsePageRange } from '../../lib/utils/page-ranges';

export const SplitPdfPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<SplitMode>('custom-ranges');
  const [customRanges, setCustomRanges] = useState('');
  const [everyNPages, setEveryNPages] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [splitResults, setSplitResults] = useState<SplitResultFile[] | null>(null);

  const { pages, totalPages, isLoading: isDocLoading, docProxy, docFingerprint } = usePdfDocument(file);
  const {
    isProcessing,
    progress,
    statusMessage,
    error,
    startProcessing,
    updateProgress,
    failProcessing,
    resetProcessing,
  } = usePdfProcessing();

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setCustomRanges('');
      setSelectedIds([]);
      setSplitResults(null);
    }
  };

  const handleToggleSelect = (id: string, isMulti?: boolean) => {
    let nextSelected: string[];
    if (isMulti) {
      nextSelected = selectedIds.includes(id)
        ? selectedIds.filter((item) => item !== id)
        : [...selectedIds, id];
    } else {
      nextSelected = selectedIds.includes(id)
        ? selectedIds.filter((item) => item !== id)
        : [...selectedIds, id];
    }

    setSelectedIds(nextSelected);

    // Synchronize selected pages into the custom ranges input
    const selectedIndices = pages
      .map((p, idx) => (nextSelected.includes(p.id) ? idx : -1))
      .filter((idx) => idx !== -1);

    const formattedRange = formatPageIndices(selectedIndices);
    setCustomRanges(formattedRange);
  };

  const handleCustomRangeChange = (newRange: string) => {
    setCustomRanges(newRange);
    try {
      const indices = parsePageRange(newRange, totalPages);
      const newSelectedIds = indices
        .map((i) => pages[i]?.id)
        .filter(Boolean) as string[];
      setSelectedIds(newSelectedIds);
    } catch {
      // Keep existing selection while typing incomplete range
    }
  };

  const handleSelectAll = () => {
    const allIds = pages.map((p) => p.id);
    setSelectedIds(allIds);
    setCustomRanges(totalPages > 0 ? `1-${totalPages}` : '');
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    setCustomRanges('');
  };

  const handleSplit = async () => {
    if (!file) return;
    try {
      startProcessing('Starting split process...');

      const selectedIndices = pages
        .filter((p) => selectedIds.includes(p.id))
        .map((p) => p.originalPageIndex);

      const results = await splitPdf(file, {
        mode,
        customRanges,
        everyNPages,
        selectedIndices,
        onProgress: updateProgress,
      });
      setSplitResults(results);
    } catch (err) {
      failProcessing(err);
    }
  };

  const handleDownloadAllZip = async () => {
    if (!splitResults) return;
    await downloadZip(splitResults, `${file?.name.replace(/\.pdf$/i, '')}_split.zip`);
  };

  const handleReset = () => {
    setFile(null);
    setSplitResults(null);
    setSelectedIds([]);
    resetProcessing();
  };

  return (
    <ToolLayout
      title="Split PDF Pages"
      description="Split your PDF into separate files by page ranges, manual page selection, or individual pages."
      icon={<Scissors className="w-5 h-5" />}
      hasFiles={!!file}
      onReset={handleReset}
    >
      {splitResults ? (
        <div className="w-full max-w-xl mx-auto bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
            <Archive className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              PDF Split into {splitResults.length} {splitResults.length === 1 ? 'File' : 'Files'}!
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Download individual parts or save everything in a single ZIP.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {splitResults.length === 1 ? (
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Download className="w-5 h-5" />}
                onClick={() => downloadBlob(splitResults[0].data, splitResults[0].name)}
                className="w-full"
              >
                Download PDF
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Archive className="w-5 h-5" />}
                onClick={handleDownloadAllZip}
                className="w-full"
              >
                Download All as ZIP ({splitResults.length} Files)
              </Button>
            )}

            <Button variant="outline" size="lg" onClick={handleReset}>
              Split Another
            </Button>
          </div>

          {/* List of generated files */}
          <div className="text-left border border-slate-100 rounded-2xl p-4 bg-slate-50 max-h-60 overflow-y-auto space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Output Files
            </span>
            {splitResults.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 px-3 bg-white rounded-xl text-xs font-medium border border-slate-200/60"
              >
                <span className="truncate pr-2">{item.name}</span>
                <button
                  type="button"
                  onClick={() => downloadBlob(item.data, item.name)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold shrink-0 cursor-pointer"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : isProcessing ? (
        <ProgressIndicator progress={progress} statusMessage={statusMessage} />
      ) : (
        <div className="space-y-6">
          <ErrorMessage message={error} />

          {!file ? (
            <FileUploader
              onFilesSelected={handleFilesSelected}
              multiple={false}
              title="Select a PDF to split"
              subtitle="Upload document to extract pages or divide by custom ranges."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Thumbnail preview & selection grid */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">
                      Document Pages ({totalPages})
                    </h3>
                    <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      {selectedIds.length} selected
                    </span>
                  </div>

                  {/* Select All / Clear selection buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={selectedIds.length === pages.length ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                      onClick={selectedIds.length === pages.length ? handleClearSelection : handleSelectAll}
                    >
                      {selectedIds.length === pages.length ? 'Clear Selection' : 'Select All'}
                    </Button>
                  </div>
                </div>

                {/* Virtualized Grid */}
                <div className="bg-slate-100/70 p-3 sm:p-4 rounded-3xl border border-slate-200/60">
                  <PdfPageGrid
                    pages={pages}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    enableDrag={false}
                    showRotateButton={false}
                    showSelectCheckbox={true}
                    docProxy={docProxy}
                    docFingerprint={docFingerprint}
                  />
                </div>
              </div>

              {/* Sidebar Split Mode Options */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6 h-fit">
                <h3 className="font-bold text-slate-900 text-base">Split Method</h3>

                <div className="space-y-2.5">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                      mode === 'custom-ranges'
                        ? 'border-indigo-600 bg-indigo-50/40'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="split-mode"
                      checked={mode === 'custom-ranges'}
                      onChange={() => setMode('custom-ranges')}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Custom Ranges / Selected</div>
                      <div className="text-xs text-slate-500">
                        Type ranges or click pages in preview (e.g. 1-3, 5-7)
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                      mode === 'selected-pages'
                        ? 'border-indigo-600 bg-indigo-50/40'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="split-mode"
                      checked={mode === 'selected-pages'}
                      onChange={() => setMode('selected-pages')}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        <MousePointerClick className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Extract Selected Only</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Combines your {selectedIds.length} clicked pages into one PDF
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                      mode === 'all-pages'
                        ? 'border-indigo-600 bg-indigo-50/40'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="split-mode"
                      checked={mode === 'all-pages'}
                      onChange={() => setMode('all-pages')}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Extract Every Page</div>
                      <div className="text-xs text-slate-500">
                        Every single page becomes its own separate PDF
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                      mode === 'fixed-ranges'
                        ? 'border-indigo-600 bg-indigo-50/40'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="split-mode"
                      checked={mode === 'fixed-ranges'}
                      onChange={() => setMode('fixed-ranges')}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Split Every N Pages</div>
                      <div className="text-xs text-slate-500">
                        Divide into equal chunks of N pages
                      </div>
                    </div>
                  </label>
                </div>

                {/* Sub-inputs based on mode */}
                {mode === 'custom-ranges' && (
                  <PageRangeInput
                    value={customRanges}
                    onChange={handleCustomRangeChange}
                    totalPages={totalPages}
                    label="Page Ranges to Extract"
                  />
                )}

                {mode === 'fixed-ranges' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Split every:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={everyNPages}
                        onChange={(e) => setEveryNPages(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 px-3 py-2 text-sm border border-slate-300 rounded-xl"
                      />
                      <span className="text-sm text-slate-600 font-medium">pages per file</span>
                    </div>
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
                  onClick={handleSplit}
                  disabled={
                    isDocLoading ||
                    (mode === 'custom-ranges' && !customRanges.trim()) ||
                    (mode === 'selected-pages' && selectedIds.length === 0)
                  }
                  className="w-full"
                >
                  {isDocLoading ? 'Loading Document...' : 'Split PDF Now'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
