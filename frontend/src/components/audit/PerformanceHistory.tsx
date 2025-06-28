import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Trash2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmationDialog from '../ConfirmationDialog';

// Add a simple hook for media query
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-blue/90 border border-accent-blue rounded-lg p-3 text-white shadow-xl min-w-[120px] text-xs md:text-sm">
        <div className="font-bold text-accent-blue mb-1">{label}</div>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: entry.color }}></span>
            <span className="font-semibold">{entry.name}:</span>
            <span>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom legend styled like the reference image, but with dashboard accent colors
const CustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex gap-4 items-center mt-2 mb-4 justify-end pr-4">
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ background: entry.color, opacity: 0.9 }}></span>
          <span className="text-xs md:text-sm font-semibold text-white/80">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

interface PerformanceHistoryProps {
  chartData: any[];
  allAudits: any[];
  onAuditDeleted?: (auditId: number) => void;
}

const PerformanceHistory: React.FC<PerformanceHistoryProps> = ({ chartData, allAudits, onAuditDeleted }) => {
  const isMobile = useIsMobile();
  const chartHeight = isMobile ? 220 : 340;
  const xTickFontSize = isMobile ? 10 : 12;
  const yTickFontSize = isMobile ? 10 : 12;
  const xTickAngle = isMobile ? 0 : -20;
  const xTickHeight = isMobile ? 30 : 50;
  const [deletingAuditId, setDeletingAuditId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [auditToDelete, setAuditToDelete] = useState<any>(null);
  const [downloadingAuditId, setDownloadingAuditId] = useState<number | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const auditsPerPage = 8;

  // Calculate pagination
  const totalPages = Math.ceil(allAudits.length / auditsPerPage);
  const startIndex = (currentPage - 1) * auditsPerPage;
  const endIndex = startIndex + auditsPerPage;
  const currentAudits = allAudits.slice(startIndex, endIndex);
  const currentChartData = chartData.slice(startIndex, endIndex);

  const handleDeleteClick = (e: React.MouseEvent, audit: any) => {
    e.stopPropagation();
    setAuditToDelete(audit);
    setShowDeleteDialog(true);
  };

  const handleDownloadClick = async (e: React.MouseEvent, audit: any) => {
    e.stopPropagation();
    setDownloadingAuditId(audit.id);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/audit/by-id/${audit.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit data');
      }

      const auditData = await response.json();
      
      // Create a formatted JSON file for download
      const downloadData = {
        audit_id: audit.id,
        url: audit.url,
        timestamp: audit.timestamp,
        overall_score: audit.overall_score,
        mobile_performance_score: audit.mobile_performance_score,
        desktop_performance_score: audit.desktop_performance_score,
        pagespeed_data: audit.pagespeed_data,
        recommendations: audit.recommendations,
        lighthouse_mobile: audit.lighthouse_mobile,
        lighthouse_desktop: audit.lighthouse_desktop,
        created_at: audit.created_at,
        updated_at: audit.updated_at
      };

      // Create and download the file
      const blob = new Blob([JSON.stringify(downloadData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-${audit.id}-${new Date(audit.timestamp).toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Audit downloaded successfully');
    } catch (error) {
      console.error('Failed to download audit:', error);
      toast.error('Failed to download audit. Please try again.');
    } finally {
      setDownloadingAuditId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!auditToDelete) return;

    setDeletingAuditId(auditToDelete.id);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/audit/${auditToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete audit');
      }

      toast.success('Audit deleted successfully');
      
      // Call the callback to update parent component
      if (onAuditDeleted) {
        onAuditDeleted(auditToDelete.id);
      }
    } catch (error) {
      console.error('Failed to delete audit:', error);
      toast.error('Failed to delete audit. Please try again.');
    } finally {
      setDeletingAuditId(null);
      setAuditToDelete(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of the table
    const tableElement = document.querySelector('.audit-table-container');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Reset to first page when audits change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [allAudits.length]);

  return (
    <>
      <div className="w-full bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl shadow-xl border border-white/10 p-0 flex flex-col mt-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-accent-blue font-bold text-base md:text-xl mb-4 flex items-center gap-3 px-4 pt-6">
            <TrendingUp className="text-accent-blue w-5 h-5 md:w-6 md:h-6" />
            Performance Score & Audit History
          </div>
          <div className="w-full px-1 md:px-4 pb-6">
            <div className="rounded-xl border border-white/10 bg-dark-blue/60 p-2 md:p-4 shadow-sm">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.08}/>
                      </linearGradient>
                      <linearGradient id="colorMobile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.28}/>
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.07}/>
                      </linearGradient>
                      <linearGradient id="colorDesktop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.28}/>
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.07}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222b45" vertical={false} />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#22d3ee" 
                      fontSize={xTickFontSize} 
                      angle={xTickAngle} 
                      height={xTickHeight} 
                      tick={{ fill: '#a3aed6', fontWeight: 600 }} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#22d3ee" 
                      fontSize={yTickFontSize} 
                      tick={{ fill: '#a3aed6', fontWeight: 600 }} 
                      tickLine={false} 
                      axisLine={false} 
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, fill: '#3b82f6', fillOpacity: 0.07 }} />
                    <Legend content={<CustomLegend />} />
                    <Area 
                      type="monotone" 
                      dataKey="desktop_performance_score" 
                      stroke="#7c3aed" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorDesktop)" 
                      name="Desktop Score"
                      dot={false}
                      activeDot={false}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="mobile_performance_score" 
                      stroke="#22d3ee" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorMobile)" 
                      name="Mobile Score"
                      dot={false}
                      activeDot={false}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="overall_score" 
                      stroke="#3b82f6" 
                      strokeWidth={3.5} 
                      fillOpacity={1} 
                      fill="url(#colorOverall)" 
                      name="Overall Score"
                      dot={false}
                      activeDot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-white/80">No data available</div>
              )}
            </div>
          </div>
          
          {/* Pagination Info */}
          {allAudits.length > 0 && (
            <div className="px-8 pb-4">
              <div className="flex items-center justify-between text-sm text-light-gray">
                <div>
                  Showing {startIndex + 1} to {Math.min(endIndex, allAudits.length)} of {allAudits.length} audits
                </div>
                <div className="text-accent-blue font-medium">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto px-1 md:px-8 pb-4 custom-scrollbar audit-table-container">
            <div className="bg-gradient-to-r from-dark-blue/60 to-medium-blue/30 rounded-2xl border border-white/10 backdrop-blur-sm overflow-hidden">
              {currentAudits.length > 0 ? (
                <table className="min-w-full text-left text-white text-xs md:text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-dark-blue/60 to-medium-blue/30 border-b border-white/10">
                      <th className="py-3 md:py-4 px-2 md:px-4 font-semibold text-accent-blue">Date</th>
                      <th className="py-3 md:py-4 px-2 md:px-4 font-semibold text-accent-blue">URL</th>
                      <th className="py-3 md:py-4 px-2 md:px-4 font-semibold text-neon-cyan">Mobile</th>
                      <th className="py-3 md:py-4 px-2 md:px-4 font-semibold text-light-purple">Desktop</th>
                      <th className="py-3 md:py-4 px-2 md:px-4 font-semibold text-accent-blue">Overall</th>
                      <th className="py-3 md:py-4 px-2 md:px-4 font-semibold text-accent-blue">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAudits.map((audit, index) => (
                      <tr 
                        key={audit.id} 
                        className={`border-b border-white/10 hover:bg-accent-blue/5 transition-all duration-300 ${
                          index % 2 === 0 ? 'bg-dark-blue/20' : 'bg-transparent'
                        }`}
                      >
                        <td className="py-2 md:py-3 px-2 md:px-4 whitespace-nowrap text-white/90">
                          {currentChartData[index]?.timestamp}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4 max-w-[120px] md:max-w-[180px] truncate text-white/90">
                          {audit.url}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-neon-cyan/20 text-neon-cyan text-xs font-medium">
                            {audit.mobile_performance_score}
                          </span>
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-light-purple/20 text-light-purple text-xs font-medium">
                            {audit.desktop_performance_score}
                          </span>
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-accent-blue/20 text-accent-blue text-xs font-medium">
                            {audit.overall_score}
                          </span>
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleDownloadClick(e, audit)}
                              disabled={downloadingAuditId === audit.id}
                              className="p-1.5 text-accent-blue hover:text-blue-300 hover:bg-accent-blue/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Download audit"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(e, audit)}
                              disabled={deletingAuditId === audit.id}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete audit"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-full text-white/80">No data available</div>
              )}
            </div>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-8 pb-8">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-accent-blue to-light-purple text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 rounded-lg font-medium transition-all duration-300 ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-accent-blue to-light-purple text-white shadow-lg'
                          : 'bg-white/10 text-light-gray hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-accent-blue to-light-purple text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setAuditToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Audit"
        message={`Are you sure you want to delete this audit from ${auditToDelete?.timestamp ? new Date(auditToDelete.timestamp).toLocaleDateString() : 'unknown date'}? This action cannot be undone.`}
        confirmText="Delete Audit"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default PerformanceHistory;