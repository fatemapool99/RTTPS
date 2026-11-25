import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Train, 
  MapPin, 
  Search, 
  Bell, 
  User, 
  LogOut, 
  ShieldCheck, 
  Radio, 
  Menu, 
  X,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { notificationService } from '../services/api';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout, demoLogin } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationService.getNotifications();
        if (res.data?.success) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (e) {
        // quiet error
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-railway-navy text-white sticky top-0 z-50 shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <Train className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  RTTPS
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    v1.0
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 block tracking-wider uppercase font-medium">
                  Railway Tracking & ML Prediction
                </span>
              </div>
            </Link>

            {/* Socket Status indicator */}
            <div className="hidden lg:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-slate-300 font-mono text-[11px]">
                {connected ? 'LIVE TELEMETRY' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-slate-800 text-sky-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Home
            </Link>

            <Link 
              to="/search" 
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                isActive('/search') ? 'bg-slate-800 text-sky-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-4 h-4" />
              Search Trains
            </Link>

            <Link 
              to="/tracking/12951" 
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                location.pathname.startsWith('/tracking') ? 'bg-slate-800 text-sky-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              Live Tracking
            </Link>

            {/* Admin Dropdown */}
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    location.pathname.startsWith('/admin') ? 'bg-sky-600/30 text-sky-300 border border-sky-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  Admin Console
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {adminDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 text-sm"
                    onMouseLeave={() => setAdminDropdownOpen(false)}
                  >
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="block px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      to="/admin/trains"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="block px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      Train Fleet Management
                    </Link>
                    <Link
                      to="/admin/schedules"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="block px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      Schedules & Platform Overrides
                    </Link>
                    <Link
                      to="/admin/reports"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="block px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      Delay Analytics & Reports
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Header: Notifications & Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Notification Bell */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Operational Alerts"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors text-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-sky-600/30 text-sky-400 flex items-center justify-center font-bold text-xs">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="font-medium text-slate-200 text-xs">
                    {user?.name?.split(' ')[0]}
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-mono font-semibold">
                      ADMIN
                    </span>
                  )}
                </Link>

                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => demoLogin('passenger')}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 font-medium transition-colors"
                  title="Fast one-click demo login"
                >
                  Demo Passenger
                </button>
                <button
                  onClick={() => demoLogin('admin')}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-sky-600/20 text-sky-300 hover:bg-sky-600/30 border border-sky-500/30 font-medium transition-colors"
                  title="Fast one-click admin login"
                >
                  Demo Admin
                </button>
                <Link
                  to="/login"
                  className="text-xs px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-md shadow-sky-600/30 transition-all"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg text-slate-300 hover:text-white"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Home
          </Link>
          <Link
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Search Trains
          </Link>
          <Link
            to="/tracking/12951"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Live Tracking
          </Link>

          {isAdmin && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs uppercase text-slate-400 font-semibold px-3">Admin Navigation</span>
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-1.5 rounded-lg text-sm text-sky-400 hover:bg-slate-800"
              >
                Dashboard
              </Link>
              <Link
                to="/admin/trains"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-1.5 rounded-lg text-sm text-sky-400 hover:bg-slate-800"
              >
                Train Management
              </Link>
              <Link
                to="/admin/schedules"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-1.5 rounded-lg text-sm text-sky-400 hover:bg-slate-800"
              >
                Schedules & Overrides
              </Link>
              <Link
                to="/admin/reports"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-1.5 rounded-lg text-sm text-sky-400 hover:bg-slate-800"
              >
                Analytics & Reports
              </Link>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800">
            {isAuthenticated ? (
              <div className="flex items-center justify-between px-3 py-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm text-slate-200"
                >
                  <User className="w-4 h-4 text-sky-400" />
                  <span>{user?.name}</span>
                </Link>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-lg bg-sky-600 text-white font-medium text-sm"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => { demoLogin('admin'); setMobileMenuOpen(false); }}
                  className="w-full text-center py-2 rounded-lg bg-slate-800 text-sky-400 font-medium text-sm border border-slate-700"
                >
                  One-Click Demo Admin Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
