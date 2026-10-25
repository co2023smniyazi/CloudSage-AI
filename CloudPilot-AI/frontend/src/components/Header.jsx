import React from 'react';
import { FileCode, RefreshCw, Upload, Terminal } from 'lucide-react';

export default function Header({
  title,
  subtitle,
  activeDataset,
  onRefresh,
  onOpenUpload,
  loading
}) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {activeDataset && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
            <FileCode className="w-3.5 h-3.5 text-teal-600" />
            <span className="truncate max-w-[200px]">{activeDataset.filename}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 font-mono">{activeDataset.total_lines} lines</span>
          </div>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          title="Refresh telemetry"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
        </button>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-xs font-semibold rounded-lg shadow-sm shadow-teal-700/20 transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload & Analyze</span>
        </button>
      </div>
    </header>
  );
}

