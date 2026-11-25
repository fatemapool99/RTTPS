import React from 'react';
import { CheckCircle2, Clock, MapPin, ArrowRight } from 'lucide-react';

const StationTimeline = ({ schedules = [], nextStationCode = '', delayMinutes = 0 }) => {
  if (!schedules || schedules.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-500 text-sm">
        Timetable schedule details loading or unavailable.
      </div>
    );
  }

  // Find index of current next station
  const nextIndex = schedules.findIndex(s => s.stationCode === nextStationCode);
  const activeIdx = nextIndex !== -1 ? nextIndex : 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-sky-600" />
          Route Timetable & Platform Directory
        </h4>
        <span className="text-xs text-slate-400 font-medium">
          {schedules.length} Stops Total
        </span>
      </div>

      <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 py-2">
        {schedules.map((stop, idx) => {
          const isPassed = idx < activeIdx;
          const isNext = idx === activeIdx;
          const isUpcoming = idx > activeIdx;

          return (
            <div key={stop._id || idx} className="relative pl-6">
              {/* Stepper Dot */}
              <div 
                className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                  isPassed 
                    ? 'bg-emerald-500 border-white text-white' 
                    : isNext 
                    ? 'bg-sky-600 border-white ring-4 ring-sky-100 animate-pulse' 
                    : 'bg-white border-slate-300'
                }`}
              >
                {isPassed && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
              </div>

              {/* Station Stop Content */}
              <div className={`p-3 rounded-xl border transition-all ${
                isNext 
                  ? 'bg-sky-50/70 border-sky-200 shadow-sm' 
                  : 'bg-slate-50/50 border-slate-100'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">
                      {stop.stationName}
                    </span>
                    <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      {stop.stationCode}
                    </span>
                  </div>

                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-white font-mono shadow-sm">
                    PF #{stop.platformNumber || 1}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200/60 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-sans">SCHEDULED</span>
                    <span className="font-semibold text-slate-700">
                      Arr: {stop.scheduledArrival} | Dep: {stop.scheduledDeparture}
                    </span>
                  </div>

                  {isNext && (
                    <div className="text-right">
                      <span className="text-sky-600 font-bold text-[10px] block font-sans uppercase">
                        NEXT ARRIVAL
                      </span>
                      <span className="font-bold text-sky-700">
                        {delayMinutes > 0 ? `+${delayMinutes}m delay` : 'On Schedule'}
                      </span>
                    </div>
                  )}

                  {isPassed && (
                    <span className="text-emerald-600 font-semibold text-[11px] font-sans flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Departed
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StationTimeline;
