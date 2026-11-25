import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  AlertTriangle, 
  AlertOctagon, 
  MapPin, 
  Info, 
  Train,
  CheckCircle2
} from 'lucide-react';
import { notificationService } from '../services/api';
import { useSocket } from '../context/SocketContext';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const { recentAlert } = useSocket();

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.data?.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.warn('[Notifications] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Prepend real-time push notification if one arrives
  useEffect(() => {
    if (recentAlert) {
      setNotifications(prev => [recentAlert, ...prev]);
    }
  }, [recentAlert]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, readStatus: true } : n));
    } catch (e) {
      console.warn('[Notifications] Mark read error:', e.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
    } catch (e) {
      console.warn('[Notifications] Mark all read error:', e.message);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'ALL') return true;
    return n.notificationType === filterType;
  });

  const getIconForType = (type) => {
    switch (type) {
      case 'DELAY':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'PLATFORM_CHANGE':
        return <MapPin className="w-5 h-5 text-sky-500" />;
      case 'CANCELLATION':
        return <AlertOctagon className="w-5 h-5 text-rose-500" />;
      default:
        return <Info className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-sky-600" />
            Passenger Alerts & Delay Advisories
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time notifications regarding corridor delays, platform reassignment, and train running changes.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <CheckCheck className="w-4 h-4 text-emerald-600" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: 'ALL', label: 'All Alerts' },
          { id: 'DELAY', label: 'Delays' },
          { id: 'PLATFORM_CHANGE', label: 'Platform Changes' },
          { id: 'CANCELLATION', label: 'Cancellations' },
          { id: 'INFO', label: 'General Info' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading alerts feed...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">All clear</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No active alerts matching the selected category.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleMarkAsRead(notif._id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                notif.readStatus 
                  ? 'bg-white border-slate-200/80 hover:border-slate-300' 
                  : 'bg-sky-50/50 border-sky-200 hover:border-sky-300 shadow-sm'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shrink-0 shadow-sm">
                {getIconForType(notif.notificationType)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {notif.title}
                    </span>
                    {notif.trainNumber && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        #{notif.trainNumber}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(notif.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {notif.message}
                </p>
              </div>

              {!notif.readStatus && (
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0 mt-2" title="Unread"></span>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default NotificationsPage;
