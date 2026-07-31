'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BatteryCharging,
  Building2,
  Activity,
  AlertOctagon,
  Repeat,
  Users,
  Shield,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'OPERATOR', 'DRIVER'] },
    { name: 'Stations & Docks', href: '/stations', icon: Building2, roles: ['ADMIN', 'OPERATOR', 'DRIVER'] },
    { name: 'Swaps Log', href: '/swaps', icon: Repeat, roles: ['ADMIN', 'OPERATOR', 'DRIVER'] },
    { name: 'Batteries Fleet', href: '/batteries', icon: BatteryCharging, roles: ['ADMIN', 'OPERATOR'] },
    { name: 'Dock Telemetry', href: '/telemetry', icon: Activity, roles: ['ADMIN', 'OPERATOR'] },
    { name: 'Thermal Alarms', href: '/alarms', icon: AlertOctagon, roles: ['ADMIN', 'OPERATOR'] },
    { name: 'Operators Matrix', href: '/operators', icon: Users, roles: ['ADMIN'] },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col h-screen sticky top-0 z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-dark-900 font-bold shadow-lg shadow-emerald-500/20">
          <BatteryCharging className="w-6 h-6 text-dark-900" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-base leading-tight">VoltSwap Safety</h1>
          <p className="text-xs text-emerald-400 font-medium">EV Thermal Platform</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (user && item.roles && !item.roles.includes(user.role)) {
            return null;
          }

          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Role Footer */}
      {user && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 font-semibold text-sm">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 border border-slate-700 text-emerald-400">
              {user.role}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
