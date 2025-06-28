import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import ProjectCard from '../components/ProjectCard';
import { useProjectStore } from '../store/projectStore';

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

  return (
    <div className="w-full flex flex-col bg-dark-blue">
      <main className="flex-1 flex flex-col bg-dark-blue/90 px-4 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <div className="text-2xl md:text-3xl font-bold text-white mb-1">Your Projects</div>
            <div className="text-light-gray text-sm md:text-base">Manage all your SEO projects in one place</div>
          </div>
          <button
            className="px-4 py-2 rounded-full bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-semibold shadow hover:scale-105 transition"
            onClick={() => navigate('/create-project')}
          >
            + New Project
          </button>
        </div>

        {/* Content Section */}
        <section className="flex-1 w-full max-w-5xl mx-auto">
          <div className="mb-8 text-center">
            <div className="text-white text-xl md:text-2xl font-semibold mb-2">All Projects</div>
            <div className="text-light-gray text-base md:text-lg">Browse, manage, and jump into your projects below.</div>
          </div>
          {loading ? (
            <div className="text-light-gray text-center py-16 text-lg">Loading projects...</div>
          ) : error ? (
            <div className="text-red-400 text-center py-16 text-lg">{error}</div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-light-gray">
              <span className="text-5xl mb-4">📂</span>
              <div className="text-lg mb-2">No projects found.</div>
              <div className="mb-4">Start by creating a new project!</div>
              <button
                className="px-5 py-2 rounded-full bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-semibold shadow hover:scale-105 transition"
                onClick={() => navigate('/create-project')}
              >
                + New Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Projects; 