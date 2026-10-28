import React, { useState } from 'react';
import { FileText, Sparkles, Calendar, User, BookOpen, Key, Info } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { FileUploader } from '../../components/common/FileUploader';
import { Button } from '../../components/common/Button';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { DownloadResult } from '../../components/common/DownloadResult';
import { getPdfMetadata, updatePdfMetadata } from '../../services/pdf/metadata';
import { usePdfProcessing } from '../../hooks/usePdfProcessing';
import type { PdfMetadata } from '../../types/pdf';
import { sanitizeFilename } from '../../lib/utils/formatting';

export const PdfMetadataEditorPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadata>({});
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);

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

  const handleFilesSelected = async (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setFile(selected);
      setIsLoadingMeta(true);
      try {
        const meta = await getPdfMetadata(selected);
        setMetadata(meta);
      } catch (err) {
        console.warn('Could not read metadata:', err);
      } finally {
        setIsLoadingMeta(false);
      }
    }
  };

  const handleSaveMetadata = async () => {
    if (!file) return;
    try {
      startProcessing('Writing metadata changes...');
      const resultBytes = await updatePdfMetadata(file, metadata, updateProgress);
      const finalName = sanitizeFilename(`metadata_${file.name}`, 'updated.pdf');
      finishProcessing(resultBytes, finalName);
    } catch (err) {
      failProcessing(err);
    }
  };

  const handleReset = () => {
    setFile(null);
    setMetadata({});
    resetProcessing();
  };

  return (
    <ToolLayout
      title="PDF Metadata Editor"
      description="Inspect and modify document title, author, subject, keywords, and other properties."
      icon={<FileText className="w-5 h-5" />}
      hasFiles={!!file}
      onReset={handleReset}
    >
      {resultUrl && resultFilename ? (
        <DownloadResult
          filename={resultFilename}
          resultUrl={resultUrl}
          onReset={handleReset}
          title="Metadata Updated!"
          subtitle="Document properties and metadata have been modified."
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
              title="Select a PDF to inspect metadata"
              subtitle="View and edit PDF document information and copyright properties."
            />
          ) : (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Document Information</h3>
                  <p className="text-xs text-slate-500">{file.name}</p>
                </div>
                {isLoadingMeta && (
                  <span className="text-xs text-indigo-600 font-semibold animate-pulse">
                    Reading properties...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Title */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Title</span>
                  </label>
                  <input
                    type="text"
                    value={metadata.title || ''}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                    placeholder="Document title"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                {/* Author */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Author / Creator</span>
                  </label>
                  <input
                    type="text"
                    value={metadata.author || ''}
                    onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                    placeholder="Author name"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Subject</span>
                  </label>
                  <input
                    type="text"
                    value={metadata.subject || ''}
                    onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                    placeholder="Summary or subject"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                {/* Keywords */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Keywords (comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={metadata.keywords || ''}
                    onChange={(e) => setMetadata({ ...metadata, keywords: e.target.value })}
                    placeholder="e.g. invoice, report, 2026"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                {/* Creator tool */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Application / Creator
                  </label>
                  <input
                    type="text"
                    value={metadata.creator || ''}
                    onChange={(e) => setMetadata({ ...metadata, creator: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>

                {/* Producer */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Producer
                  </label>
                  <input
                    type="text"
                    value={metadata.producer || ''}
                    onChange={(e) => setMetadata({ ...metadata, producer: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Read only timestamp info */}
              {(metadata.creationDate || metadata.modificationDate) && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap gap-6 text-xs text-slate-500">
                  {metadata.creationDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Created: {metadata.creationDate}</span>
                    </div>
                  )}
                  {metadata.modificationDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Last Modified: {metadata.modificationDate}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  size="lg"
                  variant="primary"
                  leftIcon={<Sparkles className="w-5 h-5" />}
                  onClick={handleSaveMetadata}
                >
                  Save Metadata & Download
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
