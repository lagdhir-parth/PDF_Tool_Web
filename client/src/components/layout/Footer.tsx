import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Cpu, Sparkles } from 'lucide-react';


export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-24 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-base">PDFStudio</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Modern, privacy-first PDF utility suite running entirely on WebAssembly, PDF.js, and pdf-lib directly inside your browser.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2.5 py-1.5 rounded-lg w-fit">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero server document storage</span>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
                Organize & Pages
              </h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/merge-pdf" className="hover:text-white transition-colors">Merge PDF</Link></li>
                <li><Link to="/split-pdf" className="hover:text-white transition-colors">Split PDF</Link></li>
                <li><Link to="/organize-pdf" className="hover:text-white transition-colors">Organize Pages</Link></li>
                <li><Link to="/rotate-pdf" className="hover:text-white transition-colors">Rotate Pages</Link></li>
                <li><Link to="/delete-pdf-pages" className="hover:text-white transition-colors">Delete Pages</Link></li>
                <li><Link to="/extract-pdf-pages" className="hover:text-white transition-colors">Extract Pages</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
                Edit & Watermark
              </h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/add-page-numbers" className="hover:text-white transition-colors">Add Page Numbers</Link></li>
                <li><Link to="/watermark-pdf" className="hover:text-white transition-colors">Watermark PDF</Link></li>
                <li><Link to="/add-text-to-pdf" className="hover:text-white transition-colors">Add Text Overlay</Link></li>
                <li><Link to="/pdf-metadata-editor" className="hover:text-white transition-colors">Metadata Editor</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
                Convert & Forms
              </h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/jpg-to-pdf" className="hover:text-white transition-colors">JPG to PDF</Link></li>
                <li><Link to="/fill-pdf-forms" className="hover:text-white transition-colors">Fill PDF Forms</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security / Privacy pledge */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Shield className="w-4 h-4 text-indigo-400" />
              100% Client-Side Privacy Guarantee
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Cpu className="w-4 h-4 text-blue-400" />
              Native Hardware Powered
            </span>
          </div>

          <p className="text-slate-500">
            All operations executed locally on your device. Documents never leave your browser.
          </p>
        </div>
      </div>
    </footer>
  );
};
