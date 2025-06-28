// Centralized types for the frontend

export interface Project {
  id: string;
  name: string;
  description?: string;
  website_url: string;
  created_at: string;
  updated_at?: string | null;
  owner_id: string;
}

export interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setProjectsWithAutoSelect: (projects: Project[]) => void;
  setSelectedProject: (project: Project) => void;
  clearSelectedProject: () => void;
  deleteProject: (projectId: string) => Promise<boolean>;
}

export interface SidebarState {
  isOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export interface NoAuditsProps {
  projectName: string;
  onGenerateAudit?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

export interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export interface Stat {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
}

export interface Opportunity {
  title: string;
  description: string;
  savings_ms: number;
}

export interface Diagnostic {
  title: string;
  description: string;
  score: number;
}

export interface PageSpeedMetrics {
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  ttfb: number;
  opportunities: Opportunity[];
  diagnostics: Diagnostic[];
}

export interface PageSpeedData {
  mobile: PageSpeedMetrics;
  desktop: PageSpeedMetrics;
}

export interface AuditReportCardProps {
  auditId: string;
  url: string;
  timestamp: string;
  overall_score: number;
  mobile_performance_score: number;
  desktop_performance_score: number;
  recommendations: Opportunity[];
  pagespeed_data: PageSpeedData;
} 