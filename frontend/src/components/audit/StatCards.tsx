import React from 'react';
import { TrendingUp, Smartphone, Monitor, Zap, Clock, Activity } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  trend?: 'up' | 'down';
  trendValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, trend, trendValue }) => (
  <div className={`flex flex-col items-start justify-between bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl border border-white/10 p-4 min-w-[180px] w-full`} >
    <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-white/60 font-semibold">{label}</span></div>
    <div className="flex items-end gap-2">
      <span className="text-2xl font-bold text-white">{value}</span>
      {trend && <span className={`text-xs font-bold ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>{trend === 'up' ? '▲' : '▼'} {trendValue}</span>}
    </div>
  </div>
);

interface StatCardsProps {
  latestAudit: any;
  secondLatestAudit?: any;
}

// Helper function to calculate trend
const calculateTrend = (current: number, previous: number): { trend: 'up' | 'down', trendValue: string } | null => {
  if (previous === null || previous === undefined || current === null || current === undefined) {
    return null;
  }
  
  const difference = current - previous;
  const percentageChange = ((difference / previous) * 100);
  
  return {
    trend: difference >= 0 ? 'up' : 'down',
    trendValue: `${difference >= 0 ? '+' : ''}${percentageChange.toFixed(1)}%`
  };
};

const StatCards: React.FC<StatCardsProps> = ({ latestAudit, secondLatestAudit }) => {
  const stats = latestAudit ? [
    {
      icon: <TrendingUp size={22} className="text-accent-blue" />, 
      label: 'Overall Score', 
      value: latestAudit.overall_score, 
      color: '#3b82f6', 
      ...calculateTrend(latestAudit.overall_score, secondLatestAudit?.overall_score)
    },
    {
      icon: <Smartphone size={22} className="text-neon-cyan" />, 
      label: 'Mobile Score', 
      value: latestAudit.mobile_performance_score, 
      color: '#22d3ee', 
      ...calculateTrend(latestAudit.mobile_performance_score, secondLatestAudit?.mobile_performance_score)
    },
    {
      icon: <Monitor size={22} className="text-light-purple" />, 
      label: 'Desktop Score', 
      value: latestAudit.desktop_performance_score, 
      color: '#7c3aed', 
      ...calculateTrend(latestAudit.desktop_performance_score, secondLatestAudit?.desktop_performance_score)
    },
    {
      icon: <Zap size={22} className="text-accent-blue" />, 
      label: 'FCP (Mobile)', 
      value: latestAudit.pagespeed_data?.mobile?.fcp + 's', 
      color: '#3b82f6',
      ...calculateTrend(latestAudit.pagespeed_data?.mobile?.fcp, secondLatestAudit?.pagespeed_data?.mobile?.fcp)
    },
    {
      icon: <Clock size={22} className="text-light-purple" />, 
      label: 'LCP (Mobile)', 
      value: latestAudit.pagespeed_data?.mobile?.lcp + 's', 
      color: '#7c3aed',
      ...calculateTrend(latestAudit.pagespeed_data?.mobile?.lcp, secondLatestAudit?.pagespeed_data?.mobile?.lcp)
    },
    {
      icon: <Activity size={22} className="text-accent-blue" />, 
      label: 'CLS (Mobile)', 
      value: latestAudit.pagespeed_data?.mobile?.cls, 
      color: '#3b82f6',
      ...calculateTrend(latestAudit.pagespeed_data?.mobile?.cls, secondLatestAudit?.pagespeed_data?.mobile?.cls)
    },
  ] : [];

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
      {stats.map((stat, idx) => (
        <StatCard key={idx} {...stat} />
      ))}
    </div>
  );
};

export default StatCards; 