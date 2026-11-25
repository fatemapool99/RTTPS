import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

const UserProfilePage = () => {
  const { user, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [preferredStation, setPreferredStation] = useState(user?.preferredStation || 'NDLS');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const res = await authService.updateProfile({ name, phoneNumber, preferredStation });
      if (res.data?.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.warn('[Profile] Update error:', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-sky-600" />
          Passenger Profile & Preferences
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your passenger identification, contact details, and default railway station.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        
        {/* User Card Summary */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-sky-500/20">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                user?.role === 'admin' 
                  ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                  : 'bg-sky-100 text-sky-700 border border-sky-200'
              }`}>
                {user?.role === 'admin' ? 'Railway Admin' : 'Passenger'}
              </span>
            </div>
            <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
              <Mail className="w-3.5 h-3.5" /> {user?.email}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleUpdate} className="space-y-4">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Profile settings successfully saved!</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Home / Preferred Station</label>
              <select
                value={preferredStation}
                onChange={(e) => setPreferredStation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                <option value="NDLS">New Delhi (NDLS)</option>
                <option value="MMCT">Mumbai Central (MMCT)</option>
                <option value="CNB">Kanpur Central (CNB)</option>
                <option value="LKO">Lucknow Charbagh (LKO)</option>
                <option value="PRYJ">Prayagraj Junction (PRYJ)</option>
                <option value="HWH">Howrah (HWH)</option>
                <option value="KOTA">Kota Junction (KOTA)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

      </div>

    </div>
  );
};

export default UserProfilePage;
