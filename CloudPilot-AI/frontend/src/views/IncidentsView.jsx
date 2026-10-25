import React, { useState } from 'react';
import {
  AlertOctagon,
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
  Save,
  Terminal,
  X
} from 'lucide-react';
import { getExportIncidentsCsvUrl } from '../api';

export default function IncidentsView({
  incidents,
  onUpdateStatus,
  onDeleteIncident,
  loading
}) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentNotes, setIncidentNotes] = useState('');

  const filteredIncidents = incidents.filter(i => {
    const matchesStatus = statusFilter === 'All' || i.status === statusFilter;
    const matchesSeverity = severityFilter === 'All' || i.severity === severityFilter;
    const matchesSearch = !searchQuery ||
      i.incident_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.root_cause.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSeverity && matchesSearch;
  });

  const openDetail = (inc) => {
    setSelectedIncident(inc);
    setIncidentNotes(inc.notes || '');
  };

  const handleSaveNotes = () => {
    if (selectedIncident) {
      onUpdateStatus(selectedIncident.id, { notes: incidentNotes });
      setSelectedIncident({ ...selectedIncident, notes: incidentNotes });
    }
  };

  const handleStatusChange = (incId, newStatus) => {
    onUpdateStatus(incId, { status: newStatus });
    if (selectedIncident && selectedIncident.id === incId) {
      setSelectedIncident({ ...selectedIncident, status: newStatus });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Export */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-teal-600" />
              Incident Registry
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {incidents.length} Recorded
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Persistent SQLite tracking of operational outages, crash loops, and degraded infrastructure services.
          </p>
        </div>

        <a
          href={getExportIncidentsCsvUrl()}
          download="cloudpilot-incidents.csv"
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-teal-600" />
          <span>Export Incidents CSV</span>
        </a>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full md:w-auto">
          {['All', 'Open', 'Investigating', 'Resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Severity & Search */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="All">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <div className="relative flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search code, title, service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredIncidents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-semibold">
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Detected At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">
                      {inc.incident_code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {inc.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inc.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        inc.severity === 'HIGH' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                        inc.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {inc.service}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(inc.detected_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={inc.status}
                        onChange={(e) => handleStatusChange(inc.id, e.target.value)}
                        className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                          inc.status === 'Open' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          inc.status === 'Investigating' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <option value="Open">Open</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openDetail(inc)}
                        className="px-2.5 py-1 text-xs font-semibold text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400">
            No incidents match your current filter criteria.
          </div>
        )}
      </div>

      {/* Incident Detail Drawer / Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {selectedIncident.incident_code}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedIncident.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                    selectedIncident.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedIncident.severity}
                  </span>
                  <span className="text-xs text-slate-400">
                    Detected: {new Date(selectedIncident.detected_at).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800">{selectedIncident.title}</h3>
              </div>

              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="py-4 space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Impacted Component</h4>
                <p className="font-mono bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 inline-block font-semibold">
                  {selectedIncident.service}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Root Cause Diagnosis</h4>
                <p className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 leading-relaxed font-mono">
                  {selectedIncident.root_cause}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Recommended Remediation Action</h4>
                <div className="p-3 bg-slate-900 text-teal-300 rounded-xl font-mono">
                  {selectedIncident.recommendation}
                </div>
              </div>

              {selectedIncident.log_snippet && (
                <div>
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Triggering Telemetry Line</h4>
                  <div className="p-3 bg-slate-100 text-slate-800 rounded-xl font-mono text-[11px] break-all border border-slate-200">
                    {selectedIncident.log_snippet}
                  </div>
                </div>
              )}

              {/* Investigation Notes */}
              <div>
                <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">SRE Operator Notes</h4>
                <textarea
                  rows={3}
                  placeholder="Record mitigation notes, Jira tickets, or post-mortem action items..."
                  value={incidentNotes}
                  onChange={(e) => setIncidentNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-sans"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  onDeleteIncident(selectedIncident.id);
                  setSelectedIncident(null);
                }}
                className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Incident</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

