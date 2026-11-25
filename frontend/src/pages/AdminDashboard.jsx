import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Train, 
  Users, 
  Radio, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  AlertOctagon,
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  Zap,
  Cpu,
  BarChart2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { analyticsService, trackingService, predictionService } from '../services/api';
import LiveMap from '../components/LiveMap';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [fleet, setFleet] = useState([]);
  const [simRunning, setSimRunning] = useState(true);
  const [loading, setLoading] = useState(true);
  const [injectStatus, setInjectStatus] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartsRes, fleetRes] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getCharts(),
        trackingService.getFleetLocations()
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.stats);
      if (chartsRes.data?.success) setCharts(chartsRes.data.charts);
      if (fleetRes.data?.success) setFleet(fleetRes.data.data);
    } catch (err) {
      console.warn('[AdminDashboard] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleControlSim = async (action) => {
    try {
      const res = await trackingService.controlSimulator({ action });
      if (res.data?.success) {
        setSimRunning(res.data.isRunning);
      }
    } catch (err) {
      console.warn('[Simulator] Control error:', err.message);
    }
  };

  const handleInjectAnomaly = async (trainNumber, anomaly) => {
    try {
      setInjectStatus(`Injecting anomaly for Train ${trainNumber}...`);
      const res = await trackingService.injectAnomaly({ trainNumber, ...anomaly });
      if (res.data?.success) {
        setInjectStatus(`Success: ${anomaly.congestion ? anomaly.congestion + ' Congestion' : anomaly.weather} injected!`);
        setTimeout(() => setInjectStatus(''), 4000);
        fetchDashboardData();
      }
    } catch (err) {
      setInjectStatus('Injection failed.');
      setTimeout(() => setInjectStatus(''), 3000);
    }
  };

  const PIE_COLORS = ['#0284C7', '#F59E0B', '#10B981', '#EC4899'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200 uppercase">
              Operational Control Center
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-600" />
            Railway Administrator Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet monitoring, automated delay analytics, simulation supervisor, and operational overrides.
          </p>
        </div>

        {/* Simulator Control Quick Buttons */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 px-2 uppercase font-mono">
            Simulator:
          </span>
          <button
            onClick={() => handleControlSim('start')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              simRunning ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Play className="w-3 h-3" />
            <span>Run</span>
          </button>
          <button
            onClick={() => handleControlSim('stop')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              !simRunning ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Pause className="w-3 h-3" />
            <span>Pause</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Total Passengers</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">{stats.totalPassengers}</span>
              <Users className="w-4 h-4 text-sky-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Active Trains</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">{stats.activeTrains}</span>
              <span className="text-xs text-slate-400 font-mono">/ {stats.totalTrains}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">On-Time Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-600 font-mono">{stats.punctualityPercentage}%</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Delayed Trains</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-600 font-mono">{stats.delayedTrains}</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Cancelled</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-rose-600 font-mono">{stats.cancelledTrains}</span>
              <AlertOctagon className="w-4 h-4 text-rose-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Avg Fleet Delay</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-sky-600 font-mono">{stats.avgDelayMinutes}m</span>
              <Zap className="w-4 h-4 text-sky-500" />
            </div>
          </div>
        </div>
      )}

      {/* Simulator Interactive Demo Control Box */}
      <div className="bg-gradient-to-r from-slate-900 to-railway-navy text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Operational Anomaly Injection (Academic Demo Triggers)
            </span>
          </div>
          {injectStatus && (
            <span className="text-xs text-sky-300 font-mono animate-pulse">{injectStatus}</span>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Click any anomaly below to immediately inject real-world running friction into the simulator and observe the Scikit-learn prediction model update in real time:
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => handleInjectAnomaly('12951', { weather: 'Fog', delayAdded: 18, speed: 45 })}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-semibold transition-colors"
          >
            Inject Severe Fog on 12951 Rajdhani (+18m)
          </button>
          <button
            onClick={() => handleInjectAnomaly('12004', { congestion: 'High', delayAdded: 15, speed: 50 })}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold transition-colors"
          >
            Trigger Junction Congestion on 12004 Shatabdi (+15m)
          </button>
          <button
            onClick={() => handleInjectAnomaly('22436', { weather: 'Clear', congestion: 'Low', speed: 110 })}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-semibold transition-colors"
          >
            Grant Priority High-Speed Track Clearance to 22436
          </button>
        </div>
      </div>

      {/* Charts Section: Recharts Visualizations */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Hourly Delay Patterns Line Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Hourly Delay Trends Across Network
                </h3>
                <span className="text-xs text-slate-400">Average delay (minutes) by time of day</span>
              </div>
            </div>

            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.hourlyDelayTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="hour" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '0.75rem', border: 'none' }} 
                  />
                  <Line type="monotone" dataKey="avgDelay" stroke="#0284C7" strokeWidth={3} dot={{ r: 4 }} name="Avg Delay (m)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Route Punctuality Bar Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Corridor Punctuality Score (%)
                </h3>
                <span className="text-xs text-slate-400">Percentage of runs arriving within 5 minutes</span>
              </div>
            </div>

            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.routePunctuality} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="route" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[60, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '0.75rem', border: 'none' }} 
                  />
                  <Bar dataKey="onTimeScore" fill="#0EA5E9" radius={[6, 6, 0, 0]} name="On-Time Score %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Delay Causes Pie Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Delay Causes Distribution
              </h3>
              <span className="text-xs text-slate-400">Primary operational bottlenecks</span>
            </div>

            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.delayCauses}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                  >
                    {charts.delayCauses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Station Platform Occupancy List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Station Platform Capacity & Congestion
              </h3>
              <span className="text-xs text-slate-400">Current platform occupancy percentages</span>
            </div>

            <div className="space-y-3 pt-1">
              {charts.stationCongestion.map((st, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-800">{st.station}</span>
                    <span className="font-mono font-bold text-slate-700">{st.occupancyPercent}% Occupancy</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        st.occupancyPercent > 80 ? 'bg-rose-500' : (st.occupancyPercent > 65 ? 'bg-amber-500' : 'bg-sky-500')
                      }`}
                      style={{ width: `${st.occupancyPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Admin Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/admin/trains"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 transition-all shadow-sm space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <Train className="w-5 h-5 text-sky-600" />
            <span className="text-xs text-sky-600 font-semibold group-hover:translate-x-1 transition-transform">Manage &rarr;</span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Train Fleet Management</h4>
          <p className="text-xs text-slate-500">
            Add new train schedules, edit operational parameters, or cancel services.
          </p>
        </Link>

        <Link
          to="/admin/schedules"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 transition-all shadow-sm space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span className="text-xs text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">Overrides &rarr;</span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Schedules & ETA Overrides</h4>
          <p className="text-xs text-slate-500">
            Reassign station platforms and apply administrative timing overrides with push alerts.
          </p>
        </Link>

        <Link
          to="/admin/reports"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 transition-all shadow-sm space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <BarChart2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs text-emerald-600 font-semibold group-hover:translate-x-1 transition-transform">Reports &rarr;</span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Historical Performance Reports</h4>
          <p className="text-xs text-slate-500">
            Analyze historical delay patterns, export logs, and evaluate timetable punctuality.
          </p>
        </Link>
      </div>

    </div>
  );
};

export default AdminDashboard;
