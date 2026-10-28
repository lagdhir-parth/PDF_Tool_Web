import { useDropzone, type Accept } from "react-dropzone";
import { UploadCloud, FileUp } from "lucide-react";
import { Button } from "./Button";

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Accept;
  multiple?: boolean;
  maxFiles?: number;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  accept = { "application/pdf": [".pdf"] },
  multiple = false,
  maxFiles = 20,
  title = "Select or drop files here",
  subtitle = "100% private. Files never leave your browser.",
  className = "",
}) => {
  const { getRootProps, getInputProps, isDragActive, isDragReject, open } =
    useDropzone({
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          onFilesSelected(acceptedFiles);
        }
      },
      accept,
      multiple,
      maxFiles,
      noClick: true,
    });

  return (
    <div
      {...getRootProps({
        onClick: open,
      })}
      className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 select-none
        ${
          isDragReject
            ? "border-rose-400 bg-rose-50/50"
            : isDragActive
              ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]"
              : "border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/70 shadow-xs"
        } ${className}`}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center justify-center">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-200 ${
            isDragActive
              ? "bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/30"
              : "bg-indigo-50 text-indigo-600"
          }`}
        >
          {isDragActive ? (
            <FileUp className="w-8 h-8" />
          ) : (
            <UploadCloud className="w-8 h-8" />
          )}
        </div>

        <h3 className="text-xl font-semibold text-slate-800 mb-1">
          {isDragActive ? "Drop files right here" : title}
        </h3>

        <p className="text-sm text-slate-500 max-w-sm mb-6">{subtitle}</p>

        <Button
          type="button"
          variant="primary"
          size="md"
          leftIcon={<UploadCloud className="w-4 h-4" />}
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
        >
          Choose {multiple ? "Files" : "File"}
        </Button>
      </div>
    </div>
  );
};
