import React, { useState } from 'react';
import { CheckSquare, Sparkles, AlertCircle } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { FileUploader } from '../../components/common/FileUploader';
import { Button } from '../../components/common/Button';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { DownloadResult } from '../../components/common/DownloadResult';
import { getPdfFormFields, fillPdfForm } from '../../services/pdf/forms';
import { usePdfProcessing } from '../../hooks/usePdfProcessing';
import type { FormFieldItem } from '../../types/pdf';
import { sanitizeFilename } from '../../lib/utils/formatting';

export const FillPdfFormsPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FormFieldItem[]>([]);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [flatten, setFlatten] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

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
      setIsLoadingFields(true);
      try {
        const detectedFields = await getPdfFormFields(selected);
        setFields(detectedFields);

        // Prepopulate form state with initial field values
        const initialMap: Record<string, string | boolean> = {};
        detectedFields.forEach((f) => {
          initialMap[f.name] = f.value;
        });
        setValues(initialMap);
      } catch (err) {
        console.warn('Form detection error:', err);
      } finally {
        setIsLoadingFields(false);
      }
    }
  };

  const updateFieldValue = (name: string, val: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: val }));
  };

  const handleSaveForm = async () => {
    if (!file) return;
    try {
      startProcessing('Filling form fields...');
      const resultBytes = await fillPdfForm(file, values, {
        flatten,
        onProgress: updateProgress,
      });
      const finalName = sanitizeFilename(`filled_${file.name}`, 'filled_form.pdf');
      finishProcessing(resultBytes, finalName);
    } catch (err) {
      failProcessing(err);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFields([]);
    setValues({});
    resetProcessing();
  };

  return (
    <ToolLayout
      title="Fill PDF Forms"
      description="Directly edit and fill interactive PDF AcroForm fields in your browser."
      icon={<CheckSquare className="w-5 h-5" />}
      hasFiles={!!file}
      onReset={handleReset}
    >
      {resultUrl && resultFilename ? (
        <DownloadResult
          filename={resultFilename}
          resultUrl={resultUrl}
          onReset={handleReset}
          title="Form Filled Successfully!"
          subtitle={`Updated form fields and saved${flatten ? ' (flattened to static document)' : ''}.`}
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
              title="Select an interactive PDF form"
              subtitle="Fill out text inputs, checkboxes, and dropdowns completely client-side."
            />
          ) : (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Interactive Form Fields</h3>
                  <p className="text-xs text-slate-500">
                    {file.name} ({fields.length} interactive fields detected)
                  </p>
                </div>

                {isLoadingFields && (
                  <span className="text-xs text-indigo-600 font-semibold animate-pulse">
                    Scanning fields...
                  </span>
                )}
              </div>

              {fields.length === 0 && !isLoadingFields ? (
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                  <h4 className="font-bold text-amber-900 text-sm">
                    No Interactive Form Fields Found
                  </h4>
                  <p className="text-xs text-amber-700 max-w-md mx-auto">
                    This document appears to be a standard flat PDF or uses proprietary dynamic XFA format. If you need to add text over lines, try using our <strong>Add Text to PDF</strong> tool instead.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field) => (
                    <div
                      key={field.name}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1.5"
                    >
                      <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                        <span className="truncate pr-2">{field.name}</span>
                        <span className="text-[10px] uppercase font-mono text-slate-400 bg-white px-2 py-0.5 rounded border">
                          {field.type}
                        </span>
                      </label>

                      {field.type === 'checkbox' ? (
                        <label className="flex items-center gap-2 cursor-pointer pt-1 text-sm text-slate-700 select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(values[field.name])}
                            onChange={(e) => updateFieldValue(field.name, e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Checked / Selected</span>
                        </label>
                      ) : field.type === 'dropdown' || field.type === 'radio' ? (
                        <select
                          value={String(values[field.name] || '')}
                          onChange={(e) => updateFieldValue(field.name, e.target.value)}
                          className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                        >
                          <option value="">-- Choose Option --</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={String(values[field.name] || '')}
                          onChange={(e) => updateFieldValue(field.name, e.target.value)}
                          className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                        />
                      )}
                    </div>
                  ))}

                  {/* Flatten Form setting */}
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="flattenCheckbox"
                      checked={flatten}
                      onChange={(e) => setFlatten(e.target.checked)}
                      className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <label
                        htmlFor="flattenCheckbox"
                        className="text-xs font-bold text-slate-900 block cursor-pointer"
                      >
                        Flatten Form Fields (Make Read-Only)
                      </label>
                      <p className="text-xs text-slate-500">
                        Burns the entered values directly into the page content so the fields cannot be edited or modified further.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <Button
                      size="lg"
                      variant="primary"
                      leftIcon={<Sparkles className="w-5 h-5" />}
                      onClick={handleSaveForm}
                    >
                      Save & Download PDF Form
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
