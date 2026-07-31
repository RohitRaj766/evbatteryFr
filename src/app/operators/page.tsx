'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Building2,
  Shield,
  Trash2,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { Operator, Station, OperatorAssignment } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Assignment modal state
  const [selectedStationId, setSelectedStationId] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { hasRole } = useAuth();
  const isAdmin = hasRole(['ADMIN']);

  const loadData = async () => {
    setLoading(true);
    try {
      const [opRes, stRes] = await Promise.all([
        api.operators.list(),
        api.stations.list(),
      ]);
      if (opRes.success) setOperators(opRes.data || []);
      if (stRes.success) setStations(stRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStationId || !selectedOperatorId) return;
    setSubmitting(true);
    try {
      const res = await api.assignments.assignToStation(selectedStationId, {
        operatorId: selectedOperatorId,
        isPrimary,
      });

      if (res.success) {
        setShowAssignModal(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign operator');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="py-16 text-center space-y-2">
        <Shield className="w-12 h-12 text-amber-400 mx-auto opacity-70" />
        <h2 className="text-lg font-bold text-white">Admin Authorization Required</h2>
        <p className="text-xs text-slate-400">Operator assignment matrix is restricted to Platform Administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-400" />
            <span>Station Operator Assignments</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage station operators, shift schedules, and primary responsibilities for thermal safety oversight.
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
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Operator to Station</span>
          </button>
        </div>
      </div>

      {/* Operators Grid */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Registered Operators Matrix</h2>
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading operators...</div>
        ) : operators.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No operators registered yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operators.map((op) => (
              <div key={op.id} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    {op.user?.name ? op.user.name[0] : 'O'}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white">{op.user?.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Code: {op.operatorCode}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <span>Assigned Stations:</span>
                  <strong className="text-emerald-400">{op.assignedStationCount || 0}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white">Assign Operator to Station</h2>
            <form onSubmit={handleAssign} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Select Station</label>
                <select
                  required
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Station --</option>
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Select Operator</label>
                <select
                  required
                  value={selectedOperatorId}
                  onChange={(e) => setSelectedOperatorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Operator --</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.user?.name} ({op.operatorCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <label htmlFor="primary" className="text-xs font-medium text-slate-300">
                  Set as Primary Station Lead
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                >
                  {submitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
