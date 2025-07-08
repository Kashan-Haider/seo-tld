import React from 'react';
import { Search, Grid3X3, Calendar, Globe } from 'lucide-react';

interface DashboardHeaderProps {
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
    <header className="w-full bg-gradient-to-br from-dark-blue/95 via-dark-blue/90 to-dark-blue/95  sticky top-0 z-30 backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 px-4 lg:px-6 py-4">
        {/* Project Selection Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4 w-full lg:w-1/2">
          <div className="relative w-full">
            <button
              className="w-full pl-4 pr-8 py-3 rounded-xl bg-gradient-to-r from-medium-blue/80 to-medium-blue text-white border border-white/10 hover:outline-none hover:border-accent-blue hover:ring-2 hover:ring-accent-blue/20 transition-all duration-300 text-base backdrop-blur-sm flex items-center justify-between"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="flex flex-col text-left">
                <span className="font-semibold text-white text-base">{selectedProject ? selectedProject.name : 'Select Project'}</span>
                <span className="text-xs text-white/50 flex items-center gap-1">
                  <Globe size={12} />
                  {selectedProject ? selectedProject.website_url : ''}
                </span>
              </div>
              <span className="ml-2 text-light-gray">
                <Grid3X3 size={18} />
              </span>
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-gradient-to-br from-dark-blue to-medium-blue border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto backdrop-blur-md custom-scrollbar">
                {projects.length === 0 ? (
                  <div className="px-4 py-3 text-white/60">No projects found</div>
                ) : (
                  projects.map((project) => (
                    <button
                      key={project.id}
                      className={`w-full text-left px-4 py-3 hover:bg-accent-blue/20 transition-all duration-200 flex flex-col ${selectedProject?.id === project.id ? 'bg-accent-blue/10 border-l-2 border-accent-blue' : ''}`}
                      onMouseDown={() => {
                        setSelectedProject(project);
                        setDropdownOpen(false);
                      }}
                    >
                      <span className="font-semibold text-white">{project.name}</span>
                      <span className="text-xs text-white/50 flex items-center gap-1">
                        <Globe size={12} />
                        {project.website_url}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Audit Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4 w-full lg:w-auto">
          {/* Audit Selection */}
          {allAudits.length > 0 && (
            <div className="relative w-full sm:w-auto">
              <button
                className="w-full sm:w-auto h-12 px-4 rounded-xl bg-gradient-to-br from-medium-blue/60 to-medium-blue/40 border border-white/10 hover:outline-none hover:border-accent-blue hover:ring-2 hover:ring-accent-blue/20 transition-all duration-300 backdrop-blur-sm flex items-center gap-2"
                onClick={() => setAuditDropdownOpen(!auditDropdownOpen)}
              >
                <Calendar size={16} className="text-accent-blue" />
                <span className="text-xs text-white/70 font-medium">AUDIT</span>
                <span className="text-sm text-white font-semibold truncate max-w-32">
                  {selectedAudit ? new Date(selectedAudit.timestamp).toLocaleDateString() : 'Select Audit'}
                </span>
              </button>
              {auditDropdownOpen && (
                <div className="absolute right-0 mt-2 bg-gradient-to-br from-dark-blue to-medium-blue border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto min-w-[280px] backdrop-blur-md custom-scrollbar">
                  {allAudits
                    .slice()
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((audit) => (
                      <button
                        key={audit.id}
                        className={`w-full text-left px-4 py-3 hover:bg-accent-blue/20 transition-all duration-200 flex flex-col ${selectedAudit?.id === audit.id ? 'bg-accent-blue/10 border-l-2 border-accent-blue' : ''}`}
                        onMouseDown={() => {
                          setSelectedAudit(audit);
                          setAuditDropdownOpen(false);
                        }}
                      >
                        <span className="font-semibold text-white text-sm">{new Date(audit.timestamp).toLocaleString()}</span>
                        <span className="text-xs text-white/50 truncate">{audit.url}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Generate Audit Button */}
          {allAudits.length > 0 && (
            <button
              className="w-full sm:w-auto h-12 px-6 rounded-xl bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-bold shadow-lg hover:shadow-accent-blue/30 hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
              onClick={handleGenerateAudit}
              disabled={isGeneratingAudit || !selectedProject}
            >
              {isGeneratingAudit && (
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              )}
              <span className="text-base">{isGeneratingAudit ? 'Generating...' : 'Generate Audit'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader; 