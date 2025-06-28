import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../App';
import { useProjectStore } from '../store/projectStore';
import AuditReportCard from '../components/audit/AuditReportCard';
import DashboardHeader from '../components/audit/DashboardHeader';
import StatCards from '../components/audit/StatCards';
import MetricsTrends from '../components/audit/MetricsTrends';
import PerformanceHistory from '../components/audit/PerformanceHistory';
import NoAudits from './NoAudits';
import LoadingScreen from '../components/LoadingScreen';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [latestAudit, setLatestAudit] = useState<any>(null);
  const [allAudits, setAllAudits] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const { user } = useAuth();
  const { setProjects, selectedProject, projects, setSelectedProject } = useProjectStore();
  const [isGeneratingAudit, setIsGeneratingAudit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditDropdownOpen, setAuditDropdownOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const navigate = useNavigate();

  // Memoize chart data to prevent recalculation on every render
  const chartData = useMemo(() => {
    return allAudits.map(audit => ({
      timestamp: new Date(audit.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
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

  // Memoize handleGenerateAudit to prevent recreation on every render
  const handleGenerateAudit = useCallback(async () => {
    try {
      setIsGeneratingAudit(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      if (!selectedProject) throw new Error('No project selected');
      console.log("audit requested")
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
      if (!res.ok) throw new Error('Failed to generate audit');
      // Wait a moment for backend to process and DB to update
      await new Promise(r => setTimeout(r, 1200));
      // Refetch audits
      const auditsRes = await fetch(`/api/audit/get-all-audits/${selectedProject.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (auditsRes.ok) {
      console.log("audit completed")
        const data = await auditsRes.json();
        setAllAudits(data);
        setLatestAudit(data[0] || null);
      } else {
        setError('Failed to fetch audits after generation');
      }
    } catch (e) {
      console.error('Error generating audit:', e);
      setError('An error occurred while generating the audit.');
    } finally {
      setIsGeneratingAudit(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    const fetchProjects = async () => {
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
        console.log('All projects from API:', data);
        console.log('Current user:', user);
        const userProjects = data.filter((p: any) => p.owner_id === user?.id);
        console.log('Filtered user projects:', userProjects);
        setProjects(userProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setProjectsLoading(false);
      }
    };
    if (user && user.id) {
      console.log('User is loaded, fetching projects for user ID:', user.id);
      fetchProjects();
    } else {
      console.log('User not loaded yet or missing ID, skipping project fetch');
      setProjectsLoading(false);
    }
  }, [user?.id, setProjects]); // Only depend on user.id instead of entire user object

  // Redirect to create project if no projects exist (after fetch is complete)
  useEffect(() => {
    console.log('Redirect check - projectsLoading:', projectsLoading, 'projects:', projects, 'projects.length:', projects?.length);
    if (!projectsLoading && projects && Array.isArray(projects) && projects.length === 0) {
      console.log('Redirecting to create-project because no projects found');
      navigate('/create-project');
    }
  }, [projects, projectsLoading, navigate]);

  useEffect(() => {
    if (selectedProject?.id) { // Only depend on selectedProject.id
      const fetchAudits = async () => {
        try {
          const token = localStorage.getItem('access_token');
          console.log(token)
          const res = await fetch(`/api/audit/get-all-audits/${selectedProject.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (res.ok) {
            const data = await res.json();
            setAllAudits(data);
            setLatestAudit(data[0] || null);
          } else {
            setAllAudits([]);
            setLatestAudit(null);
          }
        } catch {
          setAllAudits([]);
          setLatestAudit(null);
        }
      };
      fetchAudits();
    }
  }, [selectedProject?.id]); // Only depend on selectedProject.id instead of entire selectedProject object

  useEffect(() => {
    if (allAudits.length > 0) {
      setSelectedAudit(allAudits[0]);
    } else {
      setSelectedAudit(null);
    }
  }, [allAudits]);

  if (isGeneratingAudit) {
    return <LoadingScreen />;
  }

  // Show loading while projects are being fetched
  if (projectsLoading) {
    return (
      <div className="w-full bg-dark-blue flex items-center justify-center min-h-screen">
        <div className="text-white text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-dark-blue">
      <DashboardHeader
        search={search}
        setSearch={setSearch}
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
      <main className="block bg-dark-blue/90 px-4 lg:px-8 py-8 w-full">
        {/* If no audits for selected project, show NoAudits */}
        {selectedProject && allAudits.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full">
            <NoAudits
              projectName={selectedProject.name || ''}
              onGenerateAudit={isGeneratingAudit ? undefined : handleGenerateAudit}
              isLoading={isGeneratingAudit}
              error={error}
            />
          </div>
        ) : (
          <>
            {/* Stat Cards Row */}
            <StatCards latestAudit={latestAudit} />
            
            {/* Main Content Grid: Audit Report Card left, Trends right */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-center lg:items-start">
              {/* Left: Audit Report Card */}
              <div className="col-span-2 flex flex-col gap-6">
                <AuditReportCard
                  url={selectedAudit?.url}
                  timestamp={selectedAudit?.timestamp}
                  overall_score={selectedAudit?.overall_score}
                  mobile_performance_score={selectedAudit?.mobile_performance_score}
                  desktop_performance_score={selectedAudit?.desktop_performance_score}
                  recommendations={selectedAudit?.recommendations || []}
                  pagespeed_data={selectedAudit?.pagespeed_data}
                />
              </div>
              {/* Right: Mobile and Desktop Trends stacked vertically */}
              <MetricsTrends chartData={chartData} />
        </div>
            
            {/* Performance Score History and Audit History section */}
            <PerformanceHistory chartData={chartData} allAudits={allAudits} />
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;