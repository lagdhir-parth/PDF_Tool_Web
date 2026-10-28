import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string | null;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl my-4 text-sm animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs">
      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      <div className="flex-1 font-medium">{message}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-rose-500 hover:text-rose-700 p-0.5 rounded-md hover:bg-rose-100 transition-colors"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
