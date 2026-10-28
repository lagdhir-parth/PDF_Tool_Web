import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, RotateCcw, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';

interface ToolLayoutProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  hasFiles?: boolean;
  onReset?: () => void;
  children: React.ReactNode;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  title,
  description,
  icon,
  hasFiles = false,
  onReset,
  children,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
            <Link to="/" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Tools</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{title}</span>
          </nav>

          {/* Title & Description */}
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
        </div>

        {/* Actions: Privacy pill & Start Over button */}
        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Local Processing</span>
          </div>

          {hasFiles && onReset && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={onReset}
            >
              Start Over
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full">{children}</div>
    </div>
  );
};
