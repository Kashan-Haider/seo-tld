import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { AuditReportCardProps, Opportunity } from '../../typing';

const CircularScore: React.FC<{ label: string; score: number; color: string }> = ({ label, score, color }) => (
  <div className="flex flex-col items-center justify-center w-32 h-32">
    <div style={{ width: 110, height: 110 }}>
      <RadialBarChart
        width={110}
        height={110}
        cx="50%"
        cy="50%"
        innerRadius={38}
        outerRadius={52}
        barSize={14}
        data={[{ name: label, value: score }]}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar
          background
          dataKey="value"
          fill={color}
        />
      </RadialBarChart>
    </div>
    <div className="text-2xl font-extrabold text-white mt-2">{score}</div>
    <div className="text-base font-semibold text-white/80 mt-1">{label}</div>
  </div>
);

const Metric: React.FC<{ label: string; value: number | string; unit?: string }> = ({ label, value, unit }) => (
  <div className="flex flex-col items-center px-2">
    <div className="text-xs text-white/60">{label}</div>
    <div className="text-base font-semibold text-white">{value}{unit}</div>
  </div>
);

// Add a type guard for Opportunity
function isOpportunityArray(arr: any[]): arr is Opportunity[] {
  return arr.length > 0 && typeof arr[0] === 'object' && 'title' in arr[0];
}

const AuditReportCard: React.FC<AuditReportCardProps> = ({
  auditId,
  url,
  timestamp,
  overall_score,
  mobile_performance_score,
  desktop_performance_score,
  recommendations,
  pagespeed_data,
}) => {
  const navigate = useNavigate();

  // Defensive: handle missing or incomplete data
  if (!pagespeed_data || !pagespeed_data.mobile || !pagespeed_data.desktop) {
    return (
      <div className="w-full mx-auto bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-3xl shadow-2xl border border-white/10 p-6 md:p-10 mb-8 flex flex-col gap-6 animate-fade-in text-white text-center">
        <div className="text-lg font-bold mb-2">Audit Report</div>
        <div className="text-red-400">Audit data is incomplete or missing.</div>
      </div>
    );
  }

  const handleOpportunitiesClick = () => {
    navigate(`/audit/${auditId}/opportunities`);
  };

  const handleDiagnosticsClick = () => {
    navigate(`/audit/${auditId}/diagnostics`);
  };

  return (
    <div className="w-full mx-auto bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-3xl shadow-2xl border border-white/10 p-6 md:p-10 mb-8 flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div>
          <div className="text-white/80 text-lg font-semibold">Audit Report</div>
          <div className="text-accent-blue text-sm">{new Date(timestamp).toLocaleString()}</div>
        </div>
        <div className="text-light-gray text-xs truncate">{url}</div>
      </div>
      <div className="flex flex-col md:flex-row gap-14 items-center justify-between mt-2 mb-2">
        <CircularScore label="Mobile" score={mobile_performance_score} color="#00C9FF" />
        <CircularScore label="Desktop" score={desktop_performance_score} color="#A259FF" />
        <CircularScore label="Overall" score={overall_score} color="#FF7A59" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mobile Metrics */}
        <div className="bg-white/5 rounded-xl p-6 flex flex-col gap-3">
          <div className="text-accent-blue font-bold text-lg mb-2">Mobile Metrics</div>
          <div className="flex flex-wrap gap-4 text-lg">
            <Metric label="FCP" value={pagespeed_data.mobile.fcp} unit="s" />
            <Metric label="LCP" value={pagespeed_data.mobile.lcp} unit="s" />
            <Metric label="CLS" value={pagespeed_data.mobile.cls} />
            <Metric label="FID" value={pagespeed_data.mobile.fid} unit="ms" />
            <Metric label="TTFB" value={pagespeed_data.mobile.ttfb} unit="ms" />
          </div>
          <div className="mt-3">
            <button
              onClick={handleOpportunitiesClick}
              className="text-lg text-accent-blue hover:text-accent-blue/80 mb-1 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Top Opportunities
              <ExternalLink className="w-3 h-3" />
            </button>
            <ul className="list-disc list-inside text-white/90 text-base">
              {pagespeed_data.mobile.opportunities.slice(0, 3).map((op, i) => (
                <li key={i}>{op.title} <span className="text-accent-blue">({op.savings_ms}ms)</span></li>
              ))}
            </ul>
          </div>
          <div className="mt-2">
            <button
              onClick={handleDiagnosticsClick}
              className="text-lg text-accent-blue hover:text-accent-blue/80 mb-1 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Diagnostics
              <ExternalLink className="w-3 h-3" />
            </button>
            <ul className="list-disc list-inside text-white/80 text-base">
              {pagespeed_data.mobile.diagnostics.slice(0, 3).map((diag, i) => (
                <li key={i}>{diag.title}: <span className="text-accent-blue">{diag.score}</span></li>
              ))}
            </ul>
          </div>
        </div>
        {/* Desktop Metrics */}
        <div className="bg-white/5 rounded-xl p-6 flex flex-col gap-3">
          <div className="text-light-purple font-bold text-lg mb-2">Desktop Metrics</div>
          <div className="flex flex-wrap gap-4 text-lg">
            <Metric label="FCP" value={pagespeed_data.desktop.fcp} unit="s" />
            <Metric label="LCP" value={pagespeed_data.desktop.lcp} unit="s" />
            <Metric label="CLS" value={pagespeed_data.desktop.cls} />
            <Metric label="FID" value={pagespeed_data.desktop.fid} unit="ms" />
            <Metric label="TTFB" value={pagespeed_data.desktop.ttfb} unit="ms" />
          </div>
          <div className="mt-3">
            <button
              onClick={handleOpportunitiesClick}
              className="text-lg text-light-purple hover:text-light-purple/80 mb-1 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Top Opportunities
              <ExternalLink className="w-3 h-3" />
            </button>
            <ul className="list-disc list-inside text-white/90 text-base">
              {pagespeed_data.desktop.opportunities.slice(0, 3).map((op, i) => (
                <li key={i}>{op.title} <span className="text-light-purple">({op.savings_ms}ms)</span></li>
              ))}
            </ul>
          </div>
          <div className="mt-2">
            <button
              onClick={handleDiagnosticsClick}
              className="text-lg text-light-purple hover:text-light-purple/80 mb-1 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Diagnostics
              <ExternalLink className="w-3 h-3" />
            </button>
            <ul className="list-disc list-inside text-white/80 text-base">
              {pagespeed_data.desktop.diagnostics.slice(0, 3).map((diag, i) => (
                <li key={i}>{diag.title}: <span className="text-light-purple">{diag.score}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="bg-white/5 rounded-xl p-6">
        <div className="text-white/90 font-bold text-lg mb-2">Recommendations</div>
        <ul className="list-disc list-inside text-white/90 text-base">
          {Array.isArray(recommendations) && recommendations.length > 0 ? (
            isOpportunityArray(recommendations) ? (
              recommendations.map((rec, i) => (
                <li key={i}>
                  {rec.title}
                  {rec.savings_ms !== undefined && (
                    <span className="text-accent-blue"> ({rec.savings_ms}ms)</span>
                  )}
                </li>
              ))
            ) : (
              (recommendations as string[]).map((rec, i) => (
                <li key={i}>{rec}</li>
              ))
            )
          ) : (
            <li>No recommendations available.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default AuditReportCard; 