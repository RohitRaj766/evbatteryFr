'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  Flame,
  VolumeX,
  CheckCircle2,
  Filter,
  RefreshCw,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { api } from '@/lib/api';
import { Alarm, AlarmLevel, AlarmStatus } from '@/types';
import { ThermalBadge } from '@/components/ThermalBadge';
import { useAuth } from '@/context/AuthContext';

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { hasRole } = useAuth();
  const isAdmin = hasRole(['ADMIN']);
  const isOperator = hasRole(['ADMIN', 'OPERATOR']);

  const loadAlarms = async () => {
    setLoading(true);
    try {
      const res = await api.alarms.list({ level: levelFilter || undefined, status: statusFilter || undefined });
      if (res.success) {
        setAlarms(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlarms();
  }, [levelFilter, statusFilter]);

  const handleSilence = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await api.alarms.silence(id);
      if (res.success) loadAlarms();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to silence alarm');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await api.alarms.resolve(id);
      if (res.success) loadAlarms();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resolve alarm (Requires ADMIN role)');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <AlertOctagon className="w-7 h-7 text-rose-400" />
            <span>Thermal Safety Alarms Command Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time thermal overrun alerts, audible buzzer suppression, and physical inspection resolution log.
          </p>
        </div>

        <button
          onClick={loadAlarms}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-300">Filter by Level:</span>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Levels</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="TRIGGERED">TRIGGERED</option>
            <option value="SILENCED">SILENCED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Alarms List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading thermal alarms...</div>
        ) : alarms.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
            <p className="text-sm font-semibold text-slate-300">No Thermal Alarms Matching Filter</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {alarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  alarm.alarmLevel === 'CRITICAL' && alarm.status === 'TRIGGERED'
                    ? 'bg-rose-950/20 pulse-critical'
                    : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <ThermalBadge level={alarm.alarmLevel} temperature={alarm.temperatureCelsius} />
                    <span className="font-mono font-bold text-sm text-slate-200">
                      Battery: {alarm.battery?.serialNumber || alarm.batteryId}
                    </span>
                    {alarm.station && (
                      <span className="text-xs text-teal-400 font-medium">
                        Station: {alarm.station.name}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      alarm.status === 'TRIGGERED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      alarm.status === 'SILENCED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {alarm.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{alarm.message}</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Triggered: {new Date(alarm.createdAt).toLocaleString()}</span>
                  </p>
                </div>

                {/* Alarm Action Buttons */}
                <div className="flex items-center gap-2 self-start md:self-auto">
                  {alarm.status === 'TRIGGERED' && isOperator && (
                    <button
                      onClick={() => handleSilence(alarm.id)}
                      disabled={actionLoading === alarm.id}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-xs font-semibold border border-amber-500/30 transition flex items-center gap-1.5"
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Silence Alarm</span>
                    </button>
                  )}

                  {alarm.status !== 'RESOLVED' && isOperator && (
                    <button
                      onClick={() => handleResolve(alarm.id)}
                      disabled={actionLoading === alarm.id}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolve Alarm</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
