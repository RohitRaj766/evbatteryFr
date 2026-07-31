'use client';

import React, { useEffect, useState } from 'react';
import {
  Repeat,
  Plus,
  RefreshCw,
  CheckCircle,
  Building2,
  Battery,
  User as UserIcon,
  Calendar
} from 'lucide-react';
import { api } from '@/lib/api';
import { Swap, Station, Battery as BatteryType } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function SwapsPage() {
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [stationId, setStationId] = useState('');
  const [oldBatteryId, setOldBatteryId] = useState('');
  const [newBatteryId, setNewBatteryId] = useState('');
  const [driverVehicleId, setDriverVehicleId] = useState('DL-01-EV-4821');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const isDriver = user?.role === 'DRIVER';

  const loadData = async () => {
    setLoading(true);
    try {
      const [swRes, stRes, batRes] = await Promise.all([
        api.swaps.list(),
        api.stations.list(),
        api.batteries.list(),
      ]);
      if (swRes.success) {
        let allSwaps = swRes.data || [];
        if (isDriver && user?.id) {
          allSwaps = allSwaps.filter(s => s.driverId === user.id || s.driver?.email === user.email);
        }
        setSwaps(allSwaps);
      }
      if (stRes.success) setStations(stRes.data || []);
      if (batRes.success) setBatteries(batRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationId || !oldBatteryId || !newBatteryId || !driverVehicleId || !user) return;
    setSubmitting(true);
    try {
      const res = await api.swaps.create({
        driverId: user.id,
        stationId,
        oldBatteryId,
        newBatteryId,
        driverVehicleId,
      });

      if (res.success) {
        setShowCreateModal(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to execute swap');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Repeat className="w-7 h-7 text-indigo-400" />
            <span>Battery Swap Transactions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated battery exchange logs, state-of-health tracking at swap time, and driver history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Initiate Swap</span>
          </button>
        </div>
      </div>

      {/* Swaps Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading swap transactions...</div>
        ) : swaps.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No swap transactions logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Time</th>
                  <th className="py-3.5 px-4">Station</th>
                  <th className="py-3.5 px-4">Driver</th>
                  <th className="py-3.5 px-4">Vehicle Plate</th>
                  <th className="py-3.5 px-4">Returned Battery</th>
                  <th className="py-3.5 px-4">Issued Battery</th>
                  <th className="py-3.5 px-4">SOH at Swap</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {swaps.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 font-semibold">
                      {s.station?.name || s.stationId}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {s.driver?.name || s.driverId}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                      {(s as any).driverVehicleId || 'DL-01-EV-4821'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-amber-400">
                      {s.oldBattery?.serialNumber || s.oldBatteryId}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400">
                      {s.newBattery?.serialNumber || s.newBatteryId}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-teal-400">
                      {s.sohAtSwap}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Perform Swap Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white">Execute Battery Swap</h2>
            <form onSubmit={handleExecuteSwap} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Driver Vehicle Reg / Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="DL-01-EV-4821"
                  value={driverVehicleId}
                  onChange={(e) => setDriverVehicleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Select Station</label>
                <select
                  required
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Station --</option>
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Depleted Battery Pack (Returned)</label>
                <select
                  required
                  value={oldBatteryId}
                  onChange={(e) => setOldBatteryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="">-- Choose Old Battery --</option>
                  {batteries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.serialNumber} (SOC: {b.socPercentage}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Charged Battery Pack (Assigned)</label>
                <select
                  required
                  value={newBatteryId}
                  onChange={(e) => setNewBatteryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="">-- Choose New Battery --</option>
                  {batteries.filter(b => b.status === 'READY' || b.id !== oldBatteryId).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.serialNumber} (SOC: {b.socPercentage}%, SOH: {b.sohPercentage}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
                >
                  {submitting ? 'Executing...' : 'Confirm Swap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
