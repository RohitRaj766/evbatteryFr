'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  ArrowLeft,
  Flame,
  Battery,
  Plus,
  Zap,
  CheckCircle,
  AlertOctagon,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { Station, Dock, Battery as BatteryType } from '@/types';
import { ThermalBadge } from '@/components/ThermalBadge';
import { useAuth } from '@/context/AuthContext';

export default function StationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const stationId = params.id as string;

  const [station, setStation] = useState<Station | null>(null);
  const [availableBatteries, setAvailableBatteries] = useState<BatteryType[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Insert modal state
  const [selectedDockId, setSelectedDockId] = useState<string | null>(null);
  const [selectedBatteryId, setSelectedBatteryId] = useState('');

  const { hasRole } = useAuth();
  const isAdmin = hasRole(['ADMIN']);

  const loadData = async () => {
    try {
      const [sRes, bRes] = await Promise.all([
        api.stations.getById(stationId),
        api.batteries.list(),
      ]);
      if (sRes.success) setStation(sRes.data);
      if (bRes.success) setAvailableBatteries(bRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stationId) loadData();
  }, [stationId]);

  const handleAddDock = async () => {
    if (!station) return;
    setActionLoading(true);
    try {
      const nextDockNumber = (station.docks?.length || 0) + 1;
      const res = await api.stations.addDock(stationId, nextDockNumber);
      if (res.success) loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add dock');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecommendSwap = async () => {
    try {
      const res = await api.stations.recommendSwap(stationId);
      if (res.success) {
        setRecommendation(res.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'No optimal battery ready for swap');
    }
  };

  const handleInsertBattery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDockId || !selectedBatteryId) return;
    setActionLoading(true);
    try {
      const res = await api.stations.insertBattery(stationId, selectedDockId, selectedBatteryId);
      if (res.success) {
        setSelectedDockId(null);
        setSelectedBatteryId('');
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to insert battery');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveBattery = async (dockId: string) => {
    if (!confirm('Remove battery pack from dock bay?')) return;
    setActionLoading(true);
    try {
      const res = await api.stations.removeBattery(stationId, dockId);
      if (res.success) loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove battery');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerCutoff = async (dockId: string) => {
    if (!confirm('Trigger emergency thermal cutoff for this dock?')) return;
    setActionLoading(true);
    try {
      const res = await api.stations.triggerCutoff(stationId, dockId);
      if (res.success) loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to trigger cutoff');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading station layout...</div>;
  }

  if (!station) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-300">Station Not Found</p>
        <button onClick={() => router.push('/stations')} className="text-xs text-emerald-400 underline">
          Back to Stations
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Nav */}
      <button
        onClick={() => router.push('/stations')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Stations</span>
      </button>

      {/* Main Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-dark-900 shadow-lg shadow-teal-500/20">
            <Building2 className="w-8 h-8 text-dark-900" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {station.name}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Location: {station.location} ({station.latitude}, {station.longitude})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRecommendSwap}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Recommend Swap Battery</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleAddDock}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dock Bay</span>
            </button>
          )}
        </div>
      </div>

      {/* Recommendation Banner if active */}
      {recommendation && (
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold text-sm">Optimal Swap Recommendation Found!</h3>
          </div>
          <p className="text-xs text-slate-300">
            Recommended Battery: <strong className="font-mono text-white">{recommendation.recommendedBattery?.serialNumber}</strong> (SOH: {recommendation.recommendedBattery?.sohPercentage}%, SOC: {recommendation.recommendedBattery?.socPercentage}%) docked at <strong className="text-emerald-400">Dock #{recommendation.dockNumber || recommendation.dockId}</strong>.
          </p>
        </div>
      )}

      {/* Dock Bays Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-teal-400" />
          <span>Docking Bays ({station.docks?.length || 0})</span>
        </h2>

        {(!station.docks || station.docks.length === 0) ? (
          <div className="py-12 glass-panel rounded-2xl text-center text-xs text-slate-500">
            No docking bays installed for this station.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {station.docks.map((dock) => (
              <div
                key={dock.id}
                className={`glass-panel p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                  dock.isThermalCutoff ? 'border-rose-500/50 bg-rose-950/20 pulse-critical' : 'border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-200">Dock #{dock.dockNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      dock.isThermalCutoff ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      dock.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                    }`}>
                      {dock.isThermalCutoff ? 'CUTOFF ACTIVE' : dock.status}
                    </span>
                  </div>

                  {dock.battery ? (
                    <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-emerald-400">{dock.battery.serialNumber}</span>
                        <span className="text-[10px] text-slate-400">{dock.battery.model}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>SOC: <strong>{dock.battery.socPercentage}%</strong></span>
                        <span>SOH: <strong>{dock.battery.sohPercentage}%</strong></span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                      Empty Dock Bay
                    </div>
                  )}
                </div>

                {/* Dock Actions */}
                {isAdmin && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    {!dock.battery ? (
                      <button
                        onClick={() => setSelectedDockId(dock.id)}
                        className="w-full py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition flex items-center justify-center gap-1.5"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Insert Battery</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRemoveBattery(dock.id)}
                        disabled={actionLoading}
                        className="w-full py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-xs font-semibold border border-amber-500/30 transition flex items-center justify-center gap-1.5"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Eject Battery</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleTriggerCutoff(dock.id)}
                      disabled={actionLoading}
                      className="w-full py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-[11px] font-medium border border-rose-500/30 transition flex items-center justify-center gap-1"
                    >
                      <Flame className="w-3 h-3" />
                      <span>{dock.isThermalCutoff ? 'Reset Cutoff' : 'Thermal Cutoff'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insert Battery Modal */}
      {selectedDockId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white">Insert Battery Pack into Dock</h2>
            <form onSubmit={handleInsertBattery} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Select Battery Pack</label>
                <select
                  required
                  value={selectedBatteryId}
                  onChange={(e) => setSelectedBatteryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Battery --</option>
                  {availableBatteries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.serialNumber} (SOC: {b.socPercentage}%, SOH: {b.sohPercentage}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDockId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                >
                  {actionLoading ? 'Inserting...' : 'Confirm Insertion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
