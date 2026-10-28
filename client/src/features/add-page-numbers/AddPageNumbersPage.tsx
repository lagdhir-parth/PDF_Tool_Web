import React, { useState } from 'react';
import { Hash, Sparkles } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { FileUploader } from '../../components/common/FileUploader';
import { Button } from '../../components/common/Button';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { DownloadResult } from '../../components/common/DownloadResult';
import { addPageNumbers } from '../../services/pdf/page-numbers';
import { usePdfProcessing } from '../../hooks/usePdfProcessing';
import { usePdfDocument } from '../../hooks/usePdfDocument';
import type { PageNumberOptions, PageNumberPosition, PageNumberFormat } from '../../types/pdf';
import { sanitizeFilename } from '../../lib/utils/formatting';

export const AddPageNumbersPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<PageNumberOptions>({
    position: 'bottom-center',
    format: 'page-n-of-total',
    fontSize: 12,
    fontColor: '#000000',
    margin: 36,
    startNumber: 1,
    skipFirstPage: false,
  });

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
    }
  };

  const handleAddNumbers = async () => {
    if (!file) return;
    try {
      startProcessing('Inserting page numbers...');
      const resultBytes = await addPageNumbers(file, options, updateProgress);
      const finalName = sanitizeFilename(`numbered_${file.name}`, 'numbered.pdf');
      finishProcessing(resultBytes, finalName);
    } catch (err) {
      failProcessing(err);
    }
  };

  const handleReset = () => {
    setFile(null);
    resetProcessing();
  };

  const positions: PageNumberPosition[] = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ];

  return (
    <ToolLayout
      title="Add Page Numbers"
      description="Insert custom page numbering into header or footer locations with custom formatting."
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
          subtitle={`Numbered ${totalPages} pages at ${options.position}.`}
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
              {/* Preview page thumbnail */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold text-slate-800">
                  Visual Layout Preview
                </h3>

                <div className="bg-slate-100/70 p-6 rounded-3xl border border-slate-200/70 flex flex-col items-center justify-center min-h-[420px]">
                  {pages.length > 0 && pages[0].thumbnailUrl ? (
                    <div className="relative border-4 border-white rounded-2xl shadow-lg max-w-xs overflow-hidden bg-white">
                      <img
                        src={pages[0].thumbnailUrl}
                        alt="Preview page"
                        className="w-full h-auto object-contain"
                      />

                      {/* Mock visual overlay of page number position */}
                      <div
                        className={`absolute px-2.5 py-1 bg-indigo-600/90 text-white rounded font-mono text-[11px] shadow-sm pointer-events-none transition-all ${
                          options.position === 'top-left' ? 'top-3 left-3' : ''
                        } ${options.position === 'top-center' ? 'top-3 left-1/2 -translate-x-1/2' : ''} ${
                          options.position === 'top-right' ? 'top-3 right-3' : ''
                        } ${options.position === 'bottom-left' ? 'bottom-3 left-3' : ''} ${
                          options.position === 'bottom-center' ? 'bottom-3 left-1/2 -translate-x-1/2' : ''
                        } ${options.position === 'bottom-right' ? 'bottom-3 right-3' : ''}`}
                      >
                        {options.format === 'page-n-of-total'
                          ? `Page 1 of ${totalPages}`
                          : options.format === 'n-of-total'
                          ? `1 of ${totalPages}`
                          : options.format === 'page-number'
                          ? 'Page 1'
                          : '1'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">Rendering preview...</div>
                  )}

                  <p className="text-xs text-slate-500 mt-4">
                    Showing position relative to Page 1
                  </p>
                </div>
              </div>

              {/* Sidebar Settings */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5 h-fit">
                <h3 className="font-bold text-slate-900 text-base">Numbering Options</h3>

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
                        onClick={() => setOptions({ ...options, position: pos })}
                        className={`py-2 text-[11px] font-medium rounded-xl border text-center transition-colors capitalize ${
                          options.position === pos
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {pos.replace('-', ' ')}
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
                    onChange={(e) => setOptions({ ...options, format: e.target.value as PageNumberFormat })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="number">1, 2, 3...</option>
                    <option value="page-number">Page 1, Page 2...</option>
                    <option value="n-of-total">1 of 10, 2 of 10...</option>
                    <option value="page-n-of-total">Page 1 of 10, Page 2 of 10...</option>
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
                      onChange={(e) => setOptions({ ...options, fontSize: parseInt(e.target.value) || 12 })}
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
                        value={options.fontColor}
                        onChange={(e) => setOptions({ ...options, fontColor: e.target.value })}
                        className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                      />
                      <span className="text-xs text-slate-600 font-mono">{options.fontColor}</span>
                    </div>
                  </div>
                </div>

                {/* Skip First Page Checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={options.skipFirstPage}
                    onChange={(e) => setOptions({ ...options, skipFirstPage: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Skip first page (Cover page)</span>
                </label>

                <Button
                  size="lg"
                  variant="primary"
                  leftIcon={<Sparkles className="w-5 h-5" />}
                  onClick={handleAddNumbers}
                  disabled={isDocLoading}
                  className="w-full"
                >
                  Apply Page Numbers
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
