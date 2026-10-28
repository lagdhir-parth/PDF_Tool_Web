import React, { useMemo } from 'react';
import { parsePageRange } from '../../lib/utils/page-ranges';

interface PageRangeInputProps {
  value: string;
  onChange: (value: string) => void;
  totalPages: number;
  label?: string;
}

export const PageRangeInput: React.FC<PageRangeInputProps> = ({
  value,
  onChange,
  totalPages,
  label = 'Select Page Ranges',
}) => {
  const parsedCount = useMemo(() => {
    try {
      if (!value.trim()) return 0;
      const indices = parsePageRange(value, totalPages);
      return indices.length;
    } catch {
      return null;
    }
  }, [value, totalPages]);

  const setAll = () => {
    onChange(`1-${totalPages}`);
  };

  const setOdd = () => {
    const odds: number[] = [];
    for (let i = 1; i <= totalPages; i += 2) odds.push(i);
    onChange(odds.join(', '));
  };

  const setEven = () => {
    const evens: number[] = [];
    for (let i = 2; i <= totalPages; i += 2) evens.push(i);
    onChange(evens.join(', '));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700">{label}</label>
        {totalPages > 0 && (
          <span className="text-xs text-slate-500">
            Total document pages: <span className="font-semibold text-slate-800">{totalPages}</span>
          </span>
        )}
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 1-3, 5, 8-10"
        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={setAll}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium"
          >
            All Pages
          </button>
          <button
            type="button"
            onClick={setOdd}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium"
          >
            Odd Pages
          </button>
          <button
            type="button"
            onClick={setEven}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium"
          >
            Even Pages
          </button>
        </div>

        {value.trim() && (
          <div className="text-xs font-medium">
            {parsedCount === null ? (
              <span className="text-rose-600">Invalid range format</span>
            ) : (
              <span className="text-indigo-600">{parsedCount} page(s) selected</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
