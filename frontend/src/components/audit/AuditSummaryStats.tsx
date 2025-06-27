import React from 'react';
import type { Stat } from '../../typing';

const StatCard = ({ icon, label, value, color, trend, trendValue }: Stat) => (
  <div className={`flex flex-col items-start justify-between bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl shadow-xl border border-white/10 p-4 min-w-[180px] w-full`} style={{ boxShadow: `0 4px 24px 0 ${color}40` }}>
    <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-white/60 font-semibold">{label}</span></div>
    <div className="flex items-end gap-2">
      <span className="text-2xl font-bold text-white">{value}</span>
      {trend && <span className={`text-xs font-bold ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>{trend === 'up' ? '▲' : '▼'} {trendValue}</span>}
    </div>
  </div>
);

const AuditSummaryStats: React.FC<{ stats: Stat[] }> = ({ stats }) => (
  <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
    {stats.map((stat, idx) => (
      <StatCard key={idx} {...stat} />
    ))}
  </div>
);

export default AuditSummaryStats; 