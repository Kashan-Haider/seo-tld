import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../App';
import { useProjectStore } from '../store/projectStore';
import AuditReportCard from '../components/audit/AuditReportCard';
import DashboardHeader from '../components/audit/DashboardHeader';
import StatCards from '../components/audit/StatCards';
import MetricsTrends from '../components/audit/MetricsTrends';
import PerformanceHistory from '../components/audit/PerformanceHistory';
import NoAudits from './NoAudits';
import { useNavigate } from 'react-router-dom';
import DashboardLoadingScreen from '../components/DashboardLoadingScreen';
import AuditLoadingScreen from '../components/AuditLoadingScreen';

const Dashboard: React.FC = () => {
  const [allAudits, setAllAudits] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [isGeneratingAudit, setIsGeneratingAudit] = useState(false);
  const [auditDropdownOpen, setAuditDropdownOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [auditTaskId, setAuditTaskId] = useState<string | null>(null);
  const [auditTaskStatus, setAuditTaskStatus] = useState<string | null>(null);
  const [auditTaskProgress, setAuditTaskProgress] = useState<number>(0);
  const [auditTaskError, setAuditTaskError] = useState<string | null>(null);
  const [isPollingAudit, setIsPollingAudit] = useState(false);
  const [auditsLoading, setAuditsLoading] = useState(false);
  
  const { user } = useAuth();
  const { setProjects, selectedProject, projects, setSelectedProject } = useProjectStore();
  const navigate = useNavigate();

  // Memoize chart data to prevent recalculation on every render
  const chartData = useMemo(() => {
    return allAudits.map(audit => ({
      timestamp: new Date(audit.timestamp).toLocaleString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      overall_score: audit.overall_score,
      mobile_performance_score: audit.mobile_performance_score,
      desktop_performance_score: audit.desktop_performance_score,
      fcp_mobile: audit.pagespeed_data?.mobile?.fcp,
      lcp_mobile: audit.pagespeed_data?.mobile?.lcp,
      cls_mobile: audit.pagespeed_data?.mobile?.cls,
      fid_mobile: audit.pagespeed_data?.mobile?.fid,
      ttfb_mobile: audit.pagespeed_data?.mobile?.ttfb,
      fcp_desktop: audit.pagespeed_data?.desktop?.fcp,
      lcp_desktop: audit.pagespeed_data?.desktop?.lcp,
      cls_desktop: audit.pagespeed_data?.desktop?.cls,
      fid_desktop: audit.pagespeed_data?.desktop?.fid,
      ttfb_desktop: audit.pagespeed_data?.desktop?.ttfb,
    }));
  }, [allAudits]);

  // Fetch audits for the selected project
  const fetchAudits = useCallback(async (projectId: string) => {
    try {
      setAuditsLoading(true);
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/audit/get-all-audits/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAllAudits(data);
        setSelectedAudit(data[0] || null);
      } else {
        setAllAudits([]);
        setSelectedAudit(null);
      }
    } catch (error) {
      setAllAudits([]);
      setSelectedAudit(null);
    } finally {
      setAuditsLoading(false);
    }
  }, []);

  // Generate new audit (async, with polling)
  const handleGenerateAudit = useCallback(async () => {
    try {
      setIsGeneratingAudit(true);
      setAuditTaskError(null);
      setAuditTaskStatus('Starting audit...');
      setAuditTaskProgress(0);
      setAuditTaskId(null);
      setIsPollingAudit(false);
      const token = localStorage.getItem('access_token');
      if (!selectedProject) throw new Error('No project selected');
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: selectedProject.id,
          audit_type: 'full',
          url: selectedProject.website_url,
        }),
      });
      if (!res.ok) throw new Error('Failed to start audit');
      const data = await res.json();
      if (!data.task_id) throw new Error('No task_id returned');
      setAuditTaskId(data.task_id);
      setIsPollingAudit(true);
    } catch (e) {
      setAuditTaskError('An error occurred while starting the audit.');
      setIsGeneratingAudit(false);
    }
  }, [selectedProject]);

  // Poll audit task status
  useEffect(() => {
    if (!auditTaskId || !isPollingAudit) return;
    let isMounted = true;
    let interval: number;
    const poll = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`/api/audit/task-status/${auditTaskId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (!isMounted) return;
        if (data.state === 'PROGRESS' && data.status) {
          setAuditTaskStatus(data.status);
        } else if (data.status) {
          setAuditTaskStatus(data.status);
        } else if (data.state) {
          setAuditTaskStatus(data.state);
        }
        const progress = typeof data.current === 'number' ? data.current : (data.meta && typeof data.meta.current === 'number' ? data.meta.current : undefined);
        const total = typeof data.total === 'number' ? data.total : (data.meta && typeof data.meta.total === 'number' ? data.meta.total : 100);
        setAuditTaskProgress(
          typeof progress === 'number' && typeof total === 'number'
            ? Math.round((progress / total) * 100)
            : 10
        );
        if (data.state === 'SUCCESS') {
          setIsGeneratingAudit(false);
          setIsPollingAudit(false);
          setAuditTaskId(null);
          setAuditTaskStatus('Audit complete!');
          if (selectedProject) {
            await fetchAudits(selectedProject.id);
          }
        } else if (data.state === 'FAILURE') {
          setIsGeneratingAudit(false);
          setIsPollingAudit(false);
          setAuditTaskError(data.error || 'Audit failed.');
        }
      } catch (e) {
        if (!isMounted) return;
        setAuditTaskError('Error polling audit status.');
        setIsGeneratingAudit(false);
        setIsPollingAudit(false);
      }
    };
    interval = window.setInterval(poll, 2000);
    poll();
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [auditTaskId, isPollingAudit, selectedProject, fetchAudits]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
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
      const userProjects = data.filter((p: any) => p.owner_id === user?.id);
      setProjects(userProjects);
    } catch (error) {
      // log error
    } finally {
      setProjectsLoading(false);
    }
  }, [user?.id, setProjects]);

  useEffect(() => {
    if (user?.id) {
      fetchProjects();
    } else {
      setProjectsLoading(false);
    }
  }, [user?.id, fetchProjects]);

  useEffect(() => {
    if (!projectsLoading && projects && Array.isArray(projects) && projects.length === 0) {
      navigate('/create-project');
    }
  }, [projects, projectsLoading, navigate]);

  useEffect(() => {
    if (selectedProject?.id) {
      fetchAudits(selectedProject.id);
    }
  }, [selectedProject?.id, fetchAudits]);

  useEffect(() => {
    if (allAudits.length > 0) {
      setSelectedAudit(allAudits[0]);
    } else {
      setSelectedAudit(null);
    }
  }, [allAudits]);

  // Handle audit deletion
  const handleAuditDeleted = useCallback((auditId: number) => {
    setAllAudits(prevAudits => prevAudits.filter(audit => audit.id !== auditId));
    setSelectedAudit((prevSelected: any) => {
      if (prevSelected?.id === auditId) {
        const remainingAudits = allAudits.filter(audit => audit.id !== auditId);
        return remainingAudits.length > 0 ? remainingAudits[0] : null;
      }
      return prevSelected;
    });
  }, [allAudits]);

  if ((isGeneratingAudit || isPollingAudit) && selectedProject) {
    return <DashboardLoadingScreen message={auditTaskStatus || 'Generating audit...'} progress={auditTaskProgress} />;
  }

  if (projectsLoading) {
    return <DashboardLoadingScreen message="Loading projects..." progress={0} />;
  }

  if (auditsLoading) {
    return <AuditLoadingScreen message="Loading audits..." progress={0} />;
  }

  return (
    <div className="w-full bg-dark-blue min-h-screen">
      {/*
        NOTE: If you have a Sidebar component, ensure it uses:
        className="hidden lg:block"
        so it is hidden on screens smaller than lg.
      */}
      <DashboardHeader
        dropdownOpen={dropdownOpen}
        setDropdownOpen={setDropdownOpen}
        projects={projects}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        allAudits={allAudits}
        selectedAudit={selectedAudit}
        setSelectedAudit={setSelectedAudit}
        auditDropdownOpen={auditDropdownOpen}
        setAuditDropdownOpen={setAuditDropdownOpen}
        isGeneratingAudit={isGeneratingAudit}
        handleGenerateAudit={handleGenerateAudit}
      />
      <main className="block bg-dark-blue/90 px-2 sm:px-4 lg:px-8 py-6 w-full">
        {selectedProject && allAudits.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full">
            <NoAudits
              projectName={selectedProject.name || ''}
              onGenerateAudit={isGeneratingAudit ? undefined : handleGenerateAudit}
              isLoading={isGeneratingAudit}
              error={auditTaskError}
            />
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <StatCards latestAudit={selectedAudit} secondLatestAudit={allAudits.length > 1 ? allAudits[1] : null} />
            </div>
            <div className="w-full grid grid-cols-1 gap-8 mb-8 items-center lg:grid-cols-3 lg:items-start">
              <div className="col-span-2 flex flex-col gap-6">
                <AuditReportCard
                  auditId={selectedAudit?.id?.toString() || 'latest'}
                  url={selectedAudit?.url}
                  timestamp={selectedAudit?.timestamp}
                  overall_score={selectedAudit?.overall_score}
                  mobile_performance_score={selectedAudit?.mobile_performance_score}
                  desktop_performance_score={selectedAudit?.desktop_performance_score}
                  recommendations={selectedAudit?.recommendations || []}
                  pagespeed_data={selectedAudit?.pagespeed_data}
                />
              </div>
              <div className="w-full overflow-x-auto">
                <MetricsTrends chartData={chartData} />
              </div>
            </div>
            <div className="w-full overflow-x-auto">
              <PerformanceHistory chartData={chartData} allAudits={allAudits} onAuditDeleted={handleAuditDeleted} />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;