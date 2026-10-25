import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle } from 'lucide-react';

export default function RiskMeter({ score = 0, level = 'LOW', size = 'normal' }) {
  const getColors = () => {
    if (score >= 75 || level === 'CRITICAL') {
      return {
        stroke: '#f43f5e',
        text: 'text-rose-600',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        badge: 'bg-rose-100 text-rose-700 border-rose-200',
        icon: AlertCircle,
        label: 'Critical Risk'
      };
    }
    if (score >= 50 || level === 'HIGH') {
      return {
        stroke: '#f97316',
        text: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        badge: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: ShieldAlert,
        label: 'High Risk'
      };
    }
    if (score >= 25 || level === 'MEDIUM') {
      return {
        stroke: '#eab308',
        text: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: AlertTriangle,
        label: 'Medium Risk'
      };
    }
    return {
      stroke: '#10b981',
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: ShieldCheck,
      label: 'Low Risk'
    };
  };

  const style = getColors();
  const Icon = style.icon;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex items-center justify-center">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="#e2e8f0"
            strokeWidth="7"
            fill="transparent"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={style.stroke}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-black ${style.text} tracking-tight`}>{score}</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Score</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-4 h-4 ${style.text}`} />
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${style.badge}`}>
            {level}
          </span>
        </div>
        <p className="text-xs text-slate-600 max-w-[180px]">
          {score >= 75
            ? 'Severe infrastructure disruption risk. Action required.'
            : score >= 50
            ? 'Elevated failure frequency observed across services.'
            : score >= 25
            ? 'Minor warnings detected. Telemetry monitoring recommended.'
            : 'Nominal operational status. Zero critical hazards.'}
        </p>
      </div>
    </div>
  );
}

