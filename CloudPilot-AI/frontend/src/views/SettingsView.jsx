import React, { useState } from 'react';
import {
  Settings,
  Key,
  Sliders,
  Database,
  Trash2,
  Check,
  AlertTriangle,
  Info,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export default function SettingsView({
  settings,
  onSaveSettings,
  onResetDb,
  loading
}) {
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [provider, setProvider] = useState(settings?.ai_provider || 'auto');
  const [sensitivity, setSensitivity] = useState(settings?.risk_sensitivity || 'normal');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      ai_provider: provider,
      risk_sensitivity: sensitivity,
    };
    if (geminiKey.trim()) payload.gemini_api_key = geminiKey.trim();
    if (openaiKey.trim()) payload.openai_api_key = openaiKey.trim();

    onSaveSettings(payload);
    setSavedSuccess(true);
    setGeminiKey('');
    setOpenaiKey('');
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetConfirm = () => {
    onResetDb();
    setConfirmReset(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-teal-600" />
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">System & Engine Settings</h2>
        </div>
        <p className="text-xs text-slate-500">
          Configure AI reasoning credentials, heuristics sensitivity thresholds, and SQLite telemetry persistence.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* AI Provider & API Keys */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                <Key className="w-4 h-4 text-teal-600" />
                AI Inference Provider
              </h3>
              <p className="text-xs text-slate-500">Optional credentials. If omitted, CloudPilot operates in high-precision Rule-Based Heuristic mode.</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700">
              Dual-Engine
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Active Reasoning Engine</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="auto">Auto (AI provider if configured, else Heuristic Expert Engine)</option>
                <option value="gemini">Google Gemini 1.5 Flash</option>
                <option value="openai">OpenAI GPT-4o-mini</option>
                <option value="heuristic">Heuristic Expert Engine Only (Strict Offline Mode)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gemini Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Google Gemini API Key</label>
                  {settings?.gemini_configured && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Configured
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder={settings?.gemini_configured ? "•••••••••••••••• (leave blank to keep)" : "Enter AIzaSy..."}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* OpenAI Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">OpenAI API Key</label>
                  {settings?.openai_configured && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Configured
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder={settings?.openai_configured ? "•••••••••••••••• (leave blank to keep)" : "Enter sk-..."}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Risk Sensitivity Settings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              Risk Calculation Sensitivity
            </h3>
            <p className="text-xs text-slate-500">Tunes the heuristic mathematical scoring weight applied to error frequency bursts.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'conservative', name: 'Conservative (1.2x)', desc: 'High alert sensitivity. Best for production mission-critical services.' },
              { id: 'normal', name: 'Standard (1.0x)', desc: 'Balanced thresholds recommended for general container workloads.' },
              { id: 'relaxed', name: 'Relaxed (0.8x)', desc: 'Reduced alert fatigue. Best for staging or noisy dev clusters.' }
            ].map((opt) => (
              <label
                key={opt.id}
                onClick={() => setSensitivity(opt.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  sensitivity === opt.id
                    ? 'border-teal-500 bg-teal-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{opt.name}</span>
                    <input
                      type="radio"
                      name="sensitivity"
                      checked={sensitivity === opt.id}
                      onChange={() => setSensitivity(opt.id)}
                      className="text-teal-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 animate-fade-in">
              <Check className="w-4 h-4" /> Preferences updated successfully!
            </span>
          ) : <span />}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      {/* Database Management & Data Hygiene */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" />
              Telemetry Storage & Database Hygiene
            </h3>
            <p className="text-xs text-slate-500">Persistent SQLite storage state.</p>
          </div>
          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            cloudpilot.db
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <div className="space-y-1">
            <p className="text-slate-700 font-medium">
              Recorded Records: <strong className="font-mono text-slate-900">{settings?.total_analyses || 0}</strong> analyses, <strong className="font-mono text-slate-900">{settings?.total_incidents || 0}</strong> incidents.
            </p>
            <p className="text-slate-500 text-[11px]">Clear historical incident logs and analysis records before new tests or college demos.</p>
          </div>

          {confirmReset ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
              >
                Confirm Reset
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Historical Data</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

