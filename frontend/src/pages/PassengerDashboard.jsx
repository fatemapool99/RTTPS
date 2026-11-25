import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Train, 
  Search, 
  Radio, 
  Bell, 
  Clock, 
  MapPin, 
  ArrowRight, 
  Compass, 
  ShieldAlert,
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { trainService, notificationService } from '../services/api';
import DelayBadge from '../components/DelayBadge';

const PassengerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trains, setTrains] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [trainsRes, notifsRes] = await Promise.all([
          trainService.getAllTrains(),
          notificationService.getNotifications()
        ]);

        if (trainsRes.data?.success) {
          setTrains(trainsRes.data.data);
        }
        if (notifsRes.data?.success) {
          setNotifications(notifsRes.data.data.slice(0, 3));
        }
      } catch (err) {
        console.warn('[Dashboard] Fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-railway-navy via-slate-900 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 text-xs font-semibold border border-sky-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Passenger Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Passenger'}!
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Monitor real-time train movements, live GPS coordinates, and arrival predictions computed with Scikit-learn machine learning regression.
          </p>

          {/* Quick Search */}
          <form onSubmit={handleSearch} className="pt-2 flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search train by name or number (e.g. 12951)..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Running Trains Fleet */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Compass className="w-5 h-5 text-sky-600" />
                Active Train Running Status
              </h2>
              <span className="text-xs text-slate-500">Live GPS simulated telemetry & delay status</span>
            </div>

            <Link
              to="/search"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>All Trains</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trains.map((train) => (
              <div
                key={train._id || train.trainNumber}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-sky-300 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                      #{train.trainNumber}
                    </span>
                    <DelayBadge delayMinutes={train.delayMinutes} status={train.trainStatus} size="sm" />
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
                    {train.trainName}
                  </h3>

                  <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
                    <span className="font-semibold text-slate-700">{train.sourceStation}</span>
                    <span className="text-slate-300 font-mono">────▶</span>
                    <span className="font-semibold text-slate-700">{train.destStation}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="font-mono">
                    <span className="text-slate-400 text-[10px] block font-sans">SPEED</span>
                    <span className="font-bold text-slate-800">{Math.round(train.currentSpeed || 85)} km/h</span>
                  </div>

                  <Link
                    to={`/tracking/${train.trainNumber}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Track Live</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Live Notifications Feed & Shortcuts */}
        <div className="space-y-6">
          
          {/* Important Railway Alerts */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-sky-600" />
                Live Operational Alerts
              </h3>
              <Link to="/notifications" className="text-xs text-sky-600 font-semibold hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No recent railway alerts.</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="bg-gradient-to-br from-sky-50 to-indigo-50/50 rounded-2xl p-5 border border-sky-200 space-y-3">
            <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-sky-600" />
              How RTTPS Computes ETAs
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unlike static timetable schedules, our prediction engine evaluates live track velocity, accumulated route deficit, corridor junction congestion, and weather caution flags using machine learning regression.
            </p>
            <Link
              to="/tracking/12951"
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800"
            >
              <span>See live prediction breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};

export default PassengerDashboard;
