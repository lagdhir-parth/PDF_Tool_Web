import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressIndicatorProps {
  progress: number;
  statusMessage: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  statusMessage,
}) => {
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-center gap-2 mb-3 text-indigo-600">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="font-semibold text-slate-800">Processing locally...</span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
        <span className="truncate pr-2">{statusMessage || 'Please wait...'}</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
};
