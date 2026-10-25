import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Search,
  Filter,
  Layers,
  AlertCircle,
  AlertTriangle,
  Info,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Code2
} from 'lucide-react';

export default function LogAnalyzerView({
  analysis,
  onAnalyze,
  loading
}) {
  const [activeTab, setActiveTab] = useState('patterns'); // 'patterns' or 'stream'
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedPattern, setExpandedPattern] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onAnalyze(file, null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onAnalyze(file, null);
    }
  };

  const handlePasteSubmit = (e) => {
    e.preventDefault();
    if (pastedText.trim()) {
      onAnalyze(null, pastedText);
      setShowPasteModal(false);
      setPastedText('');
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Filter patterns
  const filteredPatterns = (analysis?.patterns || []).filter(p => {
    const matchesLevel = levelFilter === 'ALL' || p.level === levelFilter;
    const matchesSearch = !searchQuery ||
      p.signature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sample.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  // Filter entries
  const filteredEntries = (analysis?.entries_sample || []).filter(e => {
    const matchesLevel = levelFilter === 'ALL' || e.level === levelFilter;
    const matchesSearch = !searchQuery ||
      e.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.service.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Upload & Dropzone Header Card */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="bg-white p-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-teal-500 transition-colors shadow-sm"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Submit System or Application Logs</h2>
              <p className="text-xs text-slate-500 mt-0.5">Drag and drop .log, .txt, or .json files, or paste raw log content.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowPasteModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Paste Log Text
            </button>
            <label className="flex-1 sm:flex-none px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer text-center">
              <span>Browse Files</span>
              <input
                type="file"
                accept=".log,.txt,.json"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Paste Raw Log Text</h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>
            <textarea
              rows={10}
              placeholder="Paste syslog, docker, kubernetes, or json log lines here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteSubmit}
                disabled={!pastedText.trim() || loading}
                className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Run Diagnostics'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analyzer Controls: Tabs & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setActiveTab('patterns')}
            className={`flex-1 md:flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'patterns'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>Clustered Patterns ({analysis?.patterns?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('stream')}
            className={`flex-1 md:flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'stream'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Parsed Stream Sample ({analysis?.entries_sample?.length || 0})</span>
          </button>
        </div>

        {/* Level Filters & Search */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {['ALL', 'CRITICAL', 'ERROR', 'WARNING', 'INFO'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                levelFilter === lvl
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}

          <div className="relative flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search signatures or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Clustered Error Patterns */}
      {activeTab === 'patterns' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-xs tracking-tight">Clustered Error Signatures</h3>
              <p className="text-[11px] text-slate-500">Dynamic tokens (IPs, UUIDs, hex pointers) normalized to group recurring root causes.</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Showing {filteredPatterns.length} pattern(s)</span>
          </div>

          {filteredPatterns.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredPatterns.map((pat, idx) => {
                const isExpanded = expandedPattern === idx;
                return (
                  <div key={idx} className="p-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={() => setExpandedPattern(isExpanded ? null : idx)}
                          className="mt-0.5 text-slate-400 hover:text-slate-600"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              pat.level === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                              pat.level === 'ERROR' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                              'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                              {pat.level}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold">
                              {pat.service}
                            </span>
                            <span className="text-xs font-bold text-slate-800 font-mono">
                              {pat.count} occurrence{pat.count > 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="font-mono text-xs text-slate-800 font-semibold break-all">
                            {pat.signature}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => copyToClipboard(pat.sample, idx)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        title="Copy sample line"
                      >
                        {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pl-7 pt-3 border-t border-slate-100 text-xs space-y-2">
                        <div>
                          <span className="text-[10px] font-semibold uppercase text-slate-400">Sample Concrete Log Line:</span>
                          <div className="mt-1 p-2 bg-slate-900 text-slate-200 rounded-md font-mono text-xs break-all">
                            {pat.sample}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-[11px] text-slate-500">
                          <span>First Seen: <strong className="font-mono text-slate-700">{pat.first_seen || 'N/A'}</strong></span>
                          <span>Last Seen: <strong className="font-mono text-slate-700">{pat.last_seen || 'N/A'}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No matching error patterns found.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Parsed Stream Sample */}
      {activeTab === 'stream' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs">Parsed Sequential Log Events</h3>
            <span className="text-xs text-slate-400 font-mono">{filteredEntries.length} entries</span>
          </div>

          {filteredEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px]">
                    <th className="py-2.5 px-3 w-12 text-slate-400">Line</th>
                    <th className="py-2.5 px-3 w-40">Timestamp</th>
                    <th className="py-2.5 px-3 w-24">Level</th>
                    <th className="py-2.5 px-3 w-32">Component</th>
                    <th className="py-2.5 px-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredEntries.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 text-slate-400 text-[11px]">{e.line_number}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-[150px]">{e.timestamp || '—'}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.level === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                          e.level === 'ERROR' ? 'bg-orange-100 text-orange-700' :
                          e.level === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                          'bg-sky-100 text-sky-700'
                        }`}>
                          {e.level}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 truncate max-w-[120px]">{e.service}</td>
                      <td className="py-2 px-3 text-slate-800 font-sans text-xs break-all">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No entries to display.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

