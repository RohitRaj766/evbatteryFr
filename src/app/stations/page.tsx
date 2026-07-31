'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  MapPin,
  ChevronRight,
  ShieldAlert,
  Zap,
  Battery,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { Station } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(37.7749);
  const [longitude, setLongitude] = useState(-122.4194);
  const [totalDocks, setTotalDocks] = useState(8);
  const [creating, setCreating] = useState(false);

  const { user, hasRole } = useAuth();
  const isAdmin = hasRole(['ADMIN']);
  const isOperator = user?.role === 'OPERATOR';

  const loadStations = async () => {
    setLoading(true);
    try {
      const res = await api.stations.list();
      if (res.success) {
        let allStations = res.data || [];
        if (isOperator && user?.id) {
          try {
            const opRes = await api.assignments.getOperatorStations(user.id);
            if (opRes.success && Array.isArray(opRes.data)) {
              const assignedIds = new Set(opRes.data.map((a: any) => a.stationId));
              allStations = allStations.filter(s => assignedIds.has(s.id));
            }
          } catch (e) {
            console.error('Operator assignments filter:', e);
          }
        }
        setStations(allStations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.stations.create({
        name,
        location,
        latitude: Number(latitude),
        longitude: Number(longitude),
        totalDocks: Number(totalDocks),
      });
      if (res.success) {
        setShowCreateModal(false);
        setName('');
        setLocation('');
        loadStations();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create station');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-teal-400" />
            <span>Swapping Stations & Docks Network</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated docking bays, real-time dock occupancy, thermal safety cutoffs, and smart swap algorithms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStations}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
            title="Refresh Stations"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Station</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Stations */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading stations...</div>
      ) : stations.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">No swapping stations available.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((st) => (
            <div
              key={st.id}
              className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-base text-white tracking-wide">{st.name}</h2>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{st.location}</span>
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    st.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {st.isActive ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Docks: <strong className="text-slate-200">{st.totalDocks}</strong></span>
                  <span className="text-slate-400">Available: <strong className="text-emerald-400">{st.availableDocks}</strong></span>
                </div>

                {/* Dock Occupancy Bar */}
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden flex">
                  {st.docks && st.docks.length > 0 ? (
                    st.docks.map((d) => (
                      <div
                        key={d.id}
                        title={`Dock #${d.dockNumber}: ${d.status}`}
                        className={`h-full flex-1 border-r border-slate-900 last:border-0 ${
                          d.isThermalCutoff ? 'bg-rose-500 pulse-critical' :
                          d.status === 'AVAILABLE' ? 'bg-emerald-500' :
                          d.status === 'OCCUPIED' ? 'bg-teal-500' : 'bg-slate-700'
                        }`}
                      />
                    ))
                  ) : (
                    <div className="w-full bg-slate-800 h-full" />
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/stations/${st.id}`}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <span>Manage Docks & Safety</span>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Station Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white">Create Swapping Station</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Station Name</label>
                <input
                  type="text"
                  required
                  placeholder="Metro Hub Alpha"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Location Address</label>
                <input
                  type="text"
                  required
                  placeholder="100 Innovation Way, Tech Park"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Total Docking Bays</label>
                <input
                  type="number"
                  min="1"
                  max="32"
                  required
                  value={totalDocks}
                  onChange={(e) => setTotalDocks(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                >
                  {creating ? 'Creating...' : 'Create Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
