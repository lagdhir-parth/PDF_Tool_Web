import React, { useState } from 'react';
import { Image, ArrowUp, ArrowDown, Trash2, Plus, Sparkles } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { FileUploader } from '../../components/common/FileUploader';
import { Button } from '../../components/common/Button';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { DownloadResult } from '../../components/common/DownloadResult';
import { imagesToPdf, type PageSizeOption, type PageOrientationOption, type MarginOption } from '../../services/pdf/images-to-pdf';
import { usePdfProcessing } from '../../hooks/usePdfProcessing';
import { formatFileSize, sanitizeFilename } from '../../lib/utils/formatting';
import { IMAGE_ACCEPT } from '../../config/tools';

interface ImageFileItem {
  id: string;
  file: File;
  previewUrl: string;
}

export const JpgToPdfPage: React.FC = () => {
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [orientation, setOrientation] = useState<PageOrientationOption>('portrait');
  const [margin, setMargin] = useState<MarginOption>('small');
  const [outputName, setOutputName] = useState('images_converted.pdf');

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
    const newItems: ImageFileItem[] = files.map((f) => ({
      id: `${f.name}_${Date.now()}_${Math.random()}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setImages((prev) => [...prev, ...newItems]);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newItems = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newItems.length) {
      const temp = newItems[index];
      newItems[index] = newItems[targetIndex];
      newItems[targetIndex] = temp;
      setImages(newItems);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    try {
      startProcessing('Converting images to PDF...');
      const files = images.map((i) => i.file);
      const pdfBytes = await imagesToPdf(files, {
        pageSize,
        orientation,
        margin,
        onProgress: updateProgress,
      });
      const finalName = sanitizeFilename(outputName, 'images_converted.pdf');
      finishProcessing(pdfBytes, finalName);
    } catch (err) {
      failProcessing(err);
    }
  };

  const handleReset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    resetProcessing();
  };

  return (
    <ToolLayout
      title="JPG / PNG to PDF"
      description="Convert images to clean, professionally formatted PDF documents."
      icon={<Image className="w-5 h-5" />}
      hasFiles={images.length > 0}
      onReset={handleReset}
    >
      {resultUrl && resultFilename ? (
        <DownloadResult
          filename={resultFilename}
          resultUrl={resultUrl}
          onReset={handleReset}
          title="Images Converted to PDF!"
          subtitle={`Successfully converted ${images.length} images into a single PDF.`}
        />
      ) : isProcessing ? (
        <ProgressIndicator progress={progress} statusMessage={statusMessage} />
      ) : (
        <div className="space-y-6">
          <ErrorMessage message={error} />

          {images.length === 0 ? (
            <FileUploader
              onFilesSelected={handleFilesSelected}
              accept={IMAGE_ACCEPT}
              multiple={true}
              title="Select or drop images here"
              subtitle="Supports JPG, JPEG, and PNG images. 100% private in browser."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Image Grid / Order */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800">
                    Uploaded Images ({images.length})
                  </h3>
                  <span className="text-xs text-slate-400">
                    Use arrows to adjust page ordering
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((item, index) => (
                    <div
                      key={item.id}
                      className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="w-full aspect-square bg-slate-100 flex items-center justify-center p-2 overflow-hidden">
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>

                      <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-1">
                          <span className="font-bold text-slate-700 block truncate">
                            #{index + 1} {item.file.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatFileSize(item.file.size)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveImage(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:text-indigo-600 disabled:opacity-20 rounded"
                            title="Move left"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(index, 'down')}
                            disabled={index === images.length - 1}
                            className="p-1 hover:text-indigo-600 disabled:opacity-20 rounded"
                            title="Move right"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(item.id)}
                            className="p-1 hover:text-rose-600 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add more button */}
                <div className="pt-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>Add More Images</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
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

              {/* Sidebar Settings */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5 h-fit">
                <h3 className="font-bold text-slate-900 text-base">Page Options</h3>

                {/* Page Size */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Page Size
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as PageSizeOption)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="a4">A4 (Standard Document)</option>
                    <option value="letter">US Letter</option>
                    <option value="fit">Fit to Image Size</option>
                  </select>
                </div>

                {/* Orientation */}
                {pageSize !== 'fit' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Orientation
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrientation('portrait')}
                        className={`py-2 text-xs font-medium rounded-xl border transition-colors ${
                          orientation === 'portrait'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Portrait
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrientation('landscape')}
                        className={`py-2 text-xs font-medium rounded-xl border transition-colors ${
                          orientation === 'landscape'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Landscape
                      </button>
                    </div>
                  </div>
                )}

                {/* Margin */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Page Margin
                  </label>
                  <select
                    value={margin}
                    onChange={(e) => setMargin(e.target.value as MarginOption)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="none">No Margin (Border to border)</option>
                    <option value="small">Small Margin (0.25 inch)</option>
                    <option value="normal">Normal Margin (0.5 inch)</option>
                    <option value="large">Large Margin (1 inch)</option>
                  </select>
                </div>

                {/* Output Filename */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Output File Name
                  </label>
                  <input
                    type="text"
                    value={outputName}
                    onChange={(e) => setOutputName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                <Button
                  size="lg"
                  variant="primary"
                  leftIcon={<Sparkles className="w-5 h-5" />}
                  onClick={handleConvert}
                  disabled={images.length === 0}
                  className="w-full"
                >
                  Convert to PDF
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
