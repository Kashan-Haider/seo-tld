import React from 'react';
import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
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

const AuditPerformanceChart: React.FC<{ chartData: any[] }> = ({ chartData }) => (
  <div className="col-span-2 bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col">
    <div className="text-accent-blue font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp className="text-accent-blue" /> Performance Score History</div>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 30, right: 40, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorMobile" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorDesktop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a259ff" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#a259ff" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#222b45" />
        <XAxis
          dataKey="timestamp"
          stroke="#A259FF"
          fontSize={14}
          angle={-15}
          height={60}
          tick={{ fill: '#a3aed6', fontWeight: 600 }}
          tickLine={false}
          axisLine={{ stroke: '#3b82f6', strokeWidth: 2 }}
        />
        <YAxis
          stroke="#00C9FF"
          fontSize={14}
          tick={{ fill: '#a3aed6', fontWeight: 600 }}
          tickLine={false}
          axisLine={{ stroke: '#3b82f6', strokeWidth: 2 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" wrapperStyle={{ color: '#fff', fontWeight: 700, fontSize: 16, paddingBottom: 8 }} />
        <Area
          type="monotone"
          dataKey="overall"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorOverall)"
          name="Overall Score"
          strokeWidth={4}
          dot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          activeDot={{ r: 8 }}
        />
        <Area
          type="monotone"
          dataKey="mobile"
          stroke="#22d3ee"
          fillOpacity={0.7}
          fill="url(#colorMobile)"
          name="Mobile Score"
          strokeWidth={3}
          dot={{ r: 5, fill: '#22d3ee', stroke: '#fff', strokeWidth: 2 }}
          activeDot={{ r: 7 }}
        />
        <Area
          type="monotone"
          dataKey="desktop"
          stroke="#a259ff"
          fillOpacity={0.7}
          fill="url(#colorDesktop)"
          name="Desktop Score"
          strokeWidth={3}
          dot={{ r: 5, fill: '#a259ff', stroke: '#fff', strokeWidth: 2 }}
          activeDot={{ r: 7 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export default AuditPerformanceChart; 