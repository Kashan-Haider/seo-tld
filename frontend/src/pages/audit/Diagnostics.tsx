import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Monitor, Activity, BarChart3 } from 'lucide-react';

interface Diagnostic {
  title: string;
  description: string;
  score: number;
}

interface DiagnosticsPageProps {
  auditId?: string;
}

const Diagnostics: React.FC<DiagnosticsPageProps> = ({ auditId: propAuditId }) => {
  const { auditId: paramAuditId } = useParams<{ auditId: string }>();
  const auditId = propAuditId || paramAuditId;
  const navigate = useNavigate();
  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditData = async () => {
      if (!auditId) {
        setError('No audit ID provided');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`/api/audit/by-id/${auditId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          throw new Error(`Failed to fetch audit data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setAuditData(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load audit data');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
  }, [auditId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-blue flex items-center justify-center">
        <div className="text-white text-lg">Loading diagnostics...</div>
      </div>
    );
  }

  if (error || !auditData) {
    return (
      <div className="min-h-screen bg-dark-blue flex items-center justify-center">
        <div className="text-red-400 text-lg">{error || 'No audit data available'}</div>
      </div>
    );
  }

  const mobileDiagnostics = auditData.pagespeed_data?.mobile?.diagnostics || [];
  const desktopDiagnostics = auditData.pagespeed_data?.desktop?.diagnostics || [];

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-400';
    if (score >= 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.7) return 'Good';
    if (score >= 0.5) return 'Fair';
    return 'Poor';
  };

  const DiagnosticCard: React.FC<{ diagnostic: Diagnostic; device: 'mobile' | 'desktop' }> = ({ diagnostic, device }) => (
    <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 hover:border-accent-blue/30 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {device === 'mobile' ? (
            <Smartphone className="text-accent-blue w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <Monitor className="text-light-purple w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <h3 className="text-white font-semibold text-base sm:text-lg break-words">{diagnostic.title}</h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`px-2 sm:px-3 py-1 rounded-full font-semibold text-sm ${getScoreColor(diagnostic.score)}`}>
            {getScoreLabel(diagnostic.score)}
          </div>
          <div className="bg-white/10 px-2 sm:px-3 py-1 rounded-full">
            <span className="text-white font-semibold text-sm">{(diagnostic.score * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
      <p className="text-white/80 text-sm leading-relaxed break-words">{diagnostic.description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-blue p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors w-fit"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 break-words">Performance Diagnostics</h1>
            <p className="text-white/60 text-sm sm:text-base break-words">Detailed diagnostic information about your website's performance</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-accent-blue/20 to-accent-blue/5 rounded-xl p-4 sm:p-6 border border-accent-blue/20">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="text-accent-blue w-5 h-5 sm:w-6 sm:h-6" />
              <h2 className="text-lg sm:text-xl font-bold text-white break-words">Mobile Diagnostics</h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="text-2xl sm:text-3xl font-bold text-accent-blue">{mobileDiagnostics.length}</div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-accent-blue" />
                <span className="text-white/80 text-sm sm:text-base">Diagnostic items</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-light-purple/20 to-light-purple/5 rounded-xl p-4 sm:p-6 border border-light-purple/20">
            <div className="flex items-center gap-3 mb-4">
              <Monitor className="text-light-purple w-5 h-5 sm:w-6 sm:h-6" />
              <h2 className="text-lg sm:text-xl font-bold text-white break-words">Desktop Diagnostics</h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="text-2xl sm:text-3xl font-bold text-light-purple">{desktopDiagnostics.length}</div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-light-purple" />
                <span className="text-white/80 text-sm sm:text-base">Diagnostic items</span>
              </div>
            </div>
          </div>
        </div>

        {/* Score Legend */}
        <div className="bg-white/5 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="text-accent-blue w-5 h-5 sm:w-6 sm:h-6" />
            <h2 className="text-lg sm:text-xl font-bold text-white break-words">Score Legend</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full flex-shrink-0"></div>
              <span className="text-white/80 text-sm sm:text-base break-words">Excellent (90-100%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full flex-shrink-0"></div>
              <span className="text-white/80 text-sm sm:text-base break-words">Good (70-89%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-400 rounded-full flex-shrink-0"></div>
              <span className="text-white/80 text-sm sm:text-base break-words">Fair (50-69%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-400 rounded-full flex-shrink-0"></div>
              <span className="text-white/80 text-sm sm:text-base break-words">Poor (0-49%)</span>
            </div>
          </div>
        </div>

        {/* Mobile Diagnostics */}
        {mobileDiagnostics.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <Smartphone className="text-accent-blue w-5 h-5 sm:w-6 sm:h-6" />
                <h2 className="text-xl sm:text-2xl font-bold text-white break-words">Mobile Diagnostics</h2>
              </div>
              <span className="text-accent-blue font-semibold text-sm sm:text-base">({mobileDiagnostics.length} items)</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {mobileDiagnostics.map((diagnostic: Diagnostic, index: number) => (
                <DiagnosticCard key={`mobile-${index}`} diagnostic={diagnostic} device="mobile" />
              ))}
            </div>
          </div>
        )}

        {/* Desktop Diagnostics */}
        {desktopDiagnostics.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <Monitor className="text-light-purple w-5 h-5 sm:w-6 sm:h-6" />
                <h2 className="text-xl sm:text-2xl font-bold text-white break-words">Desktop Diagnostics</h2>
              </div>
              <span className="text-light-purple font-semibold text-sm sm:text-base">({desktopDiagnostics.length} items)</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {desktopDiagnostics.map((diagnostic: Diagnostic, index: number) => (
                <DiagnosticCard key={`desktop-${index}`} diagnostic={diagnostic} device="desktop" />
              ))}
            </div>
          </div>
        )}

        {mobileDiagnostics.length === 0 && desktopDiagnostics.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-white/60 text-base sm:text-lg break-words">No diagnostic information found for this audit.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Diagnostics; 