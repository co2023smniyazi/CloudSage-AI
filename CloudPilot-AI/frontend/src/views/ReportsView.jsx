import React from 'react';
import {
  FileBarChart,
  Printer,
  Download,
  FileText,
  ShieldAlert,
  Terminal,
  CheckCircle,
  HelpCircle,
  Layers,
  Cpu
} from 'lucide-react';
import { getExportCsvUrl, getExportMarkdownUrl } from '../api';

export default function ReportsView({ analysis }) {
  if (!analysis) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        No report available. Run an analysis first.
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const counts = analysis.level_counts || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Action Bar (hidden when printing) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileBarChart className="w-4 h-4 text-teal-600" />
            Executive Report & Export Center
          </h2>
          <p className="text-xs text-slate-500">Download formatted deliverables for management and compliance audits.</p>
        </div>

        <div className="flex items-center gap-2">
          {analysis.id && (
            <>
              <a
                href={getExportCsvUrl(analysis.id)}
                download={`cloudpilot-patterns-${analysis.id}.csv`}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>Download CSV</span>
              </a>

              <a
                href={getExportMarkdownUrl(analysis.id)}
                download={`cloudpilot-report-${analysis.id}.md`}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Markdown</span>
              </a>
            </>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Document Sheet */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm space-y-8 font-sans print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">CloudPilot AI</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 rounded">
                Autonomous Diagnostics
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Infrastructure Operations Assessment Report</h1>
            <p className="text-xs text-slate-500 mt-1">
              Generated on {new Date(analysis.created_at || Date.now()).toUTCString()}
            </p>
          </div>

          <div className="text-right">
            <div className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
              analysis.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
              analysis.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
              analysis.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
              'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}>
              {analysis.risk_level} RISK ({analysis.risk_score}/100)
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">ID: REF-{analysis.id || 'LIVE'}</p>
          </div>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] font-semibold uppercase">Analyzed Dataset</span>
            <p className="font-mono font-bold text-slate-800 truncate mt-0.5">{analysis.filename}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-semibold uppercase">Total Events</span>
            <p className="font-mono font-bold text-slate-800 mt-0.5">{analysis.total_lines} lines</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-semibold uppercase">Critical & Errors</span>
            <p className="font-mono font-bold text-rose-600 mt-0.5">{counts.CRITICAL || 0} Crit / {counts.ERROR || 0} Err</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-semibold uppercase">Engine Mode</span>
            <p className="font-bold text-teal-700 mt-0.5 truncate">{analysis.explanation_mode}</p>
          </div>
        </div>

        {/* 1. Executive Summary */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
            1. Executive Operational Summary
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed font-normal">
            {analysis.summary}
          </p>
        </div>

        {/* 2. Technical Root Cause & Blast Radius */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              2. Technical Root Cause
            </h2>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs font-mono text-rose-800 leading-relaxed">
              {analysis.root_cause}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              3. Operational & Business Impact
            </h2>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
              {analysis.impact_assessment}
            </div>
          </div>
        </div>

        {/* 4. Confirmed Observations vs. Heuristic Hypotheses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-600 border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              Confirmed Observations (Concrete Log Evidence)
            </h2>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {(analysis.confirmed_observations || []).map((obs, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              Heuristic Hypotheses (Inferred Diagnostics)
            </h2>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {(analysis.heuristic_hypotheses || []).map((hyp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{hyp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 5. Risk Contributors Breakdown */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
            5. Explainable Risk Factors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {(analysis.risk_factors || []).map((f, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-center font-bold text-slate-800 mb-1">
                  <span>{f.factor}</span>
                  <span className="text-teal-700 font-mono">+{f.score_impact} / {f.weight} pts</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{f.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Actionable Troubleshooting Steps */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
            6. Ordered Remediation Procedures
          </h2>
          <div className="space-y-2">
            {(analysis.recommendations || []).map((r, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                <div className="font-bold text-slate-800">
                  {r.step_number || idx + 1}. {r.title}
                </div>
                <div className="my-1.5 p-2 bg-slate-900 text-teal-300 rounded font-mono text-[11px] overflow-x-auto">
                  {r.command_or_action}
                </div>
                <div className="text-[11px] text-slate-500">{r.rationale}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Footer */}
        <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
          CloudPilot AI Autonomous Cloud Operations Diagnostics Suite • Confidential & Proprietary
        </div>
      </div>
    </div>
  );
}

