import React from 'react';
import { Download, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { downloadBlob, fireConfetti } from '../../lib/files/download';

interface DownloadResultProps {
  filename: string;
  resultUrl: string;
  blob?: Blob | Uint8Array;
  onReset: () => void;
  title?: string;
  subtitle?: string;
}

export const DownloadResult: React.FC<DownloadResultProps> = ({
  filename,
  resultUrl,
  blob,
  onReset,
  title = 'Your PDF is ready!',
  subtitle = 'Processed locally and securely in your browser.',
}) => {
  const handleDownload = () => {
    if (blob) {
      downloadBlob(blob, filename);
    } else {
      const a = document.createElement('a');
      a.href = resultUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      fireConfetti();
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-xs">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-1">{title}</h2>
      <p className="text-sm text-slate-500 mb-6">{subtitle}</p>

      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6 text-left">
        <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-1">
          Output Document
        </div>
        <div className="text-sm font-semibold text-slate-800 truncate" title={filename}>
          {filename}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          variant="primary"
          leftIcon={<Download className="w-5 h-5" />}
          onClick={handleDownload}
          className="w-full text-base py-3.5"
        >
          Download PDF
        </Button>

        <div className="flex items-center gap-2 pt-2">
          <Button
            size="md"
            variant="outline"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={onReset}
            className="flex-1"
          >
            Process Another
          </Button>

          <Link to="/" className="flex-1">
            <Button
              size="md"
              variant="ghost"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full"
            >
              All Tools
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
