import { create } from 'zustand';
import type { ProjectState, Project } from '../typing';

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProject: null,
  setProjects: (projects) => {
    const currentState = get();
    // Preserve the currently selected project if it still exists in the new projects list
    let selectedProject = currentState.selectedProject;
    
    if (projects && projects.length > 0) {
      // If no project is currently selected, select the latest one
      if (!selectedProject) {
        selectedProject = projects.reduce((a: Project, b: Project) => (new Date(a.created_at) > new Date(b.created_at) ? a : b));
      } else {
        // Check if the currently selected project still exists in the new projects list
        const projectStillExists = projects.find((p: Project) => p.id === selectedProject?.id);
        if (!projectStillExists) {
          // If the selected project no longer exists, select the latest one
          selectedProject = projects.reduce((a: Project, b: Project) => (new Date(a.created_at) > new Date(b.created_at) ? a : b));
        }
      }
    } else {
      selectedProject = null;
    }
    
    set({ projects, selectedProject });
  },
  setProjectsWithAutoSelect: (projects: Project[]) => {
    // Find the latest project by created_at
    let latest = null;
    if (projects && projects.length > 0) {
      latest = projects.reduce((a: Project, b: Project) => (new Date(a.created_at) > new Date(b.created_at) ? a : b));
    }
    set({ projects, selectedProject: latest });
  },
  setSelectedProject: (project) => set({ selectedProject: project }),
  clearSelectedProject: () => set({ selectedProject: null }),
  deleteProject: async (projectId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/project/delete-project/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Remove the project from local state
      const currentState = get();
      const updatedProjects = currentState.projects.filter((p: Project) => p.id !== projectId);
      
      // Update selected project if the deleted one was selected
      let selectedProject = currentState.selectedProject;
      if (currentState.selectedProject?.id === projectId) {
        selectedProject = updatedProjects.length > 0 
          ? updatedProjects.reduce((a: Project, b: Project) => (new Date(a.created_at) > new Date(b.created_at) ? a : b))
          : null;
      }

      set({ projects: updatedProjects, selectedProject });
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },
}));

// Audit zustand store
export interface AuditState {
  allAudits: any[];
  selectedAudit: any | null;
  setAllAudits: (audits: any[]) => void;
  setSelectedAudit: (audit: any) => void;
  clearSelectedAudit: () => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  allAudits: [],
  selectedAudit: null,
  setAllAudits: (audits) => set({ allAudits: audits, selectedAudit: audits[0] || null }),
  setSelectedAudit: (audit) => set({ selectedAudit: audit }),
  clearSelectedAudit: () => set({ selectedAudit: null }),
})); 