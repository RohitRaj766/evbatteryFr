'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  BatteryCharging,
  Activity,
  ArrowLeft,
  Flame,
  Shield,
  Zap,
  Clock,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/api';
import { Battery, TelemetryReading } from '@/types';
import { ThermalBadge } from '@/components/ThermalBadge';
import { useAuth } from '@/context/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function BatteryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batteryId = params.id as string;

  const [battery, setBattery] = useState<Battery | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryReading[]>([]);
  const [batterySwaps, setBatterySwaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [decommissionReason, setDecommissionReason] = useState('');
  const [showDecommission, setShowDecommission] = useState(false);

  const { hasRole } = useAuth();
  const isAdmin = hasRole(['ADMIN']);

  const loadData = async () => {
    try {
      const [bRes, tRes, sRes] = await Promise.all([
        api.batteries.getById(batteryId),
        api.telemetry.getHistory(batteryId, 30),
        api.swaps.list(),
      ]);
      if (bRes.success) setBattery(bRes.data);
      if (tRes.success) setTelemetry(tRes.data || []);
      if (sRes.success) {
        setBatterySwaps((sRes.data || []).filter((s: any) => s.oldBatteryId === batteryId || s.newBatteryId === batteryId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (batteryId) loadData();
  }, [batteryId]);

  const handleDecommission = async () => {
    if (!decommissionReason) return alert('Please enter decommission reason');
    try {
      const res = await api.batteries.decommission(batteryId, decommissionReason);
      if (res.success) {
        setShowDecommission(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to decommission');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading battery details...</div>;
  }

  if (!battery) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-300">Battery Not Found</p>
        <button onClick={() => router.push('/batteries')} className="text-xs text-emerald-400 underline">
          Back to Batteries
        </button>
      </div>
    );
  }

  const latestTemp = telemetry.length > 0 ? telemetry[telemetry.length - 1].temperatureCelsius : 25;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Nav */}
      <button
        onClick={() => router.push('/batteries')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Battery Fleet</span>
      </button>

      {/* Main Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-dark-900 shadow-lg shadow-emerald-500/20">
            <BatteryCharging className="w-8 h-8 text-dark-900" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono">
                {battery.serialNumber}
              </h1>
              <ThermalBadge temperature={latestTemp} />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Model: {battery.model} | Capacity: {battery.capacityKwh} kWh
            </p>
          </div>
        </div>

        {isAdmin && battery.status !== 'DECOMMISSIONED' && (
          <button
            onClick={() => setShowDecommission(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Decommission Pack</span>
          </button>
        )}
      </div>

      {/* Key Metric Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 uppercase font-semibold">State of Charge (SOC)</p>
          <p className="text-3xl font-extrabold text-slate-100">{battery.socPercentage}%</p>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${battery.socPercentage}%` }}></div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 uppercase font-semibold">State of Health (SOH)</p>
          <p className="text-3xl font-extrabold text-teal-400">{battery.sohPercentage}%</p>
          <p className="text-[11px] text-slate-400">Degradation: {(100 - battery.sohPercentage).toFixed(1)}%</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 uppercase font-semibold">Charge Cycle Count</p>
          <p className="text-3xl font-extrabold text-slate-100">{battery.cycleCount}</p>
          <p className="text-[11px] text-slate-400">Total charge/discharge cycles</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 uppercase font-semibold">Current Docking</p>
          <p className="text-lg font-bold text-slate-100 truncate">
            {battery.currentDock ? `${battery.currentDock.station.name} (Dock #${battery.currentDock.dockNumber})` : 'In Vehicle / Mobile'}
          </p>
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
            {battery.status}
          </span>
        </div>
      </div>

      {/* Telemetry Chart */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Thermal & Voltage Telemetry Chart</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">30 Most Recent Sensor Readings</span>
        </div>

        {telemetry.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No telemetry data recorded for this battery yet. Submit sensor data via the Telemetry tab.
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetry}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2738" />
                <XAxis dataKey="timestamp" stroke="#64748B" tickFormatter={(t) => new Date(t).toLocaleTimeString()} fontSize={10} />
                <YAxis yAxisId="temp" orientation="left" stroke="#EF4444" domain={[20, 80]} fontSize={10} label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: '#EF4444' }} />
                <YAxis yAxisId="volt" orientation="right" stroke="#10B981" domain={[40, 60]} fontSize={10} label={{ value: 'Voltage (V)', angle: 90, position: 'insideRight', fill: '#10B981' }} />
                <Tooltip contentStyle={{ backgroundColor: '#131926', borderColor: '#2A364F', borderRadius: '12px', fontSize: '12px' }} />
                <Line yAxisId="temp" type="monotone" dataKey="temperatureCelsius" stroke="#EF4444" strokeWidth={2} dot={false} name="Temperature (°C)" />
                <Line yAxisId="volt" type="monotone" dataKey="voltageVolts" stroke="#10B981" strokeWidth={2} dot={false} name="Voltage (V)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Battery Location & Transfer Audit Trail */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Battery Location & Transfer Audit Trail</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Chain of Custody Record</span>
        </div>

        {batterySwaps.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No transfer or swap events recorded for this battery pack yet.
          </div>
        ) : (
          <div className="space-y-3">
            {batterySwaps.map((s) => {
              const isSwappedIn = s.newBatteryId === batteryId;
              return (
                <div key={s.id} className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isSwappedIn ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {isSwappedIn ? 'ISSUED TO DRIVER' : 'RETURNED FROM DRIVER'}
                      </span>
                      <span className="text-xs font-semibold text-white">{s.station?.name || 'Station'}</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Driver: <strong className="text-slate-200">{s.driver?.name || s.driverId}</strong> | SOH at Transfer: <span className="text-emerald-400 font-bold">{s.sohAtSwap}%</span>
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-mono">
                    {new Date(s.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decommission Modal */}
      {showDecommission && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-rose-500/30 space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-lg font-bold">Decommission Battery Pack</h2>
            </div>
            <p className="text-xs text-slate-300">
              This action will mark battery <strong className="font-mono">{battery.serialNumber}</strong> as permanently decommissioned due to thermal degradation or safety risk.
            </p>
            <textarea
              rows={3}
              required
              placeholder="Enter decommission reason (e.g. Excessive thermal degradation, cell swelling)..."
              value={decommissionReason}
              onChange={(e) => setDecommissionReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDecommission(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDecommission}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-600/20"
              >
                Confirm Decommission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
