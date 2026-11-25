import React, { useState, useEffect } from 'react';
import { 
  Train, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  X,
  Radio
} from 'lucide-react';
import { trainService } from '../services/api';
import DelayBadge from '../components/DelayBadge';

const AdminTrainManagement = () => {
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    trainNumber: '',
    trainName: '',
    trainType: 'Superfast Express',
    sourceStation: '',
    destStation: '',
    sourceName: '',
    destName: '',
    totalDistanceKm: 1000,
    averageSpeedKmh: 85,
    priority: 2,
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchTrains = async () => {
    try {
      const res = await trainService.getAllTrains();
      if (res.data?.success) {
        setTrains(res.data.data);
      }
    } catch (err) {
      console.warn('[AdminTrains] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrains();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      trainNumber: '',
      trainName: '',
      trainType: 'Superfast Express',
      sourceStation: '',
      destStation: '',
      sourceName: '',
      destName: '',
      totalDistanceKm: 850,
      averageSpeedKmh: 80,
      priority: 2,
      runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (train) => {
    setSelectedTrain(train);
    setFormData({
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      trainType: train.trainType,
      sourceStation: train.sourceStation,
      destStation: train.destStation,
      sourceName: train.sourceName || train.sourceStation,
      destName: train.destName || train.destStation,
      totalDistanceKm: train.totalDistanceKm,
      averageSpeedKmh: train.averageSpeedKmh,
      priority: train.priority || 2,
      runningDays: train.runningDays || []
    });
    setIsEditOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await trainService.createTrain(formData);
      if (res.data?.success) {
        setMessage({ type: 'success', text: `Train ${formData.trainNumber} created successfully!` });
        setIsAddOpen(false);
        fetchTrains();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create train.' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTrain) return;
    try {
      const res = await trainService.updateTrain(selectedTrain._id, formData);
      if (res.data?.success) {
        setMessage({ type: 'success', text: `Train ${formData.trainNumber} updated successfully!` });
        setIsEditOpen(false);
        fetchTrains();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update train.' });
    }
  };

  const handleDelete = async (train) => {
    if (window.confirm(`Are you sure you want to permanently delete Train ${train.trainNumber} (${train.trainName})?`)) {
      try {
        await trainService.deleteTrain(train._id);
        setMessage({ type: 'success', text: `Train ${train.trainNumber} deleted.` });
        fetchTrains();
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to delete train.' });
      }
    }
  };

  const handleStatusChange = async (train, newStatus) => {
    try {
      await trainService.updateStatus(train._id, { trainStatus: newStatus });
      fetchTrains();
      setMessage({ type: 'success', text: `Train ${train.trainNumber} status set to ${newStatus}` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Status update failed.' });
    }
  };

  const filtered = trains.filter(t => 
    t.trainNumber.toLowerCase().includes(search.toLowerCase()) ||
    t.trainName.toLowerCase().includes(search.toLowerCase()) ||
    t.sourceStation.toLowerCase().includes(search.toLowerCase()) ||
    t.destStation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Train className="w-6 h-6 text-sky-600" />
            Train Fleet Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Register new trains, modify timetable parameters, and control operational service status.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Train</span>
        </button>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Search Input */}
      <div className="max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter fleet by number, name, or station..."
          className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-400"
        />
      </div>

      {/* Trains Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3.5">Train</th>
                <th className="px-4 py-3.5">Route</th>
                <th className="px-4 py-3.5">Type & Priority</th>
                <th className="px-4 py-3.5">Distance</th>
                <th className="px-4 py-3.5">Operational Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((train) => (
                <tr key={train._id || train.trainNumber} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[11px] block w-max">
                      #{train.trainNumber}
                    </span>
                    <span className="font-bold text-slate-900 block mt-1">
                      {train.trainName}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-medium">
                    <span className="text-slate-700 font-semibold">{train.sourceStation}</span>
                    <span className="text-slate-400 mx-1">&rarr;</span>
                    <span className="text-slate-700 font-semibold">{train.destStation}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-slate-800 block">{train.trainType}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Priority: P{train.priority || 2}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono">
                    {train.totalDistanceKm} km
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={train.trainStatus || 'On Time'}
                      onChange={(e) => handleStatusChange(train, e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 font-semibold text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="On Time">On Time</option>
                      <option value="Running">Running (Normal)</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(train)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-600 transition-colors"
                        title="Edit train"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(train)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors"
                        title="Delete train"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Train Modal */}
      {(isAddOpen || isEditOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {isAddOpen ? 'Add New Train to Fleet' : `Edit Train #${formData.trainNumber}`}
              </h3>
              <button
                onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isAddOpen ? handleAddSubmit : handleEditSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Train Number</label>
                  <input
                    type="text"
                    required
                    disabled={isEditOpen}
                    value={formData.trainNumber}
                    onChange={(e) => setFormData({ ...formData, trainNumber: e.target.value })}
                    placeholder="e.g. 12953"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Train Type</label>
                  <select
                    value={formData.trainType}
                    onChange={(e) => setFormData({ ...formData, trainType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Tejas Rajdhani">Tejas Rajdhani</option>
                    <option value="Shatabdi Express">Shatabdi Express</option>
                    <option value="Vande Bharat">Vande Bharat</option>
                    <option value="Duronto Express">Duronto Express</option>
                    <option value="Superfast Express">Superfast Express</option>
                    <option value="Mail/Express">Mail/Express</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Train Official Name</label>
                <input
                  type="text"
                  required
                  value={formData.trainName}
                  onChange={(e) => setFormData({ ...formData, trainName: e.target.value })}
                  placeholder="e.g. August Kranti Rajdhani Express"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Origin Station Code</label>
                  <input
                    type="text"
                    required
                    value={formData.sourceStation}
                    onChange={(e) => setFormData({ ...formData, sourceStation: e.target.value.toUpperCase() })}
                    placeholder="e.g. NDLS"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Destination Code</label>
                  <input
                    type="text"
                    required
                    value={formData.destStation}
                    onChange={(e) => setFormData({ ...formData, destStation: e.target.value.toUpperCase() })}
                    placeholder="e.g. MMCT"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Distance (km)</label>
                  <input
                    type="number"
                    value={formData.totalDistanceKm}
                    onChange={(e) => setFormData({ ...formData, totalDistanceKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Corridor Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value={1}>P1 - High Priority (Rajdhani/Vande Bharat)</option>
                    <option value={2}>P2 - Standard Express (Shatabdi/Duronto)</option>
                    <option value={3}>P3 - Regular Express</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-md shadow-sky-600/20"
                >
                  {isAddOpen ? 'Create Train' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminTrainManagement;
