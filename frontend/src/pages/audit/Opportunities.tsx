import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Monitor, Clock, TrendingUp } from 'lucide-react';

interface Opportunity {
  title: string;
  description: string;
  savings_ms: number;
}

interface OpportunitiesPageProps {
  auditId?: string;
}

const Opportunities: React.FC<OpportunitiesPageProps> = ({ auditId: propAuditId }) => {
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
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/audit/by-id/${auditId}`, {
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
        <div className="text-white text-lg">Loading opportunities...</div>
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

  const mobileOpportunities = auditData.pagespeed_data?.mobile?.opportunities || [];
  const desktopOpportunities = auditData.pagespeed_data?.desktop?.opportunities || [];

  const totalMobileSavings = mobileOpportunities.reduce((sum: number, op: Opportunity) => sum + op.savings_ms, 0);
  const totalDesktopSavings = desktopOpportunities.reduce((sum: number, op: Opportunity) => sum + op.savings_ms, 0);

  const OpportunityCard: React.FC<{ opportunity: Opportunity; device: 'mobile' | 'desktop' }> = ({ opportunity, device }) => (
    <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 hover:border-accent-blue/30 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {device === 'mobile' ? (
            <Smartphone className="text-accent-blue w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <Monitor className="text-light-purple w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <h3 className="text-white font-semibold text-base sm:text-lg break-words">{opportunity.title}</h3>
        </div>
        <div className="flex items-center gap-2 bg-accent-blue/20 px-3 py-1 rounded-full w-fit flex-shrink-0">
          <Clock className="w-4 h-4 text-accent-blue" />
          <span className="text-accent-blue font-semibold text-sm">{opportunity.savings_ms}ms</span>
        </div>
      </div>
      <p className="text-white/80 text-sm leading-relaxed break-words">{opportunity.description}</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 break-words">Performance Opportunities</h1>
            <p className="text-white/60 text-sm sm:text-base break-words">Detailed analysis of performance improvement opportunities</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-accent-blue/20 to-accent-blue/5 rounded-xl p-4 sm:p-6 border border-accent-blue/20">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="text-accent-blue w-5 h-5 sm:w-6 sm:h-6" />
              <h2 className="text-lg sm:text-xl font-bold text-white break-words">Mobile Opportunities</h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="text-2xl sm:text-3xl font-bold text-accent-blue">{mobileOpportunities.length}</div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-accent-blue" />
                  <span className="text-white/80 text-sm sm:text-base">Potential savings:</span>
                </div>
                <span className="text-accent-blue font-semibold text-sm sm:text-base">{totalMobileSavings}ms</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-light-purple/20 to-light-purple/5 rounded-xl p-4 sm:p-6 border border-light-purple/20">
            <div className="flex items-center gap-3 mb-4">
              <Monitor className="text-light-purple w-5 h-5 sm:w-6 sm:h-6" />
              <h2 className="text-lg sm:text-xl font-bold text-white break-words">Desktop Opportunities</h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="text-2xl sm:text-3xl font-bold text-light-purple">{desktopOpportunities.length}</div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-light-purple" />
                  <span className="text-white/80 text-sm sm:text-base">Potential savings:</span>
                </div>
                <span className="text-light-purple font-semibold text-sm sm:text-base">{totalDesktopSavings}ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Opportunities */}
        {mobileOpportunities.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <Smartphone className="text-accent-blue w-5 h-5 sm:w-6 sm:h-6" />
                <h2 className="text-xl sm:text-2xl font-bold text-white break-words">Mobile Opportunities</h2>
              </div>
              <span className="text-accent-blue font-semibold text-sm sm:text-base">({mobileOpportunities.length} items)</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {mobileOpportunities.map((opportunity: Opportunity, index: number) => (
                <OpportunityCard key={`mobile-${index}`} opportunity={opportunity} device="mobile" />
              ))}
            </div>
          </div>
        )}

        {/* Desktop Opportunities */}
        {desktopOpportunities.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <Monitor className="text-light-purple w-5 h-5 sm:w-6 sm:h-6" />
                <h2 className="text-xl sm:text-2xl font-bold text-white break-words">Desktop Opportunities</h2>
              </div>
              <span className="text-light-purple font-semibold text-sm sm:text-base">({desktopOpportunities.length} items)</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {desktopOpportunities.map((opportunity: Opportunity, index: number) => (
                <OpportunityCard key={`desktop-${index}`} opportunity={opportunity} device="desktop" />
              ))}
            </div>
          </div>
        )}

        {mobileOpportunities.length === 0 && desktopOpportunities.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-white/60 text-base sm:text-lg break-words">No performance opportunities found for this audit.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Opportunities; 