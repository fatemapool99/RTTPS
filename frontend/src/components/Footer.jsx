import React from 'react';
import { Train, ShieldAlert, Cpu, Database, Radio, GitBranch } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-railway-navy text-slate-400 text-xs border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Brand & Academic Note */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                <Train className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-sm">
                Railway Time Tracking and Prediction System (RTTPS)
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              An Academic Software Engineering Capstone Project demonstrating real-world full-stack architecture, 
              asynchronous GPS telemetry simulation, MongoDB database management, and Scikit-Learn regression models for train arrival prediction.
            </p>
            <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px] pt-1">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-sky-400" /> Scikit-learn + FastAPI
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-emerald-400" /> MongoDB + Express
              </span>
              <span className="flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-amber-400" /> Socket.IO
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <span className="font-semibold text-white uppercase tracking-wider text-[11px]">System Navigation</span>
            <ul className="space-y-1.5">
              <li><Link to="/search" className="hover:text-white transition-colors">Search Trains & Timetables</Link></li>
              <li><Link to="/tracking/12951" className="hover:text-white transition-colors">Live Interactive GPS Map</Link></li>
              <li><Link to="/notifications" className="hover:text-white transition-colors">Delay & Platform Alerts</Link></li>
              <li><Link to="/admin/dashboard" className="hover:text-white transition-colors">Railway Administrator Portal</Link></li>
            </ul>
          </div>

          {/* Transparent Academic Disclaimer */}
          <div className="space-y-2">
            <span className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Operational Notice
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              This development version features an integrated real-time GPS telemetry simulator running along verified corridor coordinates.
              All predictions are computed via an active machine learning regression model.
            </p>
          </div>

        </div>

        <div className="border-t border-slate-800/80 mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px]">
          <span>© 2026 Railway Time Tracking and Prediction System (RTTPS). All rights reserved.</span>
          <span className="mt-2 sm:mt-0 font-mono text-slate-400">
            B.Tech Computer Science Capstone Engineering
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
