import React, { useState } from 'react';
import { Files, ArrowUp, ArrowDown, Trash2, Plus, Sparkles } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { FileUploader } from '../../components/common/FileUploader';
import { Button } from '../../components/common/Button';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { DownloadResult } from '../../components/common/DownloadResult';
import { mergePdfs } from '../../services/pdf/merge';
import { usePdfProcessing } from '../../hooks/usePdfProcessing';
import { getPdfPageCount } from '../../lib/pdf/render';
import { formatFileSize, sanitizeFilename } from '../../lib/utils/formatting';
import type { UploadedFileItem } from '../../types/pdf';

export const MergePdfPage: React.FC = () => {
  const [items, setItems] = useState<UploadedFileItem[]>([]);
  const [outputName, setOutputName] = useState('merged_document.pdf');
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

  const handleFilesSelected = async (newFiles: File[]) => {
    const newItems: UploadedFileItem[] = [];
    for (const f of newFiles) {
      const item: UploadedFileItem = {
        id: `${f.name}_${Date.now()}_${Math.random()}`,
        file: f,
        name: f.name,
        size: f.size,
      };
      newItems.push(item);
    }

    setItems((prev) => [...prev, ...newItems]);

    // Asynchronously fetch page counts for each file
    for (const item of newItems) {
      try {
        const count = await getPdfPageCount(item.file);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, pageCount: count } : i))
        );
      } catch {
        // Fallback if counting fails
      }
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newItems.length) {
      const temp = newItems[index];
      newItems[index] = newItems[targetIndex];
      newItems[targetIndex] = temp;
      setItems(newItems);
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleMerge = async () => {
    if (items.length < 2) return;
    try {
      startProcessing('Starting merge...');
      const files = items.map((i) => i.file);
      const mergedBytes = await mergePdfs(files, {
        onProgress: updateProgress,
      });
      const finalName = sanitizeFilename(outputName, 'merged_document.pdf');
      finishProcessing(mergedBytes, finalName);
    } catch (err) {
      failProcessing(err);
    }
  };

  const handleReset = () => {
    setItems([]);
    resetProcessing();
  };

  const totalPages = items.reduce((acc, curr) => acc + (curr.pageCount || 0), 0);

  return (
    <ToolLayout
      title="Merge PDF Documents"
      description="Combine multiple PDF documents into a single organized file in seconds."
      icon={<Files className="w-5 h-5" />}
      hasFiles={items.length > 0}
      onReset={handleReset}
    >
      {resultUrl && resultFilename ? (
        <DownloadResult
          filename={resultFilename}
          resultUrl={resultUrl}
          onReset={handleReset}
          title="Documents Merged Successfully!"
          subtitle={`Combined ${items.length} files (${totalPages} total pages) without server upload.`}
        />
      ) : isProcessing ? (
        <ProgressIndicator progress={progress} statusMessage={statusMessage} />
      ) : (
        <div className="space-y-6">
          <ErrorMessage message={error} />

          {items.length === 0 ? (
            <FileUploader
              onFilesSelected={handleFilesSelected}
              multiple={true}
              title="Select or drop multiple PDFs here"
              subtitle="Combine 2 or more files into a single PDF directly in your browser."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* File list & ordering */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800">
                    Files to Merge ({items.length})
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Drag or use buttons to set order
                  </span>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate" title={item.name}>
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatFileSize(item.size)}
                            {item.pageCount ? ` • ${item.pageCount} pages` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === items.length - 1}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Move down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-1"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add more button */}
                <div className="pt-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>Add More Files</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFilesSelected(Array.from(e.target.files));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Sidebar Configuration */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6 h-fit">
                <h3 className="font-bold text-slate-900 text-base">Merge Settings</h3>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Output File Name
                  </label>
                  <input
                    type="text"
                    value={outputName}
                    onChange={(e) => setOutputName(e.target.value)}
                    placeholder="merged_document.pdf"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Files:</span>
                    <span className="font-semibold text-slate-900">{items.length}</span>
                  </div>
                  {totalPages > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Total Expected Pages:</span>
                      <span className="font-semibold text-slate-900">{totalPages}</span>
                    </div>
                  )}
                </div>

                <Button
                  size="lg"
                  variant="primary"
                  leftIcon={<Sparkles className="w-5 h-5" />}
                  onClick={handleMerge}
                  disabled={items.length < 2}
                  className="w-full"
                >
                  Merge {items.length} Files
                </Button>

                {items.length < 2 && (
                  <p className="text-xs text-amber-600 text-center font-medium">
                    Select at least 2 PDF files to merge
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
