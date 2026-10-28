import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Files,
  Scissors,
  Image,
  LayoutGrid,
  RotateCw,
  Hash,
  Stamp,
  Trash2,
  FileOutput,
  Type,
  FileText,
  CheckSquare,
  Search,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { TOOLS } from '../config/tools';

const ICON_MAP: Record<string, React.ReactNode> = {
  Files: <Files className="w-6 h-6" />,
  Scissors: <Scissors className="w-6 h-6" />,
  Image: <Image className="w-6 h-6" />,
  LayoutGrid: <LayoutGrid className="w-6 h-6" />,
  RotateCw: <RotateCw className="w-6 h-6" />,
  Hash: <Hash className="w-6 h-6" />,
  Stamp: <Stamp className="w-6 h-6" />,
  Trash2: <Trash2 className="w-6 h-6" />,
  FileOutput: <FileOutput className="w-6 h-6" />,
  Type: <Type className="w-6 h-6" />,
  FileText: <FileText className="w-6 h-6" />,
  CheckSquare: <CheckSquare className="w-6 h-6" />,
};

export const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All 12 Tools' },
    { id: 'organize', label: 'Organize' },
    { id: 'convert', label: 'Convert' },
    { id: 'edit', label: 'Edit' },
    { id: 'forms', label: 'Forms' },
  ];

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesSearch =
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || tool.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-16 animate-in fade-in duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-8 sm:pt-20 sm:pb-12 text-center max-w-4xl mx-auto px-4">
        {/* Privacy Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold mb-6 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>100% Client-Side • Your Files Never Leave This Device</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-5">
          Every PDF Tool You Need.{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 bg-clip-text text-transparent block sm:inline">
            100% Free & Private.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Merge, split, rotate, watermark, convert, and edit PDF documents locally in your browser with zero server uploads and unmatched speed.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all 12 tools (e.g. merge, split, watermark, rotate)..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Tools Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.map((tool) => (
            <Link
              key={tool.id}
              to={tool.path}
              className="group relative bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-indigo-400 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200 shadow-2xs">
                    {ICON_MAP[tool.iconName] || <FileText className="w-6 h-6" />}
                  </div>

                  {tool.badge && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                      {tool.badge}
                    </span>
                  )}
                </div>

                <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
                  {tool.title}
                </h2>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">
                <span className="capitalize text-[11px] text-slate-400">
                  {tool.category}
                </span>
                <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 max-w-md mx-auto">
            <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">No tools found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try searching for something else or clear the category filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 text-xs font-semibold text-indigo-600 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Privacy Guarantee & Architecture Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-indigo-200 mb-4 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Next-Gen Architecture</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 tracking-tight">
              Why 100% Client-Side PDF Processing?
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              Most online PDF converters upload your confidential contracts, financial statements, and sensitive personal files to unknown third-party servers. PDFStudio runs entirely on your local machine using standard WebAssembly and Canvas APIs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm">Complete Privacy</h4>
                <p className="text-xs text-slate-400">
                  Document bytes never leave your memory buffer. No logs, no telemetry on files.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-300">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm">Blazing Fast</h4>
                <p className="text-xs text-slate-400">
                  Zero upload/download bandwidth bottlenecks. Instant processing powered by your CPU.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm">Unlimited & Free</h4>
                <p className="text-xs text-slate-400">
                  No paywalls, subscriptions, or daily limits. Process documents anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
