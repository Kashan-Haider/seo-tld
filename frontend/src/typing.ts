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
  setSelectedProject: (project: Project) => void;
  clearSelectedProject: () => void;
}

export interface SidebarState {
  isOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export interface NoAuditsProps {
  projectName: string;
  onGenerateAudit?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  logout: () => void;
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
  url: string;
  timestamp: string;
  overall_score: number;
  mobile_performance_score: number;
  desktop_performance_score: number;
  recommendations: Opportunity[];
  pagespeed_data: PageSpeedData;
} 