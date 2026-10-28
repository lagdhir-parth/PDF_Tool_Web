import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, ChevronDown } from 'lucide-react';
import { TOOLS } from '../../config/tools';

export const Header: React.FC = () => {
  const [toolsOpen, setToolsOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
              PDF<span className="text-indigo-600 font-bold">Studio</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              100% Client-Side
            </span>
          </div>
        </Link>

        {/* Navigation & Tools Dropdown */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span>All 12 Tools</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {toolsOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setToolsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-150 grid grid-cols-1 divide-y divide-slate-100 max-h-[80vh] overflow-y-auto">
                  {TOOLS.map((tool) => (
                    <Link
                      key={tool.id}
                      to={tool.path}
                      onClick={() => setToolsOpen(false)}
                      className="flex flex-col px-4 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-800">
                        {tool.title}
                      </span>
                      <span className="text-xs text-slate-500 line-clamp-1">
                        {tool.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Privacy Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Private & Browser-Only</span>
          </div>
        </div>
      </div>
    </header>
  );
};
