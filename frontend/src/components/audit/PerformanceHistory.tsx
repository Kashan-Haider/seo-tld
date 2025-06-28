import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';

// Add a simple hook for media query
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-blue/90 border border-accent-blue rounded-lg p-3 text-white shadow-xl min-w-[120px] text-xs md:text-sm">
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

// Custom legend styled like the reference image, but with dashboard accent colors
const CustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex gap-4 items-center mt-2 mb-4 justify-end pr-4">
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ background: entry.color, opacity: 0.9 }}></span>
          <span className="text-xs md:text-sm font-semibold text-white/80">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

interface PerformanceHistoryProps {
  chartData: any[];
  allAudits: any[];
}

const PerformanceHistory: React.FC<PerformanceHistoryProps> = ({ chartData, allAudits }) => {
  const isMobile = useIsMobile();
  const chartHeight = isMobile ? 220 : 340;
  const xTickFontSize = isMobile ? 10 : 12;
  const yTickFontSize = isMobile ? 10 : 12;
  const xTickAngle = isMobile ? 0 : -20;
  const xTickHeight = isMobile ? 30 : 50;

  return (
    <div className="w-full bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl shadow-xl border border-white/10 p-0 flex flex-col mt-8 relative overflow-hidden">
      <div className="relative z-10">
        <div className="text-accent-blue font-bold text-base md:text-xl mb-4 flex items-center gap-3 px-4 pt-6">
          <TrendingUp className="text-accent-blue w-5 h-5 md:w-6 md:h-6" />
          Performance Score & Audit History
        </div>
        <div className="w-full px-1 md:px-4 pb-6">
          <div className="rounded-xl border border-white/10 bg-dark-blue/60 p-2 md:p-4 shadow-sm">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={chartHeight}>
                <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.08}/>
                    </linearGradient>
                    <linearGradient id="colorMobile" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.28}/>
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.07}/>
                    </linearGradient>
                    <linearGradient id="colorDesktop" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.28}/>
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.07}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222b45" vertical={false} />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#22d3ee" 
                    fontSize={xTickFontSize} 
                    angle={xTickAngle} 
                    height={xTickHeight} 
                    tick={{ fill: '#a3aed6', fontWeight: 600 }} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#22d3ee" 
                    fontSize={yTickFontSize} 
                    tick={{ fill: '#a3aed6', fontWeight: 600 }} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, fill: '#3b82f6', fillOpacity: 0.07 }} />
                  <Legend content={<CustomLegend />} />
                  <Area 
                    type="monotone" 
                    dataKey="desktop_performance_score" 
                    stroke="#7c3aed" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorDesktop)" 
                    name="Desktop Score"
                    dot={false}
                    activeDot={false}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="mobile_performance_score" 
                    stroke="#22d3ee" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorMobile)" 
                    name="Mobile Score"
                    dot={false}
                    activeDot={false}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="overall_score" 
                    stroke="#3b82f6" 
                    strokeWidth={3.5} 
                    fillOpacity={1} 
                    fill="url(#colorOverall)" 
                    name="Overall Score"
                    dot={false}
                    activeDot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/80">No data available</div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto px-1 md:px-8 pb-8 custom-scrollbar">
          <div className="bg-gradient-to-r from-dark-blue/60 to-medium-blue/30 rounded-2xl border border-white/10 backdrop-blur-sm overflow-hidden">
            {allAudits.length > 0 ? (
              <table className="min-w-full text-left text-white text-xs md:text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-dark-blue/60 to-medium-blue/30 border-b border-white/10">
                    <th className="py-3 md:py-4 px-2 md:px-4 font-semibold text-accent-blue">Date</th>
                    <th className="py-3 md:py-4 px-2 md:px-4 font-semibold text-accent-blue">URL</th>
                    <th className="py-3 md:py-4 px-2 md:px-4 font-semibold text-neon-cyan">Mobile</th>
                    <th className="py-3 md:py-4 px-2 md:px-4 font-semibold text-light-purple">Desktop</th>
                    <th className="py-3 md:py-4 px-2 md:px-4 font-semibold text-accent-blue">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {allAudits.map((audit, index) => (
                    <tr 
                      key={audit.id} 
                      className={`border-b border-white/10 hover:bg-accent-blue/5 transition-all duration-300 ${
                        index % 2 === 0 ? 'bg-dark-blue/20' : 'bg-transparent'
                      }`}
                    >
                      <td className="py-2 md:py-3 px-2 md:px-4 whitespace-nowrap text-white/90">
                        {chartData[index]?.timestamp}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 max-w-[120px] md:max-w-[180px] truncate text-white/90">
                        {audit.url}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-neon-cyan/20 text-neon-cyan text-xs font-medium">
                          {audit.mobile_performance_score}
                        </span>
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-light-purple/20 text-light-purple text-xs font-medium">
                          {audit.desktop_performance_score}
                        </span>
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-accent-blue/20 text-accent-blue text-xs font-medium">
                          {audit.overall_score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center h-full text-white/80">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceHistory;