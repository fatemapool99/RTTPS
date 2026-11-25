import React from 'react';
import { Gauge, Navigation, CloudRain, ShieldCheck, AlertTriangle } from 'lucide-react';

const Speedometer = ({ 
  speed = 0, 
  maxSpeed = 160, 
  distanceRemainingKm = 0, 
  weather = 'Clear', 
  congestion = 'Low' 
}) => {
  const percentage = Math.min(100, Math.round((speed / maxSpeed) * 100));

  let congestionColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (congestion === 'High' || congestion === 'Peak Congestion') {
    congestionColor = 'text-rose-600 bg-rose-50 border-rose-200';
  } else if (congestion === 'Medium') {
    congestionColor = 'text-amber-600 bg-amber-50 border-amber-200';
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Gauge className="w-4 h-4 text-sky-600" />
          Locomotive Telemetry HUD
        </h4>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
          GPS TELEMETRY
        </span>
      </div>

      {/* Speedometer Gauge Visual */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
              {Math.round(speed)}
            </span>
            <span className="text-sm font-semibold text-slate-500">km/h</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Current Track Speed</span>
        </div>

        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-2xl font-bold text-slate-800 tracking-tight font-mono">
              {distanceRemainingKm}
            </span>
            <span className="text-xs font-semibold text-slate-500">km</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Distance Remaining</span>
        </div>
      </div>

      {/* Speed Progress Bar */}
      <div className="space-y-1">
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-700"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0 km/h</span>
          <span>80 km/h (Avg)</span>
          <span>{maxSpeed} km/h (Max)</span>
        </div>
      </div>

      {/* Environmental Conditions Pills */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-sky-600" />
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Weather</span>
            <span className="font-semibold text-slate-700">{weather}</span>
          </div>
        </div>

        <div className={`p-2 rounded-xl border flex items-center gap-2 ${congestionColor}`}>
          <AlertTriangle className="w-4 h-4" />
          <div>
            <span className="text-[10px] text-slate-500 block font-medium">Congestion</span>
            <span className="font-semibold">{congestion}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Speedometer;
