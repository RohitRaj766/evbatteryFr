'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, ShieldCheck, Tag, Code } from 'lucide-react';
import { api } from '@/lib/api';
import { SystemEnums } from '@/types';

export default function EnumsPage() {
  const [enums, setEnums] = useState<SystemEnums | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnums = async () => {
      try {
        const res = await api.enums.getEnums();
        if (res.success) {
          setEnums(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnums();
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading system enums schema...</div>;
  }

  const sections = [
    { title: 'User Roles', items: enums?.userRoles || [], color: 'emerald' },
    { title: 'Battery Statuses', items: enums?.batteryStatuses || [], color: 'teal' },
    { title: 'Health Statuses', items: enums?.healthStatuses || [], color: 'indigo' },
    { title: 'Dock Statuses', items: enums?.dockStatuses || [], color: 'amber' },
    { title: 'Alarm Levels', items: enums?.alarmLevels || [], color: 'rose' },
    { title: 'Alarm Statuses', items: enums?.alarmStatuses || [], color: 'rose' },
    { title: 'Swap Statuses', items: enums?.swapStatuses || [], color: 'teal' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-dark-900 shadow-lg shadow-emerald-500/20">
          <BookOpen className="w-6 h-6 text-dark-900" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Enums & API Reference</h1>
          <p className="text-xs text-slate-400">Strict domain enumeration values returned by backend API (/api/v1/enums).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((sec) => (
          <div key={sec.title} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-sm text-white">{sec.title}</h2>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {sec.items.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs font-semibold text-emerald-400"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
