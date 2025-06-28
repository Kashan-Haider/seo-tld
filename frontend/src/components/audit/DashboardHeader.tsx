import React from 'react';
import { Search } from 'lucide-react';

interface DashboardHeaderProps {
  search: string;
  setSearch: (search: string) => void;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  projects: any[];
  selectedProject: any;
  setSelectedProject: (project: any) => void;
  allAudits: any[];
  selectedAudit: any;
  setSelectedAudit: (audit: any) => void;
  auditDropdownOpen: boolean;
  setAuditDropdownOpen: (open: boolean) => void;
  isGeneratingAudit: boolean;
  handleGenerateAudit: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  search,
  setSearch,
  dropdownOpen,
  setDropdownOpen,
  projects,
  selectedProject,
  setSelectedProject,
  allAudits,
  selectedAudit,
  setSelectedAudit,
  auditDropdownOpen,
  setAuditDropdownOpen,
  isGeneratingAudit,
  handleGenerateAudit,
}) => {
  return (
    <header className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-3 md:px-6 py-3 md:py-4 bg-dark-blue/95 border-b border-white/10 sticky top-0 z-30">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 w-full md:w-1/2">
        <div className="relative w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-gray" />
          <input
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-medium-blue text-white border border-white/10 focus:outline-none focus:border-accent-blue transition text-base min-w-0"
            placeholder="Search projects..."
            value={search || (selectedProject ? selectedProject.name : '')}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
          />
          {dropdownOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-dark-blue border border-white/10 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
              {projects.length === 0 ? (
                <div className="px-4 py-3 text-white/60">No projects found</div>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    className={`w-full text-left px-4 py-3 hover:bg-accent-blue/20 transition flex flex-col ${selectedProject?.id === project.id ? 'bg-accent-blue/10' : ''}`}
                    onMouseDown={() => {
                      setSelectedProject(project);
                      setDropdownOpen(false);
                    }}
                  >
                    <span className="font-semibold text-white">{project.name}</span>
                    <span className="text-xs text-white/50">{project.website_url}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 w-full md:w-auto">
        {/* Audit selection dropdown */}
        {allAudits.length > 0 && (
          <>
            <div className="relative w-full sm:w-auto">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-medium-blue text-white border border-white/10 focus:outline-none focus:border-accent-blue transition text-base w-full sm:w-auto"
                onClick={() => setAuditDropdownOpen(!auditDropdownOpen)}
              >
                {selectedAudit ? new Date(selectedAudit.timestamp).toLocaleString() : 'Select Audit'}
                <svg className={`ml-2 w-4 h-4 transition-transform ${auditDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {auditDropdownOpen && (
                <div className="absolute right-0 mt-2 bg-dark-blue border border-white/10 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto min-w-[220px]">
                  {allAudits
                    .slice()
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((audit) => (
                      <button
                        key={audit.id}
                        className={`w-full text-left px-4 py-3 hover:bg-accent-blue/20 transition flex flex-col ${selectedAudit?.id === audit.id ? 'bg-accent-blue/10' : ''}`}
                        onMouseDown={() => {
                          setSelectedAudit(audit);
                          setAuditDropdownOpen(false);
                        }}
                      >
                        <span className="font-semibold text-white">{new Date(audit.timestamp).toLocaleString()}</span>
                        <span className="text-xs text-white/50">{audit.url}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
            {/* Generate Audit button */}
            <button
              className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-bold shadow hover:scale-105 transition-all text-base disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
              onClick={handleGenerateAudit}
              disabled={isGeneratingAudit || !selectedProject}
            >
              {isGeneratingAudit && (
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              )}
              {isGeneratingAudit ? 'Generating...' : 'Audit'}
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader; 