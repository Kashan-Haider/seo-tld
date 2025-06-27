import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { useProjectStore } from '../store/projectStore';
import AuditReportCard from '../components/audit/AuditReportCard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { TrendingUp, Smartphone, Monitor, Zap, Clock, Activity, Bell, User, Search, Mail, Settings } from 'lucide-react';
import NoAudits from './NoAudits';

const StatCard = ({ icon, label, value, color, trend, trendValue }: { icon: React.ReactNode, label: string, value: string | number, color: string, trend?: 'up' | 'down', trendValue?: string }) => (
  <div className={`flex flex-col items-start justify-between bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl shadow-xl border border-white/10 p-4 min-w-[180px] w-full`} style={{ boxShadow: `0 4px 24px 0 ${color}40` }}>
    <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-white/60 font-semibold">{label}</span></div>
    <div className="flex items-end gap-2">
      <span className="text-2xl font-bold text-white">{value}</span>
      {trend && <span className={`text-xs font-bold ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>{trend === 'up' ? '▲' : '▼'} {trendValue}</span>}
    </div>
  </div>
);

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

const ProfileAvatar = () => (
  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-blue via-light-purple to-accent-blue flex items-center justify-center border-2 border-white/10 shadow">
    <User className="text-white" size={24} />
  </div>
);

const Dashboard: React.FC = () => {
  const [latestAudit, setLatestAudit] = useState<any>(null);
  const [allAudits, setAllAudits] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user } = useAuth();
  const { setProjects, selectedProject, projects, setSelectedProject } = useProjectStore();
  const [isGeneratingAudit, setIsGeneratingAudit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('/api/project/all-projects', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch projects');
        const data = await res.json();
        const userProjects = data.filter((p: any) => p.owner_id === user?.id);
        setProjects(userProjects);
      } catch {
      }
    };
    if (user) fetchProjects();
  }, [user, setProjects]);

  useEffect(() => {
    if (selectedProject) {
      const fetchAudits = async () => {
        try {
          const token = localStorage.getItem('access_token');
          console.log(token)
          const res = await fetch(`/api/audit/get-all-audits/${selectedProject.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (res.ok) {
            const data = await res.json();
            setAllAudits(data);
            setLatestAudit(data[0] || null);
          } else {
            setAllAudits([]);
            setLatestAudit(null);
          }
        } catch {
          setAllAudits([]);
          setLatestAudit(null);
        }
      };
      fetchAudits();
    }
  }, [selectedProject]);

  // Prepare chart data
  const chartData = allAudits.map(audit => ({
    timestamp: new Date(audit.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    overall: audit.overall_score,
    mobile: audit.mobile_performance_score,
    desktop: audit.desktop_performance_score,
    fcp_mobile: audit.pagespeed_data?.mobile?.fcp,
    lcp_mobile: audit.pagespeed_data?.mobile?.lcp,
    cls_mobile: audit.pagespeed_data?.mobile?.cls,
    fid_mobile: audit.pagespeed_data?.mobile?.fid,
    ttfb_mobile: audit.pagespeed_data?.mobile?.ttfb,
    fcp_desktop: audit.pagespeed_data?.desktop?.fcp,
    lcp_desktop: audit.pagespeed_data?.desktop?.lcp,
    cls_desktop: audit.pagespeed_data?.desktop?.cls,
    fid_desktop: audit.pagespeed_data?.desktop?.fid,
    ttfb_desktop: audit.pagespeed_data?.desktop?.ttfb,
  }));

  // Stat cards for the latest audit
  const stats = latestAudit ? [
    {
      icon: <TrendingUp size={22} className="text-accent-blue" />, label: 'Overall Score', value: latestAudit.overall_score, color: '#3b82f6', trend: "up" as const, trendValue: '+2.1%'
    },
    {
      icon: <Smartphone size={22} className="text-neon-cyan" />, label: 'Mobile Score', value: latestAudit.mobile_performance_score, color: '#22d3ee', trend: "up" as const, trendValue: '+1.2%'
    },
    {
      icon: <Monitor size={22} className="text-light-purple" />, label: 'Desktop Score', value: latestAudit.desktop_performance_score, color: '#7c3aed', trend: "down" as const, trendValue: '-0.8%'
    },
    {
      icon: <Zap size={22} className="text-accent-blue" />, label: 'FCP (Mobile)', value: latestAudit.pagespeed_data?.mobile?.fcp + 's', color: '#3b82f6'
    },
    {
      icon: <Clock size={22} className="text-light-purple" />, label: 'LCP (Mobile)', value: latestAudit.pagespeed_data?.mobile?.lcp + 's', color: '#7c3aed'
    },
    {
      icon: <Activity size={22} className="text-accent-blue" />, label: 'CLS (Mobile)', value: latestAudit.pagespeed_data?.mobile?.cls, color: '#3b82f6'
    },
  ] : [];

  const handleGenerateAudit = async () => {
    try {
      setIsGeneratingAudit(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      if (!selectedProject) throw new Error('No project selected');
      console.log("audit requested")
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: selectedProject.id,
          audit_type: 'full',
          url: selectedProject.website_url,
        }),
      });
      if (!res.ok) throw new Error('Failed to generate audit');
      // Wait a moment for backend to process and DB to update
      await new Promise(r => setTimeout(r, 1200));
      // Refetch audits
      const auditsRes = await fetch(`/api/audit/get-all-audits/${selectedProject.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (auditsRes.ok) {
      console.log("audit completed")
        const data = await auditsRes.json();
        setAllAudits(data);
        setLatestAudit(data[0] || null);
      } else {
        setError('Failed to fetch audits after generation');
      }
    } catch (e) {
      console.error('Error generating audit:', e);
      setError('An error occurred while generating the audit.');
    } finally {
      setIsGeneratingAudit(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-dark-blue min-h-screen">
      {/* Top Bar */}
      <header className="w-full flex items-center justify-between px-6 py-4 bg-dark-blue/95 border-b border-white/10 sticky top-0 z-30">
        <div className="flex items-center gap-4 w-1/2">
          <div className="relative w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-gray" />
            <input
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-medium-blue text-white border border-white/10 focus:outline-none focus:border-accent-blue transition text-base"
              placeholder="Search projects..."
              style={{ minWidth: 200 }}
              value={search || (selectedProject ? selectedProject.name : '')}
              onChange={e => {
                setSearch(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
              autoComplete="off"
            />
            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-dark-blue border border-white/10 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                {projects.length === 0 ? (
                  <div className="px-4 py-3 text-white/60">No projects found</div>
                ) : (
                  projects
                    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
                    .map((project) => (
                      <button
                        key={project.id}
                        className={`w-full text-left px-4 py-3 hover:bg-accent-blue/20 transition flex flex-col ${selectedProject?.id === project.id ? 'bg-accent-blue/10' : ''}`}
                        onMouseDown={() => {
                          setSelectedProject(project);
                          setSearch(project.name);
                          setDropdownOpen(false);
                        }}
                      >
                        <span className="font-semibold text-white">{project.name}</span>
                        <span className="text-xs text-white/50">{project.website_url}</span>
                      </button>
                    ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-bold shadow hover:scale-105 transition-all text-base disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleGenerateAudit}
            disabled={isGeneratingAudit || !selectedProject}
          >
            {isGeneratingAudit && (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            )}
            {isGeneratingAudit ? 'Generating...' : 'Audit'}
          </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col gap-8 items-stretch bg-dark-blue/90 px-2 md:px-8 py-8 w-full">
        {/* If no audits for selected project, show NoAudits */}
        {selectedProject && allAudits.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full">
            <NoAudits
              projectName={selectedProject.name || ''}
              onGenerateAudit={isGeneratingAudit ? undefined : handleGenerateAudit}
              isLoading={isGeneratingAudit}
              error={error}
            />
          </div>
        ) : (
          <>
            {/* Stat Cards Row */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {stats.map((stat, idx) => (
                <StatCard key={idx} {...stat} />
              ))}
            </div>
            {/* Main Content Grid: Audit Report Card left, Trends right */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Audit Report Card */}
              <div className="col-span-2 flex flex-col gap-6">
                <AuditReportCard
                  url={latestAudit?.url}
                  timestamp={latestAudit?.timestamp}
                  overall_score={latestAudit?.overall_score}
                  mobile_performance_score={latestAudit?.mobile_performance_score}
                  desktop_performance_score={latestAudit?.desktop_performance_score}
                  recommendations={latestAudit?.recommendations || []}
                  pagespeed_data={latestAudit?.pagespeed_data}
                />
              </div>
              {/* Right: Mobile and Desktop Trends stacked vertically */}
              <div className="col-span-1 flex flex-col gap-8">
                {/* Mobile Metrics Trends */}
                <div className="bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col">
                  <div className="text-accent-blue font-bold text-lg mb-4 flex items-center gap-2"><Smartphone className="text-accent-blue" /> Mobile Metrics Trends</div>
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
                  <div className="text-light-purple font-bold text-lg mb-4 flex items-center gap-2"><Monitor className="text-light-purple" /> Desktop Metrics Trends</div>
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
            </div>
            {/* Merged Performance Score History and Audit History section */}
            <div className="w-full min-h-[600px] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl border border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.15)] p-0 flex flex-col mt-8 backdrop-blur-sm relative overflow-hidden">
              {/* Animated background elements */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-purple-500 rounded-full blur-2xl animate-pulse delay-500"></div>
              </div>
              
              <div className="relative z-10">
                <div className="text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text font-bold text-xl mb-6 flex items-center gap-3 px-8 pt-8">
                  <div className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl backdrop-blur-sm border border-cyan-400/30">
                    <TrendingUp className="text-cyan-400 w-6 h-6" />
                  </div>
                  Performance Score & Audit History
                </div>
                
                <div className="flex-1 w-full h-full px-4 pb-8">
                  <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/30 rounded-2xl border border-cyan-500/10 p-4 backdrop-blur-sm">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 30, right: 50, left: 10, bottom: 10 }}>
                        <defs>
                          <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="50%" stopColor="#1d4ed8" stopOpacity={0.4}/>
                            <stop offset="100%" stopColor="#1e40af" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorMobile" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.7}/>
                            <stop offset="50%" stopColor="#0891b2" stopOpacity={0.3}/>
                            <stop offset="100%" stopColor="#0e7490" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorDesktop" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.7}/>
                            <stop offset="50%" stopColor="#7c3aed" stopOpacity={0.3}/>
                            <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.1}/>
                          </linearGradient>
                          
                          {/* Glow effects */}
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge> 
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        
                        <XAxis 
                          dataKey="timestamp" 
                          stroke="#22d3ee" 
                          fontSize={12} 
                          angle={-25} 
                          height={70} 
                          tick={{ fill: '#cbd5e1', fontWeight: 500 }} 
                          tickLine={false} 
                          axisLine={{ stroke: '#22d3ee', strokeWidth: 1, opacity: 0.6 }}
                          tickFormatter={(value) => value}
                        />
                        
                        <YAxis 
                          stroke="#22d3ee" 
                          fontSize={12} 
                          tick={{ fill: '#cbd5e1', fontWeight: 500 }} 
                          tickLine={false} 
                          axisLine={{ stroke: '#22d3ee', strokeWidth: 1, opacity: 0.6 }} 
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        
                        <Tooltip 
                          content={<CustomTooltip />} 
                          cursor={{ 
                            stroke: '#22d3ee', 
                            strokeWidth: 1, 
                            strokeDasharray: '4 4',
                            fill: 'rgba(34, 211, 238, 0.05)'
                          }} 
                        />
                        
                        <Legend 
                          iconType="circle" 
                          wrapperStyle={{ 
                            paddingTop: 16, 
                            color: '#e2e8f0', 
                            fontWeight: 600,
                            fontSize: '14px'
                          }} 
                        />
                        
                        {/* Desktop Area - Bottom layer */}
                        <Area 
                          type="monotone" 
                          dataKey="desktop_performance_score" 
                          stroke="#a855f7" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorDesktop)" 
                          name="Desktop Score"
                          dot={{ 
                            r: 5, 
                            fill: '#a855f7', 
                            stroke: '#ffffff', 
                            strokeWidth: 2,
                            filter: 'url(#glow)'
                          }}
                          activeDot={{ 
                            r: 7, 
                            fill: '#a855f7', 
                            stroke: '#ffffff', 
                            strokeWidth: 3,
                            filter: 'url(#glow)'
                          }}
                        />
                        
                        {/* Mobile Area - Middle layer */}
                        <Area 
                          type="monotone" 
                          dataKey="mobile_performance_score" 
                          stroke="#22d3ee" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorMobile)" 
                          name="Mobile Score"
                          dot={{ 
                            r: 5, 
                            fill: '#22d3ee', 
                            stroke: '#ffffff', 
                            strokeWidth: 2,
                            filter: 'url(#glow)'
                          }}
                          activeDot={{ 
                            r: 7, 
                            fill: '#22d3ee', 
                            stroke: '#ffffff', 
                            strokeWidth: 3,
                            filter: 'url(#glow)'
                          }}
                        />
                        
                        {/* Overall Area - Top layer */}
                        <Area 
                          type="monotone" 
                          dataKey="overall" 
                          stroke="#3b82f6" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#colorOverall)" 
                          name="Overall Score"
                          dot={{ 
                            r: 6, 
                            fill: '#3b82f6', 
                            stroke: '#ffffff', 
                            strokeWidth: 2,
                            filter: 'url(#glow)'
                          }}
                          activeDot={{ 
                            r: 8, 
                            fill: '#3b82f6', 
                            stroke: '#ffffff', 
                            strokeWidth: 3,
                            filter: 'url(#glow)'
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="overflow-x-auto px-8 pb-8">
                  <div className="bg-gradient-to-r from-slate-800/40 to-blue-900/20 rounded-2xl border border-cyan-500/10 backdrop-blur-sm overflow-hidden">
                    <table className="min-w-full text-left text-slate-200 text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-700/50 to-blue-800/30 border-b border-cyan-500/20">
                          <th className="py-4 px-4 font-semibold text-cyan-300">Date</th>
                          <th className="py-4 px-4 font-semibold text-cyan-300">URL</th>
                          <th className="py-4 px-4 font-semibold text-cyan-300">Mobile</th>
                          <th className="py-4 px-4 font-semibold text-cyan-300">Desktop</th>
                          <th className="py-4 px-4 font-semibold text-cyan-300">Overall</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allAudits.map((audit, index) => (
                          <tr 
                            key={audit.id} 
                            className={`border-b border-slate-600/20 hover:bg-gradient-to-r hover:from-cyan-500/5 hover:to-blue-500/5 transition-all duration-300 ${
                              index % 2 === 0 ? 'bg-slate-800/20' : 'bg-transparent'
                            }`}
                          >
                            <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                              {chartData[index]?.timestamp}
                            </td>
                            <td className="py-3 px-4 max-w-[180px] truncate text-slate-300">
                              {audit.url}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-medium">
                                {audit.mobile_performance_score}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-medium">
                                {audit.desktop_performance_score}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-medium">
                                {audit.overall_score}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard; 