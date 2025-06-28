import React, { useState } from 'react';
import type { ProjectCardProps } from '../typing';
import { Folder, Globe, ArrowRight, Trash2 } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ConfirmationDialog from './ConfirmationDialog';

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const formattedDate = project.created_at ? new Date(project.created_at).toLocaleDateString() : '';
  const { setSelectedProject, deleteProject } = useProjectStore();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProject(project);
    navigate('/');
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      toast.success(`Project "${project.name}" deleted successfully`);
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className="sm:w-[450px] flex flex-col justify-between bg-white/5 rounded-2xl px-8 py-7 shadow border border-white/10 hover:bg-accent-blue/10 transition min-h-[200px] gap-3"
      >
        <div className="flex items-center gap-3 mb-2">
          <Folder className="text-accent-blue" size={32} />
          <div className="text-2xl font-bold text-white truncate flex-1">{project.name}</div>
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete project"
          >
            <Trash2 size={20} />
          </button>
        </div>
        <div className="text-light-gray text-base mb-2 truncate">{project.description || 'No description provided.'}</div>
        <div className="flex items-center gap-2 text-sm text-light-gray mb-2">
          <span className="text-accent-blue">Created:</span> {formattedDate}
        </div>
        <div className="flex items-center gap-5 mt-auto">
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

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This action cannot be undone and will permanently remove all associated audit data.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default ProjectCard; 