import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useProjectStore } from '../store/projectStore';
import type { Project } from '../store/projectStore';
import { Search, TrendingUp, Users, UserPlus, DollarSign } from 'lucide-react';

const statCards = [
  { label: "Today's Money", value: '$53,000', change: '+5%', color: 'var(--color-accent-blue)', icon: <DollarSign size={20} className="text-accent-blue" /> },
  { label: "Today's Users", value: '2,300', change: '+5%', color: 'var(--color-neon-cyan)', icon: <Users size={20} className="text-neon-cyan" /> },
  { label: 'New Clients', value: '+3,052', change: '-14%', color: 'var(--color-light-purple)', icon: <UserPlus size={20} className="text-light-purple" /> },
  { label: 'Total Sales', value: '$173,000', change: '+8%', color: 'var(--color-accent-blue)', icon: <TrendingUp size={20} className="text-accent-blue" /> },
];

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, setProjects, selectedProject, setSelectedProject } = useProjectStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('access_token');
        console.log(token)
        const res = await fetch('/api/project/all-projects', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch projects');
        const data = await res.json();
        setProjects(data.filter((p: any) => p.owner_id === user?.id));
      } catch (err: any) {
        setError(err.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user, setProjects]);

  useEffect(() => {
    if (!loading && !error && projects.length === 0) {
      navigate('/create-project', { replace: true });
    }
  }, [loading, error, projects, navigate]);

  // Dropdown close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const filteredProjects = search
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <div className="min-h-screen w-full flex flex-col bg-dark-blue">
      {/* Top Bar for Mobile (Sidebar toggle handled in App) */}
      <span className="md:hidden h-0" />
      {/* Main Content */}
      <main className="flex-1 min-h-screen flex flex-col bg-dark-blue/90">
        {/* Top Bar */}
        <header className="hidden md:flex items-center justify-between px-4 md:px-8 py-4 md:py-6 border-b border-white/10 bg-dark-blue/80 sticky top-0 z-20">
          <div className="text-2xl font-bold text-white tracking-wide">Dashboard</div>
          <div className="flex items-center gap-2 md:gap-4 relative">
            <div className="relative w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-gray pointer-events-none" />
              <input
                ref={inputRef}
                className="pl-8 pr-2 md:px-4 py-2 rounded-lg bg-medium-blue text-white border border-white/10 focus:outline-none focus:border-accent-blue transition w-full"
                placeholder="Select project..."
                value={search || (selectedProject ? selectedProject.name : '')}
                onChange={e => {
                  setSearch(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                autoComplete="off"
              />
              {dropdownOpen && filteredProjects.length > 0 && (
                <div ref={dropdownRef} className="absolute left-0 right-0 mt-1 bg-dark-blue border border-white/10 rounded-lg shadow-lg z-30 max-h-60 overflow-y-auto">
                  {filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      className="w-full text-left px-4 py-2 hover:bg-accent-blue/20 text-white/90 rounded-lg transition"
                      onClick={() => {
                        setSelectedProject(project);
                        setSearch(project.name);
                        setDropdownOpen(false);
                      }}
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-white/60 text-xs md:text-base">{user?.email}</span>
          </div>
        </header>
        {/* Stat Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-8 py-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl p-6 shadow-xl backdrop-blur-xl border border-white/10 flex flex-col gap-2"
              style={{
                background: 'linear-gradient(120deg, var(--color-medium-blue) 60%, var(--color-dark-blue) 100%)',
                boxShadow: `0 4px 24px 0 ${card.color}40`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">{card.icon}<span className="text-white/70 text-sm font-medium">{card.label}</span></div>
              <div className="text-2xl font-bold text-white">{card.value}</div>
              <div className="text-sm font-semibold" style={{ color: card.color }}>{card.change}</div>
            </div>
          ))}
        </section>
        {/* Main Dashboard Content */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 px-2 md:px-8 pb-4 md:pb-8">
          {/* Welcome Card */}
          <div className="col-span-1 lg:col-span-2 rounded-3xl p-4 md:p-8 shadow-2xl border border-white/10 backdrop-blur-xl flex flex-col justify-between min-w-0"
            style={{
              background: 'linear-gradient(135deg, var(--color-dark-blue) 60%, var(--color-medium-blue) 100%)',
              minHeight: 180,
            }}
          >
            <div>
              <div className="text-white/80 text-base md:text-lg mb-2">Welcome back,</div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">{user?.email || 'User'}</div>
              <div className="text-light-gray mb-4 text-sm md:text-base">Glad to see you again! Ask me anything.</div>
              <button className="mt-2 px-4 md:px-6 py-2 rounded-full bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-semibold shadow hover:scale-105 transition text-sm md:text-base">Tap to record →</button>
            </div>
          </div>
          {/* Satisfaction Card */}
          <div className="rounded-3xl p-4 md:p-8 shadow-2xl border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center min-w-0"
            style={{
              background: 'linear-gradient(135deg, var(--color-medium-blue) 60%, var(--color-dark-blue) 100%)',
              minHeight: 180,
            }}
          >
            <div className="text-white/80 text-base md:text-lg mb-2">Satisfaction Rate</div>
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-dark-blue flex items-center justify-center mb-4 shadow-inner border-4 border-accent-blue">
              <span className="text-2xl md:text-3xl font-bold text-accent-blue">95%</span>
            </div>
            <div className="text-light-gray text-xs md:text-sm">Based on likes</div>
          </div>
        </section>
        {/* Charts and Projects */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 px-2 md:px-8 pb-4 md:pb-8">
          {/* Sales Overview (Chart Placeholder) */}
          <div className="rounded-3xl p-4 md:p-8 shadow-2xl border border-white/10 backdrop-blur-xl flex flex-col justify-between min-w-0"
            style={{
              background: 'linear-gradient(135deg, var(--color-dark-blue) 60%, var(--color-medium-blue) 100%)',
              minHeight: 180,
            }}
          >
            <div className="text-white/80 text-base md:text-lg mb-2">Sales Overview</div>
            <div className="flex-1 flex items-center justify-center">
              {/* Chart Placeholder */}
              <div className="w-full h-20 md:h-32 bg-gradient-to-r from-accent-blue/30 to-light-purple/30 rounded-xl flex items-end">
                <div className="w-1/6 h-2/3 bg-accent-blue rounded-t-xl mx-1" />
                <div className="w-1/6 h-1/2 bg-light-purple rounded-t-xl mx-1" />
                <div className="w-1/6 h-3/4 bg-accent-blue rounded-t-xl mx-1" />
                <div className="w-1/6 h-1/3 bg-light-purple rounded-t-xl mx-1" />
                <div className="w-1/6 h-2/3 bg-accent-blue rounded-t-xl mx-1" />
                <div className="w-1/6 h-1/2 bg-light-purple rounded-t-xl mx-1" />
              </div>
            </div>
          </div>
          {/* Active Users (Chart Placeholder) */}
          <div className="rounded-3xl p-4 md:p-8 shadow-2xl border border-white/10 backdrop-blur-xl flex flex-col justify-between min-w-0"
            style={{
              background: 'linear-gradient(135deg, var(--color-medium-blue) 60%, var(--color-dark-blue) 100%)',
              minHeight: 180,
            }}
          >
            <div className="text-white/80 text-base md:text-lg mb-2">Active Users</div>
            <div className="flex-1 flex items-center justify-center">
              {/* Chart Placeholder */}
              <div className="w-full h-20 md:h-32 flex items-end gap-2">
                {[80, 60, 100, 40, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-accent-blue/60 rounded-t-xl" style={{ height: h }} />
                ))}
              </div>
            </div>
            <div className="text-light-gray text-xs md:text-sm mt-4">32,984 users</div>
          </div>
          {/* Projects List */}
          <div className="rounded-3xl p-4 md:p-8 shadow-2xl border border-white/10 backdrop-blur-xl flex flex-col justify-between min-w-0"
            style={{
              background: 'linear-gradient(135deg, var(--color-dark-blue) 60%, var(--color-medium-blue) 100%)',
              minHeight: 180,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/80 text-base md:text-lg">Projects</div>
              <button
                className="px-3 md:px-4 py-2 rounded-full bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-semibold shadow hover:scale-105 transition text-xs md:text-base"
                onClick={() => navigate('/create-project')}
              >
                + New Project
              </button>
            </div>
            {loading ? (
              <div className="text-light-gray text-center py-4 md:py-8">Loading projects...</div>
            ) : error ? (
              <div className="text-red-400 text-center py-4 md:py-8">{error}</div>
            ) : projects.length === 0 ? (
              <div className="text-light-gray text-center py-4 md:py-8">No projects found. Start by creating a new project!</div>
            ) : (
              <div className="flex flex-col gap-2 md:gap-4">
                {projects.slice(0, 4).map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col md:flex-row md:items-center justify-between bg-white/5 rounded-xl px-3 md:px-4 py-2 md:py-3 shadow border border-white/10 hover:bg-accent-blue/10 transition"
                  >
                    <div>
                      <div className="text-white font-semibold text-sm md:text-base">{project.name}</div>
                      <div className="text-light-gray text-xs">{project.website_url}</div>
                    </div>
                    <button
                      className="mt-2 md:mt-0 px-3 md:px-4 py-1 rounded-full bg-gradient-to-r from-accent-blue to-light-purple text-white text-xs font-semibold shadow hover:scale-105 transition"
                      onClick={() => navigate(`/project/${project.id}`)}
                    >
                      Dashboard
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard; 