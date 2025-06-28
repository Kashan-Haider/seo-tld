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
    <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-accent-blue/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {device === 'mobile' ? (
            <Smartphone className="text-accent-blue w-5 h-5" />
          ) : (
            <Monitor className="text-light-purple w-5 h-5" />
          )}
          <h3 className="text-white font-semibold text-lg">{diagnostic.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full font-semibold ${getScoreColor(diagnostic.score)}`}>
            {getScoreLabel(diagnostic.score)}
          </div>
          <div className="bg-white/10 px-3 py-1 rounded-full">
            <span className="text-white font-semibold">{(diagnostic.score * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
      <p className="text-white/80 text-sm leading-relaxed">{diagnostic.description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-blue p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Performance Diagnostics</h1>
            <p className="text-white/60">Detailed diagnostic information about your website's performance</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-accent-blue/20 to-accent-blue/5 rounded-xl p-6 border border-accent-blue/20">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="text-accent-blue w-6 h-6" />
              <h2 className="text-xl font-bold text-white">Mobile Diagnostics</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-accent-blue">{mobileDiagnostics.length}</div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent-blue" />
                <span className="text-white/80">Diagnostic items</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-light-purple/20 to-light-purple/5 rounded-xl p-6 border border-light-purple/20">
            <div className="flex items-center gap-3 mb-4">
              <Monitor className="text-light-purple w-6 h-6" />
              <h2 className="text-xl font-bold text-white">Desktop Diagnostics</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-light-purple">{desktopDiagnostics.length}</div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-light-purple" />
                <span className="text-white/80">Diagnostic items</span>
              </div>
            </div>
          </div>
        </div>

        {/* Score Legend */}
        <div className="bg-white/5 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="text-accent-blue w-6 h-6" />
            <h2 className="text-xl font-bold text-white">Score Legend</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded-full"></div>
              <span className="text-white/80">Excellent (90-100%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
              <span className="text-white/80">Good (70-89%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
              <span className="text-white/80">Fair (50-69%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-400 rounded-full"></div>
              <span className="text-white/80">Poor (0-49%)</span>
            </div>
          </div>
        </div>

        {/* Mobile Diagnostics */}
        {mobileDiagnostics.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Smartphone className="text-accent-blue w-6 h-6" />
              <h2 className="text-2xl font-bold text-white">Mobile Diagnostics</h2>
              <span className="text-accent-blue font-semibold">({mobileDiagnostics.length} items)</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mobileDiagnostics.map((diagnostic: Diagnostic, index: number) => (
                <DiagnosticCard key={`mobile-${index}`} diagnostic={diagnostic} device="mobile" />
              ))}
            </div>
          </div>
        )}

        {/* Desktop Diagnostics */}
        {desktopDiagnostics.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Monitor className="text-light-purple w-6 h-6" />
              <h2 className="text-2xl font-bold text-white">Desktop Diagnostics</h2>
              <span className="text-light-purple font-semibold">({desktopDiagnostics.length} items)</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {desktopDiagnostics.map((diagnostic: Diagnostic, index: number) => (
                <DiagnosticCard key={`desktop-${index}`} diagnostic={diagnostic} device="desktop" />
              ))}
            </div>
          </div>
        )}

        {mobileDiagnostics.length === 0 && desktopDiagnostics.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/60 text-lg">No diagnostic information found for this audit.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Diagnostics; 