import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  description?: string;
  website_url: string;
  created_at: string;
  updated_at?: string | null;
  owner_id: string;
  // Relationships (optional, not used in frontend store)
  // owner?: any;
  // keywords?: any[];
  // audits?: any[];
  // competitor_analyses?: any[];
}

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setSelectedProject: (project: Project) => void;
  clearSelectedProject: () => void;
}

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