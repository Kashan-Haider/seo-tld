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
    <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-accent-blue/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {device === 'mobile' ? (
            <Smartphone className="text-accent-blue w-5 h-5" />
          ) : (
            <Monitor className="text-light-purple w-5 h-5" />
          )}
          <h3 className="text-white font-semibold text-lg">{opportunity.title}</h3>
        </div>
        <div className="flex items-center gap-2 bg-accent-blue/20 px-3 py-1 rounded-full">
          <Clock className="w-4 h-4 text-accent-blue" />
          <span className="text-accent-blue font-semibold">{opportunity.savings_ms}ms</span>
        </div>
      </div>
      <p className="text-white/80 text-sm leading-relaxed">{opportunity.description}</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Performance Opportunities</h1>
            <p className="text-white/60">Detailed analysis of performance improvement opportunities</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-accent-blue/20 to-accent-blue/5 rounded-xl p-6 border border-accent-blue/20">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="text-accent-blue w-6 h-6" />
              <h2 className="text-xl font-bold text-white">Mobile Opportunities</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-accent-blue">{mobileOpportunities.length}</div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-blue" />
                <span className="text-white/80">Potential savings:</span>
                <span className="text-accent-blue font-semibold">{totalMobileSavings}ms</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-light-purple/20 to-light-purple/5 rounded-xl p-6 border border-light-purple/20">
            <div className="flex items-center gap-3 mb-4">
              <Monitor className="text-light-purple w-6 h-6" />
              <h2 className="text-xl font-bold text-white">Desktop Opportunities</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-light-purple">{desktopOpportunities.length}</div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-light-purple" />
                <span className="text-white/80">Potential savings:</span>
                <span className="text-light-purple font-semibold">{totalDesktopSavings}ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Opportunities */}
        {mobileOpportunities.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Smartphone className="text-accent-blue w-6 h-6" />
              <h2 className="text-2xl font-bold text-white">Mobile Opportunities</h2>
              <span className="text-accent-blue font-semibold">({mobileOpportunities.length} items)</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mobileOpportunities.map((opportunity: Opportunity, index: number) => (
                <OpportunityCard key={`mobile-${index}`} opportunity={opportunity} device="mobile" />
              ))}
            </div>
          </div>
        )}

        {/* Desktop Opportunities */}
        {desktopOpportunities.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Monitor className="text-light-purple w-6 h-6" />
              <h2 className="text-2xl font-bold text-white">Desktop Opportunities</h2>
              <span className="text-light-purple font-semibold">({desktopOpportunities.length} items)</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {desktopOpportunities.map((opportunity: Opportunity, index: number) => (
                <OpportunityCard key={`desktop-${index}`} opportunity={opportunity} device="desktop" />
              ))}
            </div>
          </div>
        )}

        {mobileOpportunities.length === 0 && desktopOpportunities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/60 text-lg">No performance opportunities found for this audit.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Opportunities; 