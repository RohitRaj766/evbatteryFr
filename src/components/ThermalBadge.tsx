import React from 'react';
import { AlertTriangle, ShieldCheck, Flame } from 'lucide-react';
import { AlarmLevel } from '@/types';

interface ThermalBadgeProps {
  level?: AlarmLevel | 'SAFE';
  temperature?: number;
  showIcon?: boolean;
}

export const ThermalBadge: React.FC<ThermalBadgeProps> = ({ level = 'SAFE', temperature, showIcon = true }) => {
  let badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let Icon = ShieldCheck;

  if (level === 'CRITICAL' || (temperature && temperature >= 55)) {
    badgeStyle = 'bg-rose-500/20 text-rose-400 border-rose-500/40 pulse-critical';
    Icon = Flame;
  } else if (level === 'WARNING' || (temperature && temperature >= 45)) {
    badgeStyle = 'bg-amber-500/20 text-amber-400 border-amber-500/40 pulse-warning';
    Icon = AlertTriangle;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}>
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span>
        {temperature ? `${temperature.toFixed(1)}°C` : level}
      </span>
    </span>
  );
};
