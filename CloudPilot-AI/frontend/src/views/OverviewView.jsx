import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  Play,
  CheckCircle2,
  Clock,
  ExternalLink,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import RiskMeter from '../components/RiskMeter';

export default function OverviewView({
  analysis,
  incidents,
  samples,
  onLoadSample,
  onNavigate,
  loading
}) {
  const counts = analysis?.level_counts || { CRITICAL: 0, ERROR: 0, WARNING: 0, INFO: 0 };
  const totalEvents = analysis?.total_lines || 0;

  const pieData = [
    { name: 'Critical', value: counts.CRITICAL || 0, color: '#f43f5e' },
    { name: 'Error', value: counts.ERROR || 0, color: '#f97316' },
    { name: 'Warning', value: counts.WARNING || 0, color: '#eab308' },
    { name: 'Info', value: counts.INFO || 0, color: '#38bdf8' }
  ].filter(d => d.value > 0);

  // Group top 5 patterns for bar chart
  const barData = (analysis?.patterns || []).slice(0, 5).map(p => ({
    name: p.service.length > 10 ? p.service.slice(0, 10) + '..' : p.service,
    count: p.count,
    level: p.level
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Analyzed Events</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800 font-mono">{totalEvents.toLocaleString()}</span>
            <span className="text-xs text-slate-400">lines</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 truncate">File: {analysis?.filename || 'No data'}</p>
        </div>

        {/* Critical Faults */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical Faults</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-600 font-mono">{counts.CRITICAL}</span>
            <span className="text-xs text-slate-400">panics/crashes</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Requires immediate SRE intervention</p>
        </div>

        {/* Application Errors */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-orange-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Error Occurrences</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-orange-600 font-mono">{counts.ERROR}</span>
            <span className="text-xs text-slate-400">failures</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{counts.WARNING} warnings logged</p>
        </div>

        {/* Active Incidents */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-teal-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Incidents</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-teal-700 font-mono">
              {incidents.filter(i => i.status !== 'Resolved').length}
            </span>
            <span className="text-xs text-slate-400">unresolved</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Persistent SQLite registry</p>
        </div>
      </div>

      {/* Main Grid: Risk Gauge & AI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Meter Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-teal-600" />
                Infrastructure Failure Risk
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Heuristic Model</span>
            </div>
            <div className="py-3 flex justify-center">
              <RiskMeter
                score={analysis?.risk_score || 0}
                level={analysis?.risk_level || 'LOW'}
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Confidence Score: <strong className="text-slate-700">{analysis?.confidence_score || 90}%</strong></span>
            <button
              onClick={() => onNavigate('risk')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
            >
              View Factor Breakdown <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* AI & Heuristic Explanation Summary */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <h2 className="font-bold text-slate-800 text-sm tracking-tight">Executive Operational Diagnosis</h2>
              </div>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-teal-50 text-teal-700 border border-teal-200">
                {analysis?.explanation_mode || 'Rule-Based Heuristic'}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Executive Summary</p>
                <p className="text-sm text-slate-700 leading-relaxed font-normal bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {analysis?.summary || 'No log analysis performed yet. Select a sample log below or upload your own.'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Root Cause Hypothesis</p>
                <p className="text-xs text-rose-700 font-mono bg-rose-50/80 p-2.5 rounded-lg border border-rose-100">
                  {analysis?.root_cause || 'Awaiting telemetry input.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Impact: {analysis?.impact_assessment?.slice(0, 80) || 'Normal SLO'}...</span>
            <button
              onClick={() => onNavigate('analyzer')}
              className="font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
            >
              Deep Inspection <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution Donut */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="font-bold text-slate-800 text-sm tracking-tight mb-4 pb-2 border-b border-slate-100">
            Log Severity Distribution
          </h2>
          {pieData.length > 0 ? (
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 pr-6">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-600 font-medium w-16">{d.name}</span>
                    <span className="font-mono text-slate-800 font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              No severity distribution data available
            </div>
          )}
        </div>

        {/* Top Failing Services Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="font-bold text-slate-800 text-sm tracking-tight mb-4 pb-2 border-b border-slate-100">
            Error Frequency by Component
          </h2>
          {barData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              Zero recurring error patterns recorded
            </div>
          )}
        </div>
      </div>

      {/* 1-Click Realistic Cloud Failure Scenarios */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-600" />
              1-Click Realistic Cloud Failure Scenarios
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Test CloudPilot AI with realistic enterprise infrastructure incidents.</p>
          </div>
          <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-2 py-1 rounded">Interactive Demo</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {samples.map((sample) => (
            <div
              key={sample.id}
              className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-teal-500/50 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{sample.category}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    sample.expected_severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                    sample.expected_severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {sample.expected_severity}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-xs tracking-tight mb-1">{sample.name}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">{sample.description}</p>
              </div>

              <button
                onClick={() => onLoadSample(sample.id)}
                disabled={loading}
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-teal-600 text-slate-700 hover:text-white border border-slate-200 hover:border-teal-600 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Simulate Failure</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            Recent Operational Incidents
          </h2>
          <button
            onClick={() => onNavigate('incidents')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
          >
            All Incidents ({incidents.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {incidents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Detected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {incidents.slice(0, 5).map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-700">{inc.incident_code}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{inc.title}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inc.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        inc.severity === 'HIGH' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                        'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{inc.service}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inc.status === 'Open' ? 'bg-rose-50 text-rose-600' :
                        inc.status === 'Investigating' ? 'bg-amber-50 text-amber-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">
                      {new Date(inc.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No incidents logged yet.
          </div>
        )}
      </div>
    </div>
  );
}

