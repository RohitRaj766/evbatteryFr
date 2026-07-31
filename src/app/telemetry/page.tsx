'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  Send,
  Flame,
  Zap,
  BatteryCharging,
  Cpu,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { Battery, Station, TelemetryReading } from '@/types';
import { ThermalBadge } from '@/components/ThermalBadge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TelemetryPage() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [selectedBatteryId, setSelectedBatteryId] = useState('');
  const [dockId, setDockId] = useState('');
  
  // Telemetry Input Parameters
  const [temperatureCelsius, setTemperatureCelsius] = useState(32.5);
  const [voltageVolts, setVoltageVolts] = useState(52.4);
  const [currentAmperes, setCurrentAmperes] = useState(15.0);
  const [socPercentage, setSocPercentage] = useState(85);
  const [sohPercentage, setSohPercentage] = useState(96);

  const [history, setHistory] = useState<TelemetryReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    const fetchBatteries = async () => {
      try {
        const res = await api.batteries.list();
        if (res.success && res.data && res.data.length > 0) {
          setBatteries(res.data);
          setSelectedBatteryId(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBatteries();
  }, []);

  const loadHistory = async (batId: string) => {
    if (!batId) return;
    setLoading(true);
    try {
      const res = await api.telemetry.getHistory(batId, 50);
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBatteryId) {
      loadHistory(selectedBatteryId);
      const sel = batteries.find(b => b.id === selectedBatteryId);
      if (sel) {
        setSocPercentage(sel.socPercentage);
        setSohPercentage(sel.sohPercentage);
        if (sel.currentDockId) setDockId(sel.currentDockId);
      }
    }
  }, [selectedBatteryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatteryId) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await api.telemetry.ingest({
        batteryId: selectedBatteryId,
        dockId: dockId || undefined,
        temperatureCelsius: Number(temperatureCelsius),
        voltageVolts: Number(voltageVolts),
        currentAmperes: Number(currentAmperes),
        socPercentage: Number(socPercentage),
        sohPercentage: Number(sohPercentage),
      });

      if (res.success) {
        setFeedback({ type: 'success', msg: 'Telemetry reading successfully ingested by thermal engine!' });
        loadHistory(selectedBatteryId);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.response?.data?.message || 'Failed to ingest telemetry' });
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
            <Activity className="w-7 h-7 text-emerald-400" />
            <span>Dock Telemetry & Thermal Engine Simulator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate dock sensor streams, test high temperature triggers, and verify real-time thermal alarms.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensor Controls Form */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base">Sensor Stream Generator</h2>
          </div>

          {feedback && (
            <div className={`p-3 rounded-xl border text-xs font-medium ${
              feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {feedback.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Target Battery Pack</label>
              <select
                required
                value={selectedBatteryId}
                onChange={(e) => setSelectedBatteryId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              >
                {batteries.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.serialNumber} ({b.model})
                  </option>
                ))}
              </select>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  Temperature (°C)
                </span>
                <ThermalBadge temperature={temperatureCelsius} />
              </div>
              <input
                type="range"
                min="15"
                max="85"
                step="0.5"
                value={temperatureCelsius}
                onChange={(e) => setTemperatureCelsius(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>15°C (Safe)</span>
                <span>45°C (Warning)</span>
                <span>60°C (Critical Alert)</span>
              </div>
            </div>

            {/* Voltage */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Voltage (Volts)</label>
              <input
                type="number"
                step="0.1"
                required
                value={voltageVolts}
                onChange={(e) => setVoltageVolts(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Current */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Current (Amperes)</label>
              <input
                type="number"
                step="0.1"
                required
                value={currentAmperes}
                onChange={(e) => setCurrentAmperes(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* SOC & SOH */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">SOC (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={socPercentage}
                  onChange={(e) => setSocPercentage(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">SOH (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={sohPercentage}
                  onChange={(e) => setSohPercentage(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Transmitting...' : 'Ingest Sensor Data'}</span>
            </button>
          </form>
        </div>

        {/* Telemetry Visualizations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span>Live Time-Series Chart</span>
              </h2>
              <button
                onClick={() => loadHistory(selectedBatteryId)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">
                No telemetry history for selected battery. Use simulator on left to transmit readings.
              </div>
            ) : (
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2738" />
                    <XAxis dataKey="timestamp" stroke="#64748B" tickFormatter={(t) => new Date(t).toLocaleTimeString()} fontSize={10} />
                    <YAxis yAxisId="temp" orientation="left" stroke="#EF4444" domain={[10, 90]} fontSize={10} label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: '#EF4444' }} />
                    <YAxis yAxisId="volt" orientation="right" stroke="#10B981" domain={[30, 70]} fontSize={10} label={{ value: 'Voltage (V)', angle: 90, position: 'insideRight', fill: '#10B981' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#131926', borderColor: '#2A364F', borderRadius: '12px', fontSize: '12px' }} />
                    <Line yAxisId="temp" type="monotone" dataKey="temperatureCelsius" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} name="Temp (°C)" />
                    <Line yAxisId="volt" type="monotone" dataKey="voltageVolts" stroke="#10B981" strokeWidth={2} dot={false} name="Voltage (V)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Telemetry Stream Log Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-3">
            <h3 className="font-bold text-sm text-slate-200">Raw Sensor Log Stream</h3>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 font-medium uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Temp</th>
                    <th className="py-2 px-3">Voltage</th>
                    <th className="py-2 px-3">Current</th>
                    <th className="py-2 px-3">SOC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {history.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-400">{t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : 'N/A'}</td>
                      <td className="py-2 px-3">
                        <ThermalBadge temperature={t.temperatureCelsius ?? (t as any).temperature ?? 25} showIcon={false} />
                      </td>
                      <td className="py-2 px-3 text-slate-300">{(t.voltageVolts ?? (t as any).voltage ?? 0).toFixed(1)}V</td>
                      <td className="py-2 px-3 text-slate-300">{(t.currentAmperes ?? (t as any).current ?? 0).toFixed(1)}A</td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">{t.socPercentage ?? (t as any).soc ?? 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
