import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Train, 
  MapPin, 
  Radio, 
  Clock, 
  ShieldCheck, 
  Cpu, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { trainService, analyticsService } from '../services/api';
import DelayBadge from '../components/DelayBadge';

const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [popularTrains, setPopularTrains] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trainsRes, statsRes] = await Promise.all([
          trainService.getAllTrains(),
          analyticsService.getDashboardStats()
        ]);
        if (trainsRes.data?.success) {
          setPopularTrains(trainsRes.data.data.slice(0, 4));
        }
        if (statsRes.data?.success) {
          setStats(statsRes.data.stats);
        }
      } catch (err) {
        console.warn('[Landing] Fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-railway-navy via-slate-900 to-railway-navy text-white py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background glowing gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          
          {/* Project Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold backdrop-blur">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>AI-Driven Railway Telemetry & Delay Prediction</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Next-Generation <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400">
              Railway Time Tracking
            </span> & ETA Prediction
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
            Eliminating timetable guesswork. RTTPS combines asynchronous GPS route telemetry, 
            corridor congestion indices, and Scikit-Learn machine learning regression to deliver high-confidence arrival predictions.
          </p>

          {/* Quick Search Card */}
          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-2xl mt-8">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Train Number, Name, Source or Destination (e.g. 12951 or Delhi)..."
                  className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-inner"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-sky-500/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Key System Statistics Pill */}
          {stats && (
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-center font-mono">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 backdrop-blur">
                <span className="text-xl sm:text-2xl font-bold text-white block">{stats.totalTrains}</span>
                <span className="text-[11px] text-slate-400 uppercase font-sans">Active Trains</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 backdrop-blur">
                <span className="text-xl sm:text-2xl font-bold text-emerald-400 block">{stats.punctualityPercentage}%</span>
                <span className="text-[11px] text-slate-400 uppercase font-sans">On-Time Score</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 backdrop-blur">
                <span className="text-xl sm:text-2xl font-bold text-sky-400 block">3.28m</span>
                <span className="text-[11px] text-slate-400 uppercase font-sans">Model MAE Error</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 backdrop-blur">
                <span className="text-xl sm:text-2xl font-bold text-amber-400 block">3.5s</span>
                <span className="text-[11px] text-slate-400 uppercase font-sans">GPS Cycle</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Popular Running Express Trains Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Featured Running Express Fleet
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Live telemetry and machine learning arrival predictions updated every 3.5 seconds.
            </p>
          </div>
          <Link
            to="/search"
            className="text-xs sm:text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 group"
          >
            <span>View All Fleet</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {popularTrains.map((train) => (
            <div
              key={train._id || train.trainNumber}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                    #{train.trainNumber}
                  </span>
                  <DelayBadge delayMinutes={train.delayMinutes} status={train.trainStatus} size="sm" />
                </div>

                <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
                  {train.trainName}
                </h3>

                <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
                  <span className="font-semibold text-slate-700">{train.sourceStation}</span>
                  <span className="text-slate-300 font-mono">───────▶</span>
                  <span className="font-semibold text-slate-700">{train.destStation}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-400 text-[10px] block">CURRENT SPEED</span>
                  <span className="font-mono font-bold text-slate-800">
                    {Math.round(train.currentSpeed || 85)} km/h
                  </span>
                </div>

                <Link
                  to={`/tracking/${train.trainNumber}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Track</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Architecture Feature Matrix */}
      <div className="bg-white border-y border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Integrated Multi-Tier Railway Architecture
            </h2>
            <p className="text-sm text-slate-500">
              Built in accordance with academic software engineering principles, integrating real-time messaging, machine learning inference, and database persistence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-sky-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Real-Time GPS Route Simulator
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Asynchronous background runner calculating geospatial coordinates along real railway corridor tracks. 
                Emits live updates every 3.5 seconds through Socket.IO websockets.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-sky-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Scikit-Learn Regression Engine
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Trained GradientBoosting / RandomForest model evaluating remaining distance, timetable deficit, weather alerts, 
                and junction congestion to predict arrival delays (R²: 0.984).
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-sky-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Railway Admin Operations Center
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Protected dashboard for administrators to manage fleet records, assign platform numbers, 
                override predicted timings, and monitor punctuality reports using Recharts.
              </p>
            </div>

          </div>

          {/* Academic Transparency Note */}
          <div className="bg-sky-50 rounded-2xl p-6 border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Ready for Evaluation & Live Demonstration
                </h4>
                <p className="text-xs text-slate-600">
                  Includes ready-to-test default credentials for both Passenger and Railway Administrator roles.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                Sign In to Test
              </Link>
              <Link
                to="/tracking/12951"
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors"
              >
                Inspect Live Map
              </Link>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default LandingPage;
