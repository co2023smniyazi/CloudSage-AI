import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Terminal,
  Copy,
  Check,
  Calculator,
  Flame,
  Activity,
  Layers
} from 'lucide-react';
import RiskMeter from '../components/RiskMeter';

export default function RiskAssessmentView({ analysis }) {
  const [copiedStep, setCopiedStep] = useState(null);

  const copyCommand = (cmd, idx) => {
    navigator.clipboard.writeText(cmd);
    setCopiedStep(idx);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const score = analysis?.risk_score || 0;
  const level = analysis?.risk_level || 'LOW';
  const factors = analysis?.risk_factors || [];
  const recommendations = analysis?.recommendations || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner Card: Risk Overview */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              Heuristic Risk Model v1.0
            </span>
            <span className="text-xs text-slate-400 font-mono">Dataset: {analysis?.filename || 'No data'}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Infrastructure Failure Risk Analysis</h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            CloudPilot AI scores infrastructure failure probability using a deterministic multi-factor model. It evaluates critical event burst ratios, error velocity, affected service blast radius, and catastrophic container/database signatures.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex-shrink-0">
          <RiskMeter score={score} level={level} size="large" />
        </div>
      </div>

      {/* Transparent Factor Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Calculator className="w-4 h-4 text-teal-600" />
              Explainable Factor Breakdown (100-Point Model)
            </h3>
            <p className="text-xs text-slate-500">Every point added to the risk score is directly traceable to concrete log evidence.</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
            Total Score: {score}/100
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {factors.map((f, idx) => {
            const percentage = Math.min(100, (f.score_impact / f.weight) * 100);
            return (
              <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-800">{f.factor}</span>
                    <span className="text-xs font-bold font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      +{f.score_impact} / {f.weight} pts
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        f.score_impact > 25 ? 'bg-rose-500' :
                        f.score_impact > 15 ? 'bg-orange-500' :
                        f.score_impact > 0 ? 'bg-amber-400' : 'bg-slate-300'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-sans">{f.explanation}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Factor Weight: {f.weight}%</span>
                  <span>Impact Ratio: {Math.round(percentage)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preventive Remediation Checklist */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Terminal className="w-4 h-4 text-teal-600" />
              Prioritized Preventive Actions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Execute these diagnostic and mitigation procedures to lower risk exposure.</p>
          </div>
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-teal-50 text-teal-700">
            {recommendations.length} Steps
          </span>
        </div>

        <div className="space-y-4">
          {recommendations.map((step, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step.step_number || idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-xs text-slate-800">{step.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{step.rationale}</p>

                    {step.command_or_action && (
                      <div className="mt-2.5 relative group">
                        <div className="p-2.5 bg-slate-900 text-teal-300 font-mono text-xs rounded-lg overflow-x-auto pr-10">
                          {step.command_or_action}
                        </div>
                        <button
                          onClick={() => copyCommand(step.command_or_action, idx)}
                          className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
                          title="Copy command"
                        >
                          {copiedStep === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

