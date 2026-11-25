import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  Bell, 
  Train, 
  X,
  Sparkles
} from 'lucide-react';
import { trainService, scheduleService } from '../services/api';

const AdminScheduleManagement = () => {
  const [trains, setTrains] = useState([]);
  const [selectedTrainNo, setSelectedTrainNo] = useState('12951');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Platform Edit State
  const [editingStop, setEditingStop] = useState(null);
  const [newPlatform, setNewPlatform] = useState(1);

  // Override Timing Modal State
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [overrideData, setOverrideData] = useState({
    stationCode: '',
    stationName: '',
    overrideArrival: '',
    overrideDelayMinutes: 15,
    reason: 'Operational Junction Clearance Priority'
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const res = await trainService.getAllTrains();
        if (res.data?.success) {
          setTrains(res.data.data);
        }
      } catch (err) {
        console.warn('[AdminSchedules] Fleet error:', err.message);
      }
    };
    fetchFleet();
  }, []);

  const fetchSchedule = async (trainNo) => {
    setLoading(true);
    try {
      const res = await scheduleService.getTrainSchedule(trainNo);
      if (res.data?.success) {
        setSchedules(res.data.data);
      }
    } catch (err) {
      console.warn('[AdminSchedules] Schedule error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTrainNo) {
      fetchSchedule(selectedTrainNo);
    }
  }, [selectedTrainNo]);

  const handleUpdatePlatform = async (stopId) => {
    try {
      const res = await scheduleService.updatePlatform(stopId, {
        platformNumber: Number(newPlatform),
        notifyPassengers: true
      });
      if (res.data?.success) {
        setMessage({ type: 'success', text: `Platform updated to #${newPlatform} and passenger notification sent.` });
        setEditingStop(null);
        fetchSchedule(selectedTrainNo);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update platform.' });
    }
  };

  const handleOpenOverride = (stop) => {
    setOverrideData({
      stationCode: stop.stationCode,
      stationName: stop.stationName,
      overrideArrival: stop.scheduledArrival,
      overrideDelayMinutes: 15,
      reason: 'Signal Regulation & Track Clearance Priority'
    });
    setIsOverrideOpen(true);
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await scheduleService.overrideEta({
        trainNumber: selectedTrainNo,
        stationCode: overrideData.stationCode,
        overrideArrival: overrideData.overrideArrival,
        overrideDelayMinutes: overrideData.overrideDelayMinutes,
        reason: overrideData.reason
      });
      if (res.data?.success) {
        setMessage({ type: 'success', text: `Administrative Timing Override applied for ${overrideData.stationName}!` });
        setIsOverrideOpen(false);
        fetchSchedule(selectedTrainNo);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Override failed.' });
    }
  };

  const currentTrainObj = trains.find(t => t.trainNumber === selectedTrainNo);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-sky-600" />
            Timetable Schedules & Administrative Overrides
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reassign platforms and execute administrative ETA overrides with automatic passenger alerts.
          </p>
        </div>

        {/* Train Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Select Train:</span>
          <select
            value={selectedTrainNo}
            onChange={(e) => setSelectedTrainNo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {trains.map(t => (
              <option key={t.trainNumber} value={t.trainNumber}>
                #{t.trainNumber} - {t.trainName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alert Notification */}
      {message.text && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Train Info Banner */}
      {currentTrainObj && (
        <div className="bg-sky-50 rounded-2xl p-4 border border-sky-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-sky-600 text-white shadow-sm">
              #{currentTrainObj.trainNumber}
            </span>
            <div>
              <span className="font-bold text-slate-900 text-sm block">
                {currentTrainObj.trainName}
              </span>
              <span className="text-slate-500 font-medium">
                Route: {currentTrainObj.sourceStation} &rarr; {currentTrainObj.destStation} ({currentTrainObj.totalDistanceKm} km)
              </span>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-white text-sky-700 font-semibold border border-sky-300 font-mono">
            {schedules.length} Station Stops
          </span>
        </div>
      )}

      {/* Schedule Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5">Stop #</th>
                <th className="px-4 py-3.5">Station Name & Code</th>
                <th className="px-4 py-3.5">Distance</th>
                <th className="px-4 py-3.5">Scheduled Arr / Dep</th>
                <th className="px-4 py-3.5">Platform Number</th>
                <th className="px-4 py-3.5 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading timetable...</td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No station stops defined for this train.</td>
                </tr>
              ) : (
                schedules.map((stop) => (
                  <tr key={stop._id || stop.stopSequence} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-500">
                      {stop.stopSequence}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{stop.stationName}</span>
                      <span className="font-mono text-[10px] text-sky-600 font-semibold">
                        {stop.stationCode}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-600">
                      {stop.distanceFromSourceKm} km
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <span className="font-semibold text-slate-800">Arr: {stop.scheduledArrival}</span>
                      <span className="text-slate-400 mx-1">|</span>
                      <span className="font-semibold text-slate-800">Dep: {stop.scheduledDeparture}</span>
                    </td>

                    <td className="px-4 py-3">
                      {editingStop === stop._id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={newPlatform}
                            onChange={(e) => setNewPlatform(e.target.value)}
                            className="w-16 px-2 py-1 rounded border border-slate-300 text-xs font-mono font-bold"
                          />
                          <button
                            onClick={() => handleUpdatePlatform(stop._id)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingStop(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded bg-slate-800 text-white font-mono font-bold text-[11px]">
                            Platform #{stop.platformNumber || 1}
                          </span>
                          <button
                            onClick={() => { setEditingStop(stop._id); setNewPlatform(stop.platformNumber || 1); }}
                            className="text-slate-400 hover:text-sky-600"
                            title="Reassign platform"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenOverride(stop)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-semibold text-xs flex items-center gap-1 transition-colors ml-auto"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Override Timing</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Timing Modal */}
      {isOverrideOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-base">
                  Override Train Timing
                </h3>
              </div>
              <button
                onClick={() => setIsOverrideOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Manually intervene to adjust predicted arrival time and delay duration for <b>{overrideData.stationName}</b>.
              This will update passenger tracking views and broadcast an administrative alert.
            </p>

            <form onSubmit={handleOverrideSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Override Arrival Time</label>
                  <input
                    type="text"
                    required
                    value={overrideData.overrideArrival}
                    onChange={(e) => setOverrideData({ ...overrideData, overrideArrival: e.target.value })}
                    placeholder="e.g. 22:45"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Estimated Delay (mins)</label>
                  <input
                    type="number"
                    min={0}
                    max={360}
                    required
                    value={overrideData.overrideDelayMinutes}
                    onChange={(e) => setOverrideData({ ...overrideData, overrideDelayMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Official Reason for Override</label>
                <input
                  type="text"
                  required
                  value={overrideData.reason}
                  onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })}
                  placeholder="e.g. Traffic Controller Directive, Signal Inspection"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOverrideOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md shadow-amber-600/20"
                >
                  Apply Override & Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminScheduleManagement;
