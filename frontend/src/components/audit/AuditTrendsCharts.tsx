import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Smartphone, Monitor } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue border border-accent-blue rounded-xl p-4 text-white shadow-2xl animate-fade-in">
        <div className="font-bold text-accent-blue mb-2 text-lg">{label}</div>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center gap-3 mb-1">
            <span className="w-4 h-4 rounded-full inline-block border-2 border-white shadow" style={{ background: entry.color }}></span>
            <span className="font-semibold text-base">{entry.name}:</span>
            <span className="text-lg">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AnimatedLine = (props: any) => (
  <Line
    {...props}
    isAnimationActive={true}
    animationDuration={1200}
    dot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: props.stroke, className: 'hover:scale-125 transition-transform duration-200' }}
    activeDot={{ r: 9, stroke: '#fff', strokeWidth: 3, fill: props.stroke, className: 'shadow-lg' }}
    strokeWidth={3.5}
    strokeLinecap="round"
    strokeDasharray=""
  />
);

// Helper to format date for XAxis
const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const AuditTrendsCharts: React.FC<{ chartData: any[] }> = ({ chartData }) => (
  <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Mobile Trends */}
    <div className="bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-3xl border border-white/10 shadow-2xl p-8 flex flex-col animate-fade-in">
      <div className="text-accent-blue font-extrabold text-xl mb-6 flex items-center gap-3 drop-shadow"><Smartphone className="text-accent-blue w-6 h-6" /> Mobile Metrics Trends</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 30, right: 40, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fcpMobileGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00C9FF" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#00C9FF" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="lcpMobileGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A259FF" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#A259FF" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="clsMobileGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF7A59" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#FF7A59" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="6 6" stroke="#222b45" />
          <XAxis
            dataKey="timestamp"
            stroke="#A259FF"
            fontSize={16}
            height={50}
            tick={{ fill: '#fff', fontWeight: 700, fontSize: 16, dy: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#A259FF', strokeWidth: 2 }}
            tickFormatter={formatDate}
            angle={0}
          />
          <YAxis stroke="#00C9FF" fontSize={14} tick={{ fill: '#a3aed6', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#00C9FF', strokeWidth: 2 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ color: '#fff', fontWeight: 700, fontSize: 16, paddingBottom: 8 }} />
          <AnimatedLine type="monotone" dataKey="fcp_mobile" stroke="url(#fcpMobileGradient)" name="FCP (s)" />
          <AnimatedLine type="monotone" dataKey="lcp_mobile" stroke="url(#lcpMobileGradient)" name="LCP (s)" />
          <AnimatedLine type="monotone" dataKey="cls_mobile" stroke="url(#clsMobileGradient)" name="CLS" />
        </LineChart>
      </ResponsiveContainer>
    </div>
    {/* Desktop Trends */}
    <div className="bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-3xl border border-white/10 shadow-2xl p-8 flex flex-col animate-fade-in">
      <div className="text-light-purple font-extrabold text-xl mb-6 flex items-center gap-3 drop-shadow"><Monitor className="text-light-purple w-6 h-6" /> Desktop Metrics Trends</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 30, right: 40, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fcpDesktopGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A259FF" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#A259FF" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="lcpDesktopGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00C9FF" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#00C9FF" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="clsDesktopGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF7A59" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#FF7A59" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="6 6" stroke="#222b45" />
          <XAxis
            dataKey="timestamp"
            stroke="#A259FF"
            fontSize={16}
            height={50}
            tick={{ fill: '#fff', fontWeight: 700, fontSize: 16, dy: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#A259FF', strokeWidth: 2 }}
            tickFormatter={formatDate}
            angle={0}
          />
          <YAxis stroke="#00C9FF" fontSize={14} tick={{ fill: '#a3aed6', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#00C9FF', strokeWidth: 2 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ color: '#fff', fontWeight: 700, fontSize: 16, paddingBottom: 8 }} />
          <AnimatedLine type="monotone" dataKey="fcp_desktop" stroke="url(#fcpDesktopGradient)" name="FCP (s)" />
          <AnimatedLine type="monotone" dataKey="lcp_desktop" stroke="url(#lcpDesktopGradient)" name="LCP (s)" />
          <AnimatedLine type="monotone" dataKey="cls_desktop" stroke="url(#clsDesktopGradient)" name="CLS" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default AuditTrendsCharts; 