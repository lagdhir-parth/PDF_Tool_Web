import React, { useState, useCallback } from 'react';
import {
  Files,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { FileUploader } from '../../components/common/FileUploader';
import { Button } from '../../components/common/Button';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { DownloadResult } from '../../components/common/DownloadResult';
import { mergePdfs, type MergeSourceItem } from '../../services/pdf/merge';
import { usePdfProcessing } from '../../hooks/usePdfProcessing';
import { loadPdfJsDocument } from '../../lib/pdf/render';
import { thumbnailCache } from '../../lib/pdf/thumbnail-cache';
import { parsePageRange } from '../../lib/utils/page-ranges';
import { formatFileSize, sanitizeFilename } from '../../lib/utils/formatting';

interface MergeFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  previewPage: number;
  thumbnailUrl?: string;
  pageRange: string;
  rangeError?: string;
  parsedIndices?: number[];
  docProxy?: PDFDocumentProxy;
}

interface SortableMergeCardProps {
  item: MergeFileItem;
  index: number;
  totalFiles: number;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onRemove: (id: string) => void;
  onPrevPage: (id: string) => void;
  onNextPage: (id: string) => void;
  onRangeChange: (id: string, range: string) => void;
}

const SortableMergeCard: React.FC<SortableMergeCardProps> = ({
  item,
  index,
  totalFiles,
  onMove,
  onRemove,
  onPrevPage,
  onNextPage,
  onRangeChange,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 20 : 1,
  };

  const selectedCount = item.parsedIndices
    ? item.parsedIndices.length
    : item.pageCount || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all select-none"
    >
      {/* Drag handle and Order index */}
      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1.5 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing rounded-lg hover:bg-slate-100"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
          {index + 1}
        </div>
      </div>

      {/* Single-Page Thumbnail Preview with Left/Right Navigation */}
      <div className="flex flex-col items-center gap-1.5 shrink-0 self-center sm:self-auto">
        <div className="relative w-20 h-28 bg-slate-100 rounded-xl border border-slate-200/80 overflow-hidden flex items-center justify-center shadow-2xs">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={`Page ${item.previewPage}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span className="text-[9px]">Loading...</span>
            </div>
          )}
        </div>

        {/* Navigation arrows & current page indicator */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded-lg text-[10px] text-slate-600 font-mono">
          <button
            type="button"
            disabled={item.previewPage <= 1}
            onClick={() => onPrevPage(item.id)}
            className="p-0.5 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
            title="Previous preview page"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <span>
            {item.previewPage} / {item.pageCount || '?'}
          </span>
          <button
            type="button"
            disabled={!item.pageCount || item.previewPage >= item.pageCount}
            onClick={() => onNextPage(item.id)}
            className="p-0.5 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
            title="Next preview page"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* File Information and Custom Range Input */}
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <p className="text-sm font-semibold text-slate-800 truncate" title={item.name}>
            {item.name}
          </p>
          <p className="text-xs text-slate-400">
            {formatFileSize(item.size)}
            {item.pageCount ? ` • ${item.pageCount} pages total` : ' • reading...'}
          </p>
        </div>

        {/* Page range configuration */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <FileText className="w-3 h-3 text-indigo-600" />
            <span>Page Range for Merge</span>
            <span className="text-[10px] text-slate-400 font-normal">(e.g. 1-5, 8 or empty for all)</span>
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="text"
              value={item.pageRange}
              onChange={(e) => onRangeChange(item.id, e.target.value)}
              placeholder={`All pages (1-${item.pageCount || '?'})`}
              className={`w-full sm:max-w-xs px-2.5 py-1.5 text-xs rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 ${
                item.rangeError
                  ? 'border-rose-400 text-rose-700 focus:ring-rose-400'
                  : 'border-slate-300 text-slate-800 focus:ring-indigo-500'
              }`}
            />
            <span className="text-[11px] font-medium text-slate-500 shrink-0">
              {item.rangeError ? (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {item.rangeError}
                </span>
              ) : item.pageRange.trim() ? (
                <span className="text-indigo-600 font-semibold">
                  {selectedCount} page{selectedCount === 1 ? '' : 's'} included
                </span>
              ) : (
                <span className="text-slate-500">All {item.pageCount || ''} pages included</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Order & Remove Controls */}
      <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={() => onMove(index, 'up')}
          disabled={index === 0}
          className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-100 transition-colors"
          title="Move up"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 'down')}
          disabled={index === totalFiles - 1}
          className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-100 transition-colors"
          title="Move down"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-1"
          title="Remove file"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const MergePdfPage: React.FC = () => {
  const [items, setItems] = useState<MergeFileItem[]>([]);
  const [outputName, setOutputName] = useState('merged_document.pdf');
  const [isInitializing, setIsInitializing] = useState(false);

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadFileDocAndThumbnail = useCallback(
    async (file: File, pageNum: number, docProxy?: PDFDocumentProxy) => {
      const fingerprint = `${file.name}_${file.size}_${file.lastModified}`;
      const doc = docProxy || (await loadPdfJsDocument(file));
      const thumb = await thumbnailCache.getOrRenderThumbnail(doc, fingerprint, pageNum, 0.4);
      return { doc, thumb, count: doc.numPages };
    },
    []
  );

  const handleFilesSelected = async (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    setIsInitializing(true);

    const initialNewItems: MergeFileItem[] = newFiles.map((f) => ({
      id: `${f.name}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file: f,
      name: f.name,
      size: f.size,
      previewPage: 1,
      pageRange: '',
    }));

    setItems((prev) => [...prev, ...initialNewItems]);

    // Load PDF info & page 1 thumbnail asynchronously
    for (const item of initialNewItems) {
      try {
        const { doc, thumb, count } = await loadFileDocAndThumbnail(item.file, 1);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  pageCount: count,
                  thumbnailUrl: thumb,
                  docProxy: doc,
                }
              : i
          )
        );
      } catch (err) {
        console.warn(`Failed loading PDF structure for ${item.name}:`, err);
      }
    }
    setIsInitializing(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(prev, oldIndex, newIndex);
        }
        return prev;
      });
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < items.length) {
      setItems((prev) => arrayMove(prev, index, targetIndex));
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const removed = prev.find((i) => i.id === id);
      if (removed?.docProxy) {
        removed.docProxy.cleanup?.();
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const handlePrevPage = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item || item.previewPage <= 1) return;
    const newPage = item.previewPage - 1;

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, previewPage: newPage } : i))
    );

    try {
      const { thumb } = await loadFileDocAndThumbnail(item.file, newPage, item.docProxy);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, thumbnailUrl: thumb } : i))
      );
    } catch {
      // Ignored
    }
  };

  const handleNextPage = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item || !item.pageCount || item.previewPage >= item.pageCount) return;
    const newPage = item.previewPage + 1;

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, previewPage: newPage } : i))
    );

    try {
      const { thumb } = await loadFileDocAndThumbnail(item.file, newPage, item.docProxy);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, thumbnailUrl: thumb } : i))
      );
    } catch {
      // Ignored
    }
  };

  const handleRangeChange = (id: string, rangeStr: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (!rangeStr.trim()) {
          return {
            ...i,
            pageRange: rangeStr,
            rangeError: undefined,
            parsedIndices: undefined,
          };
        }

        try {
          const total = i.pageCount || 9999;
          const indices = parsePageRange(rangeStr, total);
          if (indices.length === 0) {
            return {
              ...i,
              pageRange: rangeStr,
              rangeError: 'No valid pages found in range',
              parsedIndices: undefined,
            };
          }
          return {
            ...i,
            pageRange: rangeStr,
            rangeError: undefined,
            parsedIndices: indices,
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Invalid range format';
          return {
            ...i,
            pageRange: rangeStr,
            rangeError: msg,
            parsedIndices: undefined,
          };
        }
      })
    );
  };

  const handleMerge = async () => {
    if (items.length < 2) return;

    // Validate that no files have range errors
    const hasErrors = items.some((i) => Boolean(i.rangeError));
    if (hasErrors) {
      return;
    }

    try {
      startProcessing('Starting merge...');

      const mergeInputs: MergeSourceItem[] = items.map((i) => ({
        file: i.file,
        pageIndices: i.parsedIndices,
      }));

      const mergedBytes = await mergePdfs(mergeInputs, {
        onProgress: updateProgress,
      });

      const finalName = sanitizeFilename(outputName, 'merged_document.pdf');
      finishProcessing(mergedBytes, finalName);
    } catch (err) {
      failProcessing(err);
    }
  };

  const handleReset = () => {
    items.forEach((i) => i.docProxy?.cleanup?.());
    setItems([]);
    resetProcessing();
  };

  const totalPagesSelected = items.reduce((acc, curr) => {
    if (curr.rangeError) return acc;
    if (curr.parsedIndices) return acc + curr.parsedIndices.length;
    return acc + (curr.pageCount || 0);
  }, 0);

  const hasAnyErrors = items.some((i) => Boolean(i.rangeError));

  return (
    <ToolLayout
      title="Merge PDF Documents"
      description="Combine multiple PDF documents into a single organized file with per-file page ranges."
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
          subtitle={`Combined ${items.length} files (${totalPagesSelected} total pages) in your custom order.`}
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
                    Drag handles or use arrows to adjust order
                  </span>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <SortableMergeCard
                          key={item.id}
                          item={item}
                          index={index}
                          totalFiles={items.length}
                          onMove={moveItem}
                          onRemove={removeItem}
                          onPrevPage={handlePrevPage}
                          onNextPage={handleNextPage}
                          onRangeChange={handleRangeChange}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Add more files button */}
                <div className="pt-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2.5 rounded-xl transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>Add More PDF Files</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFilesSelected(Array.from(e.target.files));
                          e.target.value = '';
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
                  {totalPagesSelected > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Total Expected Pages:</span>
                      <span className="font-semibold text-indigo-600 font-bold">
                        {totalPagesSelected}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  size="lg"
                  variant="primary"
                  leftIcon={
                    isInitializing ? (
                      <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )
                  }
                  onClick={handleMerge}
                  disabled={items.length < 2 || isInitializing || hasAnyErrors}
                  className="w-full"
                >
                  {isInitializing
                    ? 'Loading Documents...'
                    : `Merge ${items.length} Files`}
                </Button>

                {items.length < 2 && (
                  <p className="text-xs text-amber-600 text-center font-medium">
                    Select at least 2 PDF files to merge
                  </p>
                )}

                {hasAnyErrors && (
                  <p className="text-xs text-rose-600 text-center font-medium">
                    Please correct invalid page range entries above
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
