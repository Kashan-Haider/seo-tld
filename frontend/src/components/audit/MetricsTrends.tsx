import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Smartphone, Monitor } from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-blue/90 border border-accent-blue rounded-lg p-3 text-white shadow-xl">
        <div className="font-bold text-accent-blue mb-1">{label}</div>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: entry.color }}></span>
            <span className="font-semibold">{entry.name}:</span>
            <span>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface MetricsTrendsProps {
  chartData: any[];
}

const MetricsTrends: React.FC<MetricsTrendsProps> = ({ chartData }) => {
  return (
    <div className="col-span-1 flex flex-col gap-8">
      {/* Mobile Metrics Trends */}
      <div className="bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col">
        <div className="text-accent-blue font-bold text-lg mb-4 flex items-center gap-2">
          <Smartphone className="text-accent-blue" /> Mobile Metrics Trends
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222b45" />
            <XAxis dataKey="timestamp" stroke="#A259FF" fontSize={12} angle={-20} height={60} tick={{ fill: '#a3aed6' }} />
            <YAxis stroke="#00C9FF" fontSize={12} tick={{ fill: '#a3aed6' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" />
            <Line type="monotone" dataKey="fcp_mobile" stroke="#00C9FF" strokeWidth={2} name="FCP (s)" />
            <Line type="monotone" dataKey="lcp_mobile" stroke="#A259FF" strokeWidth={2} name="LCP (s)" />
            <Line type="monotone" dataKey="cls_mobile" stroke="#FF7A59" strokeWidth={2} name="CLS" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Desktop Metrics Trends */}
      <div className="bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col">
        <div className="text-light-purple font-bold text-lg mb-4 flex items-center gap-2">
          <Monitor className="text-light-purple" /> Desktop Metrics Trends
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222b45" />
            <XAxis dataKey="timestamp" stroke="#A259FF" fontSize={12} angle={-20} height={60} tick={{ fill: '#a3aed6' }} />
            <YAxis stroke="#00C9FF" fontSize={12} tick={{ fill: '#a3aed6' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" />
            <Line type="monotone" dataKey="fcp_desktop" stroke="#A259FF" strokeWidth={2} name="FCP (s)" />
            <Line type="monotone" dataKey="lcp_desktop" stroke="#00C9FF" strokeWidth={2} name="LCP (s)" />
            <Line type="monotone" dataKey="cls_desktop" stroke="#FF7A59" strokeWidth={2} name="CLS" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricsTrends; 