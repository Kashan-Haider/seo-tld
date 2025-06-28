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