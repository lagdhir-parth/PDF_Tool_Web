import { RotateCw, Check, Loader2 } from 'lucide-react';
import type { PdfPageItem } from '../../types/pdf';

interface PdfThumbnailProps {
  page: PdfPageItem;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
  onRotate?: (e: React.MouseEvent) => void;
  showSelectCheckbox?: boolean;
  showRotateButton?: boolean;
  className?: string;
}

export const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  page,
  isSelected = false,
  onToggleSelect,
  onRotate,
  showSelectCheckbox = true,
  showRotateButton = true,
  className = '',
}) => {
  return (
    <div
      onClick={onToggleSelect}
      className={`group relative flex flex-col items-center bg-white rounded-2xl border-2 transition-all duration-200 select-none cursor-pointer overflow-hidden shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-indigo-600 ring-2 ring-indigo-500/30'
          : 'border-slate-200 hover:border-slate-300'
      } ${className}`}
    >
      {/* Top Header / Checkbox & Page Number */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-700">
        <span className="flex items-center gap-1.5">
          {showSelectCheckbox && (
            <div
              className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-300 bg-white group-hover:border-slate-400'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          )}
          <span>Page {page.pageNumber}</span>
        </span>

        {page.rotation !== 0 && (
          <span className="text-[10px] text-indigo-600 font-mono bg-indigo-50 px-1.5 py-0.5 rounded">
            {page.rotation}°
          </span>
        )}
      </div>

      {/* Thumbnail Image Viewport */}
      <div className="relative w-full aspect-[1/1.414] bg-slate-100 flex items-center justify-center p-2 overflow-hidden">
        {page.thumbnailUrl ? (
          <img
            src={page.thumbnailUrl}
            alt={`Page ${page.pageNumber}`}
            className="w-full h-full object-contain rounded shadow-2xs transition-transform duration-200"
            style={{ transform: `rotate(${page.rotation}deg)` }}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center text-slate-400 gap-1.5">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[10px]">Loading preview...</span>
          </div>
        )}

        {/* Hover Action Overlay */}
        {showRotateButton && onRotate && (
          <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRotate(e);
              }}
              className="pointer-events-auto p-2 bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-full shadow-md active:scale-95 transition-all"
              title="Rotate 90° clockwise"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
