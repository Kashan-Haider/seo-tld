import React from 'react';
import type { Project } from '../store/projectStore';
import { Folder, Globe, ArrowRight } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const formattedDate = project.created_at ? new Date(project.created_at).toLocaleDateString() : '';
  const { setSelectedProject } = useProjectStore();
  const navigate = useNavigate();

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProject(project);
    navigate('/');
  };

  return (
    <div
      className="flex flex-col justify-between bg-white/5 rounded-2xl px-8 py-7 shadow border border-white/10 hover:bg-accent-blue/10 transition min-h-[200px] gap-3"
    >
      <div className="flex items-center gap-3 mb-2">
        <Folder className="text-accent-blue" size={32} />
        <div className="text-2xl font-bold text-white truncate">{project.name}</div>
      </div>
      <div className="text-light-gray text-base mb-2 truncate">{project.description || 'No description provided.'}</div>
      <div className="flex items-center gap-2 text-sm text-light-gray mb-2">
        <span className="text-accent-blue">Created:</span> {formattedDate}
      </div>
      <div className="flex items-center gap-2 mt-auto">
        <a
          href={project.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-blue hover:underline text-base truncate flex-1 flex items-center gap-1"
          onClick={e => e.stopPropagation()}
        >
          <Globe size={18} /> {project.website_url}
        </a>
        <button
          className="px-4 py-2 rounded-full bg-gradient-to-r from-accent-blue to-light-purple text-white text-base font-semibold shadow hover:scale-105 transition flex items-center gap-2"
          onClick={handleDashboardClick}
        >
          Dashboard <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default ProjectCard; 