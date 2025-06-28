import React from 'react';
import { Search, Menu, Grid3X3, Calendar, Globe } from 'lucide-react';
import { useSidebarStore } from '../../store/sidebarStore';

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
  const openSidebar = useSidebarStore((state) => state.open);

  return (
    <header className="w-full bg-gradient-to-br from-dark-blue/95 via-dark-blue/90 to-dark-blue/95 border-b border-white/10 sticky top-0 z-30 backdrop-blur-sm">
      {/* Mobile Grid Layout */}
      <div className="block md:hidden">
        {/* Top Row - Menu and Search */}
        <div className="grid grid-cols-12 gap-2 p-3">
          {/* Menu Button */}
          <div className="col-span-2">
            <button
              onClick={openSidebar}
              className="w-full h-12 rounded-xl bg-gradient-to-br from-medium-blue to-accent-blue/20 border border-white/10 text-white hover:from-accent-blue/30 hover:to-medium-blue transition-all duration-300 shadow-lg hover:shadow-accent-blue/20 flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="col-span-10 relative">
            <div className="relative w-full h-12">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-light-gray z-10" />
              <input
                className="w-full h-full pl-12 pr-4 rounded-xl bg-gradient-to-r from-medium-blue/80 to-medium-blue text-white border border-white/10 focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-300 text-base backdrop-blur-sm"
                placeholder="Search projects..."
                value={search || (selectedProject ? selectedProject.name : '')}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
              />
            </div>
            {dropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-gradient-to-br from-dark-blue to-medium-blue border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto backdrop-blur-md">
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

        {/* Second Row - Project Info and Audit Controls */}
        {allAudits.length > 0 && (
          <div className="grid grid-cols-12 gap-2 px-3 pb-3">
            {/* Project Info Card */}
            <div className="col-span-6">
              <div className="h-16 rounded-xl bg-gradient-to-br from-medium-blue/60 to-medium-blue/40 border border-white/10 p-3 flex flex-col justify-center backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Grid3X3 size={16} className="text-accent-blue" />
                  <span className="text-xs text-white/70 font-medium">PROJECT</span>
                </div>
                <span className="text-sm text-white font-semibold truncate">
                  {selectedProject?.name || 'Select Project'}
                </span>
              </div>
            </div>

            {/* Audit Selection */}
            <div className="col-span-6 relative">
              <button
                className="w-full h-16 rounded-xl bg-gradient-to-br from-medium-blue/60 to-medium-blue/40 border border-white/10 focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-300 backdrop-blur-sm flex flex-col justify-center px-3"
                onClick={() => setAuditDropdownOpen(!auditDropdownOpen)}
              >
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-accent-blue" />
                  <span className="text-xs text-white/70 font-medium">AUDIT</span>
                </div>
                <span className="text-sm text-white font-semibold truncate">
                  {selectedAudit ? new Date(selectedAudit.timestamp).toLocaleDateString() : 'Select Audit'}
                </span>
              </button>
              {auditDropdownOpen && (
                <div className="absolute right-0 mt-2 bg-gradient-to-br from-dark-blue to-medium-blue border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto min-w-[280px] backdrop-blur-md">
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
          </div>
        )}

        {/* Third Row - Generate Audit Button */}
        {allAudits.length > 0 && (
          <div className="grid grid-cols-12 gap-2 px-3 pb-3">
            <div className="col-span-12">
              <button
                className="w-full h-14 rounded-xl bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-bold shadow-lg hover:shadow-accent-blue/30 hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
                onClick={handleGenerateAudit}
                disabled={isGeneratingAudit || !selectedProject}
              >
                {isGeneratingAudit && (
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                )}
                <span className="text-lg">{isGeneratingAudit ? 'Generating...' : 'Generate Audit'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Layout - Keep existing */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-3 md:px-6 py-3 md:py-4">
        {/* Mobile Menu Button */}
        <button
          onClick={openSidebar}
          className="md:hidden p-2 rounded-lg bg-medium-blue border border-white/10 text-white hover:bg-accent-blue/20 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        
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
      </div>
    </header>
  );
};

export default DashboardHeader; 