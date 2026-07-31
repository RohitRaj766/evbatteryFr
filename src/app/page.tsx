'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BatteryCharging,
  Building2,
  AlertOctagon,
  Repeat,
  Flame,
  Activity,
  ArrowRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { ThermalBadge } from '@/components/ThermalBadge';
import { api } from '@/lib/api';
import { Battery, Station, Alarm, Swap } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);

  const isDriver = user?.role === 'DRIVER';

  const fetchData = async () => {
    try {
      const [batRes, stRes, alRes, swRes] = await Promise.all([
        api.batteries.list(),
        api.stations.list(),
        api.alarms.list(),
        api.swaps.list(),
      ]);

      if (batRes.success) setBatteries(batRes.data || []);
      if (stRes.success) setStations(stRes.data || []);
      if (alRes.success) setAlarms(alRes.data || []);
      if (swRes.success) setSwaps(swRes.data || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeAlarms = alarms.filter(a => a.status !== 'RESOLVED');
  const criticalAlarms = activeAlarms.filter(a => a.alarmLevel === 'CRITICAL');
  const readyBatteries = batteries.filter(b => b.status === 'READY');
  const activeStations = stations.filter(s => s.isActive);
  const mySwaps = isDriver ? swaps.filter(s => s.driverId === user?.id || s.driver?.email === user?.email) : swaps;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>{isDriver ? 'Driver Portal Active' : 'Thermal Safety Monitoring Live'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isDriver ? `Welcome, ${user?.name || 'Driver'}!` : 'EV Battery Operations & Safety Hub'}
          </h1>
          <p className="text-sm text-slate-400">
            {isDriver
              ? 'Find active swap stations near you, view ready charged battery packs, and manage your battery exchanges.'
              : 'Real-time battery health, thermal safety triggers, station docks & automated swapping.'}
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          {!isDriver && (
            <Link
              href="/telemetry"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Simulate Telemetry</span>
            </Link>
          )}
          <Link
            href="/stations"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            <Building2 className="w-4 h-4 text-teal-400" />
            <span>Find Stations</span>
          </Link>
          <Link
            href="/swaps"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition"
          >
            <Repeat className="w-4 h-4" />
            <span>Perform Swap</span>
          </Link>
        </div>
      </div>

      {/* Critical Alarm Alert Notice (Operator & Admin only) */}
      {!isDriver && criticalAlarms.length > 0 && (
        <div className="glass-card p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 pulse-critical flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-rose-400 text-sm">
                CRITICAL Thermal Risk Detected ({criticalAlarms.length} Active)
              </h3>
              <p className="text-xs text-rose-300/80">
                Batteries exceed thermal thresholds. Automatic cutoff activated on impacted docks.
              </p>
            </div>
          </div>
          <Link
            href="/alarms"
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
          >
            Inspect Alarms
          </Link>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Ready Battery Packs"
          value={readyBatteries.length}
          subtext="Fully charged & tested"
          icon={BatteryCharging}
          color="emerald"
        />
        <StatCard
          title="Active Swap Stations"
          value={activeStations.length}
          subtext="Available stations"
          icon={Building2}
          color="teal"
        />
        <StatCard
          title={isDriver ? "My Swap History" : "Total Swaps Processed"}
          value={mySwaps.length}
          subtext={isDriver ? "Swaps under your vehicle" : "System swap count"}
          icon={Repeat}
          color="indigo"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Driver Swap Log OR Thermal Incidents */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDriver ? <Repeat className="w-5 h-5 text-indigo-400" /> : <AlertOctagon className="w-5 h-5 text-amber-400" />}
              <h2 className="font-bold text-slate-100 text-base">
                {isDriver ? "My Swaps Log History" : "Recent Thermal Incidents"}
              </h2>
            </div>
            <Link href={isDriver ? "/swaps" : "/alarms"} className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-slate-500 py-6 text-center">Loading data...</p>
          ) : isDriver ? (
            mySwaps.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
                <p className="text-sm font-semibold text-slate-300">No Swap History Yet</p>
                <p className="text-xs text-slate-500">Perform your first battery exchange at any station.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {mySwaps.slice(0, 5).map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{s.station?.name || 'Station'}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          {(s as any).driverVehicleId || 'DL-01-EV-4821'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Returned: <strong className="font-mono text-amber-400">{s.oldBattery?.serialNumber || s.oldBatteryId}</strong> | Issued: <strong className="font-mono text-emerald-400">{s.newBattery?.serialNumber || s.newBatteryId}</strong>
                      </p>
                    </div>

                    <div className="text-right space-y-0.5 font-mono text-xs text-slate-400">
                      <p>{new Date(s.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-500">{new Date(s.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            alarms.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
                <p className="text-sm font-semibold text-slate-300">All Thermal Sensors Safe</p>
                <p className="text-xs text-slate-500">No thermal threshold overruns recorded.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {alarms.slice(0, 5).map((alarm) => (
                  <div key={alarm.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-200">
                          {alarm.battery?.serialNumber || alarm.batteryId}
                        </span>
                        <ThermalBadge level={alarm.alarmLevel} temperature={alarm.temperatureCelsius} />
                      </div>
                      <p className="text-xs text-slate-400">{alarm.message}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        alarm.status === 'TRIGGERED' ? 'bg-rose-500/20 text-rose-400' :
                        alarm.status === 'SILENCED' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {alarm.status}
                      </span>
                      <p className="text-[10px] text-slate-500">{new Date(alarm.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Right Column: All Stations & Docks View for Drivers */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-400" />
              <h2 className="font-bold text-slate-100 text-base">Swapping Stations & Docks</h2>
            </div>
            <Link href="/stations" className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium">
              View Docks <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-slate-500 py-6 text-center">Loading stations...</p>
          ) : stations.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No stations configured.</p>
          ) : (
            <div className="space-y-3">
              {stations.map((st) => (
                <div key={st.id} className="glass-card p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs text-slate-200">{st.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {st.availableDocks} / {st.totalDocks} Docks Avail
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{st.location}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
