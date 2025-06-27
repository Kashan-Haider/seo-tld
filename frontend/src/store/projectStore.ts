import { create } from 'zustand';
import type { Project, ProjectState } from '../typing';

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  selectedProject: null,
  setProjects: (projects) => {
    // Find the latest project by created_at
    let latest = null;
    if (projects && projects.length > 0) {
      latest = projects.reduce((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? a : b));
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