import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Train, 
  MapPin, 
  Calendar, 
  Clock, 
  Radio, 
  ArrowRight,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { trainService } from '../services/api';
import DelayBadge from '../components/DelayBadge';

const TrainSearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [query, setQuery] = useState(initialQuery);
  const [source, setSource] = useState(searchParams.get('source') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [selectedDay, setSelectedDay] = useState(searchParams.get('day') || '');

  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrains = async () => {
    setLoading(true);
    try {
      const params = {};
      if (query.trim()) params.query = query.trim();
      if (source.trim()) params.source = source.trim();
      if (destination.trim()) params.destination = destination.trim();
      if (status) params.status = status;
      if (selectedDay) params.day = selectedDay;

      const res = await trainService.searchTrains(params);
      if (res.data?.success) {
        setTrains(res.data.data);
      }
    } catch (err) {
      console.warn('[Search] Failed to fetch trains:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrains();
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = {};
    if (query.trim()) newParams.query = query.trim();
    if (source.trim()) newParams.source = source.trim();
    if (destination.trim()) newParams.destination = destination.trim();
    if (status) newParams.status = status;
    if (selectedDay) newParams.day = selectedDay;
    setSearchParams(newParams);
  };

  const handleReset = () => {
    setQuery('');
    setSource('');
    setDestination('');
    setStatus('');
    setSelectedDay('');
    setSearchParams({});
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Train className="w-6 h-6 text-sky-600" />
          Train Timetables & Route Search
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Search across the railway network by train number, name, origin, destination, or operating days.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Query */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Search Keyword</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Train No / Name (e.g. 12951)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-400"
                />
              </div>
            </div>

            {/* Source */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Origin Station</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. NDLS or Delhi"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-400"
                />
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Destination</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. MMCT or Mumbai"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-400"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Running Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                <option value="">All Running Statuses</option>
                <option value="Running">Running (In Transit)</option>
                <option value="On Time">On Time</option>
                <option value="Delayed">Delayed (&gt; 15m)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

          </div>

          {/* Running Days Quick Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Day:
              </span>
              <button
                type="button"
                onClick={() => setSelectedDay('')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  selectedDay === '' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Days
              </button>
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day === selectedDay ? '' : day)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                    selectedDay === day ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Found {trains.length} Matching Trains
        </span>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-xs text-slate-500 font-medium">Searching timetable database...</span>
        </div>
      ) : trains.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No trains found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No active train routes matched your search criteria. Try removing filters or searching by train number (e.g. 12951 or 12004).
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition-colors"
          >
            Show All Trains
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {trains.map((train) => {
            const firstStop = train.schedules?.[0];
            const lastStop = train.schedules?.[train.schedules?.length - 1];

            return (
              <div
                key={train._id || train.trainNumber}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-sky-300 transition-all space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                          #{train.trainNumber}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {train.trainType || 'Express'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1 line-clamp-1">
                        {train.trainName}
                      </h3>
                    </div>

                    <DelayBadge delayMinutes={train.delayMinutes} status={train.trainStatus} />
                  </div>

                  {/* Route & Timetable preview */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-semibold uppercase">DEPARTURE</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {firstStop ? firstStop.scheduledDeparture : '16:55'}
                      </span>
                      <span className="font-medium text-slate-600 block">
                        {train.sourceName || train.sourceStation}
                      </span>
                    </div>

                    <div className="flex flex-col items-center px-3">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {train.totalDistanceKm || 1000} km
                      </span>
                      <span className="text-slate-300 font-mono tracking-widest">━━━━▶</span>
                      <span className="text-[10px] text-sky-600 font-semibold">
                        {train.intermediateStationsCount || 7} Stops
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block font-semibold uppercase">ARRIVAL</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {lastStop ? lastStop.scheduledArrival : '08:35'}
                      </span>
                      <span className="font-medium text-slate-600 block">
                        {train.destName || train.destStation}
                      </span>
                    </div>
                  </div>

                  {/* Running Days Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">Runs On:</span>
                    {daysOfWeek.map((day) => {
                      const runs = train.runningDays?.includes(day);
                      return (
                        <span
                          key={day}
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            runs 
                              ? 'bg-slate-800 text-white font-semibold' 
                              : 'bg-slate-100 text-slate-300'
                          }`}
                        >
                          {day[0]}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-400 text-[10px] block">CURRENT STATUS</span>
                    <span className="font-semibold text-slate-700">
                      {train.tracking?.currentStatus || 'In Transit'}
                    </span>
                  </div>

                  <Link
                    to={`/tracking/${train.trainNumber}`}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live Track & ETA</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default TrainSearchPage;
