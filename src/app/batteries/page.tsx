'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BatteryCharging,
  Plus,
  Search,
  Filter,
  Activity,
  AlertTriangle,
  Flame,
  CheckCircle,
  XCircle,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { Battery, BatteryHealthState } from '@/types';
import { ThermalBadge } from '@/components/ThermalBadge';
import { useAuth } from '@/context/AuthContext';

export default function BatteriesPage() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('Amara Raja Energy');
  const [modelName, setModelName] = useState('AR-48V-30AH-LFP');
  const [capacityKwh, setCapacityKwh] = useState(1.44);
  const [manufacturedAt, setManufacturedAt] = useState(new Date().toISOString().split('T')[0]);
  const [creating, setCreating] = useState(false);

  const { hasRole } = useAuth();
  const isAdmin = hasRole(['ADMIN']);

  const loadBatteries = async () => {
    setLoading(true);
    try {
      const res = await api.batteries.list({ healthState: statusFilter || undefined, search: search || undefined });
      if (res.success) {
        setBatteries(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatteries();
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.batteries.create({
        serialNumber,
        manufacturer,
        modelName,
        capacityKwh: Number(capacityKwh),
        manufacturedAt: new Date(manufacturedAt).toISOString(),
      });
      if (res.success) {
        setShowCreateModal(false);
        setSerialNumber('');
        loadBatteries();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create battery');
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
            <BatteryCharging className="w-7 h-7 text-emerald-400" />
            <span>EV Battery Fleet Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor State of Charge (SOC), State of Health (SOH), cycle counts, and thermal health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadBatteries}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register Battery</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by serial number or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadBatteries()}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Health States</option>
            <option value="HEALTHY">HEALTHY</option>
            <option value="DEGRADED">DEGRADED</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="DECOMMISSIONED">DECOMMISSIONED</option>
          </select>
        </div>
      </div>

      {/* Battery List Table / Cards */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading battery fleet...</div>
        ) : batteries.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No batteries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Serial Number</th>
                  <th className="py-3.5 px-4">Model</th>
                  <th className="py-3.5 px-4">SOH / Cycles</th>
                  <th className="py-3.5 px-4">Cycles</th>
                  <th className="py-3.5 px-4">Health State</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {batteries.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">{b.serialNumber}</td>
                    <td className="py-3.5 px-4 text-slate-300">{b.modelName} ({b.capacityKwh} kWh)</td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">SOH:</span>
                          <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${b.soh > 85 ? 'bg-emerald-500' : b.soh > 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${b.soh}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-slate-200 text-[11px]">{b.soh}%</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Cycles: <span className="text-emerald-400 font-bold">{b.cycleCount}</span></div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{b.cycleCount}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.healthState === 'HEALTHY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        b.healthState === 'DEGRADED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        b.healthState === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        {b.healthState}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-slate-300">
                        {b.dock ? `${b.dock.station.name} #${b.dock.dockNumber}` : 'Mobile / In Vehicle'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/batteries/${b.id}`}
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                      >
                        Telemetry <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white">Register New Battery Pack</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Serial Number</label>
                <input
                  type="text"
                  required
                  placeholder="BAT-2026-X88"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Manufacturer</label>
                <input
                  type="text"
                  required
                  placeholder="Amara Raja Energy"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Model Name</label>
                <input
                  type="text"
                  required
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Capacity (kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={capacityKwh}
                    onChange={(e) => setCapacityKwh(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Manufactured Date</label>
                  <input
                    type="date"
                    required
                    value={manufacturedAt}
                    onChange={(e) => setManufacturedAt(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
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
                  {creating ? 'Registering...' : 'Register Pack'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
