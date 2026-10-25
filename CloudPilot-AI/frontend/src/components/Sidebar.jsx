import React from 'react';
import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  AlertOctagon,
  FileBarChart,
  Settings,
  Activity,
  Terminal,
  Cpu
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, health }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analyzer', label: 'Log Analyzer', icon: FileText },
    { id: 'risk', label: 'Risk Assessment', icon: ShieldAlert },
    { id: 'incidents', label: 'Incidents', icon: AlertOctagon, badge: health?.active_incidents_count },
    { id: 'reports', label: 'Reports & Export', icon: FileBarChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-navy-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0 text-slate-300">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80 bg-navy-900/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-softblue-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20">
            <Cpu className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-lg">CloudPilot</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded">AI</span>
            </div>
            <p className="text-[11px] text-slate-400">Cloud Operations Assistant</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-3 py-6 space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Main Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            Core Engine
          </span>
          <span className="font-mono text-slate-400">{health?.version || 'v1.0.0'}</span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center justify-between">
          <span>AI Diagnostics</span>
          <span className="text-teal-400 font-medium">Active</span>
        </div>
      </div>
    </aside>
  );
}

