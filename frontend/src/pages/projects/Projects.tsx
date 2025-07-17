import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import ProjectCard from '../../components/ProjectCard';
import { useProjectStore } from '../../store/projectStore';
import FloatingPlanet from '../../ui/FloatingPlanet';
import FloatingAstronaut from '../../ui/FloatingAstronaut';
import Orbit from '../../ui/Orbit';
import Spotlights from '../../ui/Spotlights';

const Projects: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, setProjects } = useProjectStore();

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/project/all-projects`, {
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

  return (
    <div className="h-full flex items-center justify-center bg-dark-blue relative overflow-hidden">
      {/* Space theme background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0f1535] via-[#1e2a5a] to-[#232b4d] opacity-95" />
      <Spotlights />
      <Orbit />
      <FloatingPlanet />
      <FloatingAstronaut />
      {/* Glassy, 3D card for projects */}
      <div className="relative z-10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-accent-blue/30 rounded-2xl p-10 w-full max-w-5xl flex flex-col items-center" style={{boxShadow: '0 8px 40px 0 rgba(34,211,238,0.15), 0 1.5px 8px 0 #1e2a5a'}}>
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 w-full">
          <div>
            <div className="text-3xl md:text-4xl font-extrabold text-white mb-1 drop-shadow-[0_2px_8px_rgba(34,211,238,0.25)] tracking-wide" style={{letterSpacing: '0.04em'}}>Your Projects</div>
            <div className="text-light-gray text-base md:text-lg">Manage all your SEO projects in one place</div>
          </div>
          <button
            className="px-5 py-2 rounded-full bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-semibold shadow-lg shadow-accent-blue/30 hover:scale-105 hover:shadow-light-purple/40 transition-all border border-accent-blue/30"
            onClick={() => navigate('/create-project')}
          >
            + New Project
          </button>
        </div>
        {/* Content Section */}
        <section className="flex-1 w-full">
          <div className="mb-8 text-center">
            <div className="text-white text-2xl md:text-3xl font-semibold mb-2">All Projects</div>
            <div className="text-light-gray text-base md:text-lg">Browse, manage, and jump into your projects below.</div>
          </div>
          {loading ? (
            <div className="text-light-gray text-center py-16 text-lg">Loading projects...</div>
          ) : error ? (
            <div className="text-red-400 text-center py-16 text-lg">{error}</div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-light-gray">
              <div className="text-lg mb-2">No projects found.</div>
              <div className="mb-4">Start by creating a new project!</div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-8 justify-center">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Projects; 