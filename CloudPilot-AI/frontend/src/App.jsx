import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewView from './views/OverviewView';
import LogAnalyzerView from './views/LogAnalyzerView';
import RiskAssessmentView from './views/RiskAssessmentView';
import IncidentsView from './views/IncidentsView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';

import {
  fetchHealth,
  fetchSamples,
  loadSample,
  analyzeLogs,
  fetchIncidents,
  updateIncident,
  fetchLatestReport,
  fetchSettings,
  updateSettings,
  resetDatabase,
  deleteIncident
} from './api';

export default function App() {
  const [currentView, setCurrentView] = useState('overview');
  const [health, setHealth] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [samples, setSamples] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pastedLogModal, setPastedLogModal] = useState('');

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [h, s, inc, setts] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchSamples().catch(() => []),
        fetchIncidents().catch(() => []),
        fetchSettings().catch(() => null)
      ]);

      if (h) setHealth(h);
      if (s) setSamples(s);
      if (inc) setIncidents(inc);
      if (setts) setSettings(setts);

      // Fetch latest analysis
      try {
        const latest = await fetchLatestReport();
        if (latest) setAnalysis(latest);
      } catch (e) {
        // If no report exists, attempt to auto-load sample k8s-crashloop
        try {
          const sampleAnalysis = await loadSample('k8s-crashloop');
          setAnalysis(sampleAnalysis);
          const updatedIncidents = await fetchIncidents();
          setIncidents(updatedIncidents);
        } catch (_) {}
      }
    } catch (err) {
      console.error('Failed to load initial data', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleAnalyze = async (file, rawText) => {
    setLoading(true);
    try {
      const res = await analyzeLogs(file, rawText);
      setAnalysis(res);
      showToast(`Successfully analyzed ${res.filename} (${res.total_lines} lines).`);

      // Refresh incidents & health
      const [updatedIncidents, updatedHealth] = await Promise.all([
        fetchIncidents().catch(() => []),
        fetchHealth().catch(() => null)
      ]);
      setIncidents(updatedIncidents);
      if (updatedHealth) setHealth(updatedHealth);

      setCurrentView('analyzer');
    } catch (err) {
      showToast(err.message || 'Log analysis failed', true);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async (sampleId) => {
    setLoading(true);
    try {
      const res = await loadSample(sampleId);
      setAnalysis(res);
      showToast(`Loaded realistic incident: ${res.filename}`);

      // Refresh incidents & health
      const [updatedIncidents, updatedHealth] = await Promise.all([
        fetchIncidents().catch(() => []),
        fetchHealth().catch(() => null)
      ]);
      setIncidents(updatedIncidents);
      if (updatedHealth) setHealth(updatedHealth);

      setCurrentView('overview');
    } catch (err) {
      showToast(err.message || 'Failed to load sample', true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIncidentStatus = async (id, payload) => {
    try {
      const updated = await updateIncident(id, payload);
      setIncidents(incidents.map(i => i.id === id ? updated : i));
      showToast(`Incident ${updated.incident_code} updated.`);

      // Update health count
      const updatedHealth = await fetchHealth().catch(() => null);
      if (updatedHealth) setHealth(updatedHealth);
    } catch (err) {
      showToast(err.message || 'Failed to update incident', true);
    }
  };

  const handleDeleteIncident = async (id) => {
    try {
      await deleteIncident(id);
      setIncidents(incidents.filter(i => i.id !== id));
      showToast('Incident deleted successfully.');
      const updatedHealth = await fetchHealth().catch(() => null);
      if (updatedHealth) setHealth(updatedHealth);
    } catch (err) {
      showToast(err.message || 'Failed to delete incident', true);
    }
  };

  const handleSaveSettings = async (payload) => {
    setLoading(true);
    try {
      const updated = await updateSettings(payload);
      setSettings(updated);
      showToast('Configuration settings updated.');
    } catch (err) {
      showToast(err.message || 'Failed to save settings', true);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDb = async () => {
    setLoading(true);
    try {
      await resetDatabase();
      setIncidents([]);
      setAnalysis(null);
      showToast('Database cleared successfully.');
      const [updatedHealth, updatedSettings] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchSettings().catch(() => null)
      ]);
      if (updatedHealth) setHealth(updatedHealth);
      if (updatedSettings) setSettings(updatedSettings);
    } catch (err) {
      showToast('Failed to reset database', true);
    } finally {
      setLoading(false);
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'overview':
        return { title: 'Cloud Operations Overview', subtitle: 'Live infrastructure telemetry & failure risk metrics' };
      case 'analyzer':
        return { title: 'Log Analyzer & Pattern Clustering', subtitle: 'Parse system streams, extract errors, and normalize signatures' };
      case 'risk':
        return { title: 'Infrastructure Risk Assessment', subtitle: 'Multi-factor explainable heuristic probability scoring' };
      case 'incidents':
        return { title: 'Operational Incident Registry', subtitle: 'Active failure tracking with triage status workflow' };
      case 'reports':
        return { title: 'Executive Reports & Deliverables', subtitle: 'Printable diagnostics and compliance documentation' };
      case 'settings':
        return { title: 'System & Engine Configuration', subtitle: 'AI model keys, detection sensitivity, and persistence' };
      default:
        return { title: 'CloudPilot AI', subtitle: 'Cloud Operations Assistant' };
    }
  };

  const viewMeta = getViewTitle();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Dark Navy Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        health={health}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          title={viewMeta.title}
          subtitle={viewMeta.subtitle}
          activeDataset={analysis}
          onRefresh={loadInitialData}
          onOpenUpload={() => setShowUploadModal(true)}
          loading={loading}
        />

        {/* Toast Alerts */}
        <div className="fixed top-4 right-8 z-50 space-y-2 pointer-events-none">
          {errorMsg && (
            <div className="bg-rose-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-rose-700 animate-slide-in pointer-events-auto flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-emerald-700 animate-slide-in pointer-events-auto flex items-center gap-2">
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {currentView === 'overview' && (
            <OverviewView
              analysis={analysis}
              incidents={incidents}
              samples={samples}
              onLoadSample={handleLoadSample}
              onNavigate={(v) => setCurrentView(v)}
              loading={loading}
            />
          )}

          {currentView === 'analyzer' && (
            <LogAnalyzerView
              analysis={analysis}
              onAnalyze={handleAnalyze}
              loading={loading}
            />
          )}

          {currentView === 'risk' && (
            <RiskAssessmentView
              analysis={analysis}
            />
          )}

          {currentView === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              onUpdateStatus={handleUpdateIncidentStatus}
              onDeleteIncident={handleDeleteIncident}
              loading={loading}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              analysis={analysis}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetDb={handleResetDb}
              loading={loading}
            />
          )}
        </main>
      </div>

      {/* Global Quick Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Upload Log File for Analysis</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-6 border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-xl text-center bg-slate-50/50">
                <input
                  type="file"
                  id="modal-file-input"
                  accept=".log,.txt,.json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      handleAnalyze(f, null);
                      setShowUploadModal(false);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="modal-file-input"
                  className="inline-block px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-colors"
                >
                  Choose File (.log, .txt, .json)
                </label>
                <p className="text-[11px] text-slate-400 mt-2">Maximum file size: 25MB</p>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-1">Or paste raw log text:</span>
                <textarea
                  rows={4}
                  placeholder="Paste log entries directly here..."
                  value={pastedLogModal}
                  onChange={(e) => setPastedLogModal(e.target.value)}
                  className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pastedLogModal.trim()) {
                    handleAnalyze(null, pastedLogModal);
                    setPastedLogModal('');
                    setShowUploadModal(false);
                  }
                }}
                disabled={!pastedLogModal.trim()}
                className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:opacity-50"
              >
                Analyze Pasted Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
