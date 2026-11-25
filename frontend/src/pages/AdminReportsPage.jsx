import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Download, 
  Filter, 
  Calendar, 
  Train, 
  FileText, 
  RotateCcw,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { analyticsService, trainService } from '../services/api';

const AdminReportsPage = () => {
  const [records, setRecords] = useState([]);
  const [trains, setTrains] = useState([]);
  const [selectedTrain, setSelectedTrain] = useState('');
  const [minDelay, setMinDelay] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedTrain) params.trainNumber = selectedTrain;
      if (minDelay) params.minDelay = minDelay;

      const [recordsRes, trainsRes] = await Promise.all([
        analyticsService.getHistoricalRecords(params),
        trainService.getAllTrains()
      ]);

      if (recordsRes.data?.success) setRecords(recordsRes.data.data);
      if (trainsRes.data?.success) setTrains(trainsRes.data.data);
    } catch (err) {
      console.warn('[AdminReports] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedTrain, minDelay]);

  const handleExportCSV = () => {
    if (records.length === 0) return;

    const headers = ['Date', 'Train Number', 'Station', 'Scheduled Arrival', 'Actual Arrival', 'Delay (Mins)', 'Weather', 'Congestion'];
    const rows = records.map(r => [
      r.date,
      r.trainNumber,
      `"${r.stationName} (${r.stationCode})"`,
      r.scheduledArrival,
      r.actualArrival,
      r.delayDurationMinutes,
      r.weatherCondition,
      r.trackCongestion
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RTTPS_Railway_Delay_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-sky-600" />
            Historical Train Running Performance & Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical timetable audits, delay logs, operational analysis, and CSV export.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={records.length === 0}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Train:</span>
          <select
            value={selectedTrain}
            onChange={(e) => setSelectedTrain(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Fleet Trains</option>
            {trains.map(t => (
              <option key={t.trainNumber} value={t.trainNumber}>
                #{t.trainNumber} - {t.trainName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Min Delay:</span>
          <select
            value={minDelay}
            onChange={(e) => setMinDelay(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Any Delay (0+ mins)</option>
            <option value="5">Delays &gt;= 5 mins</option>
            <option value="15">Delays &gt;= 15 mins</option>
            <option value="30">Severe Delays &gt;= 30 mins</option>
          </select>
        </div>

        <button
          onClick={() => { setSelectedTrain(''); setMinDelay(''); }}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold flex items-center gap-1 transition-colors ml-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Train</th>
                <th className="px-4 py-3.5">Station</th>
                <th className="px-4 py-3.5">Scheduled</th>
                <th className="px-4 py-3.5">Actual Arrival</th>
                <th className="px-4 py-3.5">Delay (Mins)</th>
                <th className="px-4 py-3.5">Weather</th>
                <th className="px-4 py-3.5">Congestion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading historical records...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">No records match the current filters.</td>
                </tr>
              ) : (
                records.map((r, i) => (
                  <tr key={r._id || i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {r.date}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[11px]">
                        #{r.trainNumber}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {r.stationName} <span className="font-mono text-slate-400 text-[10px]">({r.stationCode})</span>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-600">
                      {r.scheduledArrival}
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      {r.actualArrival}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${
                        r.delayDurationMinutes > 15 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                          : (r.delayDurationMinutes > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                      }`}>
                        {r.delayDurationMinutes > 0 ? `+${r.delayDurationMinutes}m` : 'On Time'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {r.weatherCondition || 'Clear'}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {r.trackCongestion || 'Low'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminReportsPage;
