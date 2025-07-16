import React, { useState } from 'react';
import { BarChart3, Globe, KeyRound, Users, Save, Folder } from 'lucide-react';
import CompetitorKeywordLoadingScreen from '../components/competitor-analysis/CompetitorKeywordLoadingScreen';
import ContentGapLoadingScreen from '../components/competitor-analysis/ContentGapLoadingScreen';
import { useProjectStore } from '../store/projectStore';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const MAX_KEYWORDS = 5;
const MAX_COMPETITORS = 10;

const stepLabels = [
  'Your Website',
  'Keywords',
  'Competitors',
  'Results',
];

// Utility to convert analysisResult to CSV
function analysisResultToCSV(result: any): string {
  if (!result) return '';
  // Content Gaps
  const gapRows = (result.content_gaps || []).map((gap: any) => {
    if (typeof gap === 'string') {
      return ['Content Gap', gap, '', '', ''];
    } else {
      return [
        'Content Gap',
        gap.gap_topic || gap.gap_type || '',
        gap.why_it_matters || gap.explanation || '',
        gap.competitor_reference || '',
        gap.seo_impact || ''
      ];
    }
  });
  // Recommendations
  const recRows = (result.recommendations || []).map((rec: any) => {
    if (typeof rec === 'string') {
      return ['Recommendation', rec, '', '', '', ''];
    } else {
      return [
        'Recommendation',
        rec.title || '',
        rec.detail || '',
        rec.priority || '',
        rec.estimated_impact || '',
        rec.implementation_steps || ''
      ];
    }
  });
  const header = ['Type', 'Title/Gap Topic', 'Detail/Why it Matters', 'Competitor Reference/Priority', 'SEO Impact/Estimated Impact', 'Implementation Steps'];
  const rows = [header, ...gapRows, ...recRows];
  return rows.map(row => row.map((field: string) => `"${(field || '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

// Normalization function for recommendations
function normalizeRecommendations(recs: any[]): any[] {
  return (recs || []).map(rec => {
    if (typeof rec === 'string') return rec;
    // Handle backend format with recommendation_area, action_item, etc.
    if ('recommendation_area' in rec) {
      return {
        title: rec.recommendation_area || '',
        detail: rec.action_item || '',
        priority: '', // Not present in backend, set to empty
        estimated_impact: rec.seo_benefit || '',
        implementation_steps: rec.competitor_inspiration || ''
      };
    }
    // Handle expected frontend format
    return {
      title: rec.title || '',
      detail: rec.detail || '',
      priority: rec.priority || '',
      estimated_impact: rec.estimated_impact || '',
      implementation_steps: rec.implementation_steps || ''
    };
  });
}

function downloadAnalysisCSV(result: any) {
  const csv = analysisResultToCSV(result);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'competitor_analysis_result.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const CompetitorAnalysis: React.FC = () => {
  // Step management
  const [step, setStep] = useState(1);

  // Step 1: User website URL
  const [userUrl, setUserUrl] = useState('');
  const [userKeywords, setUserKeywords] = useState<string[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [keywordsError, setKeywordsError] = useState<string | null>(null);

  // Step 2: Competitor URLs
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([]);
  const [competitorsLoading, setCompetitorsLoading] = useState(false);
  const [competitorsError, setCompetitorsError] = useState<string | null>(null);

  // Step 3: Competitor keywords extraction & content gap
  const [competitorKeywords, setCompetitorKeywords] = useState<{[url: string]: string[]}>({});
  const [gapLoading, setGapLoading] = useState(false);
  const [gapError, setGapError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loadingScreen, setLoadingScreen] = useState<null | { type: 'competitor' | 'gap', progress: number, message: string }>(null);
  const { selectedProject } = useProjectStore();
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Step 1: Extract keywords from user URL
  const handleExtractKeywords = async () => {
    if (!userUrl.trim() || !userUrl.startsWith('http')) {
      setKeywordsError('Please enter a valid website URL (must start with http or https).');
      return;
    }
    setKeywordsLoading(true);
    setKeywordsError(null);
    setIsSaved(false); // Reset saved state when starting new analysis
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/competitor-analysis/extract-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url: userUrl })
      });
      if (!res.ok) throw new Error('Failed to extract keywords');
      const data = await res.json();
      setUserKeywords(data.keywords.slice(0, MAX_KEYWORDS));
      setStep(2);
    } catch (err: any) {
      setKeywordsError(err.message || 'An error occurred');
    } finally {
      setKeywordsLoading(false);
    }
  };

  // Step 2: Get competitor URLs for keywords
  const handleFindCompetitors = async () => {
    setCompetitorsLoading(true);
    setCompetitorsError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/competitor-analysis/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ keywords: userKeywords })
      });
      if (!res.ok) throw new Error('Failed to get competitor URLs');
      const data = await res.json();
      setCompetitorUrls(data.slice(0, MAX_COMPETITORS));
      setStep(3);
    } catch (err: any) {
      setCompetitorsError(err.message || 'An error occurred');
    } finally {
      setCompetitorsLoading(false);
    }
  };

  // Step 3: Extract competitor keywords and analyze content gap
  const handleAnalyze = async () => {
    setGapLoading(true);
    setGapError(null);
    setAnalysisResult(null);
    setLoadingScreen({ type: 'competitor', progress: 0, message: `Extracting competitor keywords for ${competitorUrls.length} competitors... (0s)` });
    try {
      const token = localStorage.getItem('access_token');
      // 1. Extract competitor keywords (async task)
      const res1 = await fetch('/api/competitor-analysis/keywords-for-competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ urls: competitorUrls })
      });
      if (!res1.ok) throw new Error('Failed to start competitor keyword extraction');
      const { task_id: keywordsTaskId } = await res1.json();
      // Poll for result
      let keywordsResult = null;
      for (let i = 0; i < 210; i++) { // up to 210s
        setLoadingScreen({ type: 'competitor', progress: Math.round((i / 210) * 100), message: `Extracting competitor keywords for ${competitorUrls.length} competitors... (${i + 1}s)` });
        await new Promise(r => setTimeout(r, 1000));
        const pollRes = await fetch(`/api/competitor-analysis/keywords-task-status/${keywordsTaskId}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        const pollData = await pollRes.json();
        if (pollData.status === 'SUCCESS') {
          keywordsResult = pollData.result;
          break;
        } else if (pollData.status === 'FAILURE') {
          throw new Error('Competitor keyword extraction failed');
        }
      }
      if (!keywordsResult) throw new Error('Competitor keyword extraction timed out');
      setCompetitorKeywords(keywordsResult);
      setLoadingScreen({ type: 'gap', progress: 0, message: 'Analyzing content gaps and recommendations...' });
      // 2. Analyze content gap (async task)
      const res2 = await fetch('/api/competitor-analysis/content-gap-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ user_keywords: userKeywords, competitor_keywords_dict: keywordsResult, user_url: userUrl, competitor_urls: competitorUrls })
      });
      if (!res2.ok) throw new Error('Failed to start content gap analysis');
      const { task_id: gapTaskId } = await res2.json();
      // Poll for result
      let gapResult = null;
      for (let i = 0; i < 210; i++) { // up to 210s
        setLoadingScreen({ type: 'gap', progress: Math.round((i / 210) * 100), message: `Analyzing content gaps and recommendations... (${i + 1}s)` });
        await new Promise(r => setTimeout(r, 1000));
        const pollRes = await fetch(`/api/competitor-analysis/content-gap-task-status/${gapTaskId}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        const pollData = await pollRes.json();
        if (pollData.status === 'SUCCESS') {
          gapResult = pollData.result;
          break;
        } else if (pollData.status === 'FAILURE') {
          throw new Error('Content gap analysis failed');
        }
      }
      setLoadingScreen(null);
      // Defensive: If gapResult is empty or malformed, show fallback message and advance step
      if (!gapResult || typeof gapResult !== 'object' || (!gapResult.content_gaps && !gapResult.recommendations)) {
        setAnalysisResult({ content_gaps: [], recommendations: ['No analysis result returned. Please try again or check your input.'] });
        setStep(4);
        return;
      }
      setAnalysisResult(gapResult);
      setStep(4);
    } catch (err: any) {
      setGapError(err.message || 'An error occurred');
      setLoadingScreen(null);
    } finally {
      setGapLoading(false);
    }
  };

  // Save analysis handler
  const handleSaveAnalysis = async () => {
    if (!selectedProject || !analysisResult) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        project_id: selectedProject.id,
        user_url: userUrl,
        competitor_urls: competitorUrls,
        competitor_keywords: competitorKeywords,
        content_gaps: analysisResult.content_gaps,
        recommendations: analysisResult.recommendations,
        analysis_type: 'full',
      };
      const res = await fetch('/api/competitor-analysis/save-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to save analysis');
      }
      toast.success('Analysis saved successfully!');
      setIsSaved(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save analysis');
    } finally {
      setSaving(false);
    }
  };

  // Editable keyword list
  const handleKeywordChange = (idx: number, value: string) => {
    setUserKeywords(keywords => keywords.map((k, i) => i === idx ? value : k));
  };
  const handleAddKeyword = () => {
    if (userKeywords.length < MAX_KEYWORDS) setUserKeywords([...userKeywords, '']);
  };
  const handleRemoveKeyword = (idx: number) => {
    setUserKeywords(keywords => keywords.filter((_, i) => i !== idx));
  };

  // Editable competitor URL list
  const handleCompetitorUrlChange = (idx: number, value: string) => {
    setCompetitorUrls(urls => urls.map((u, i) => i === idx ? value : u));
  };
  const handleAddCompetitorUrl = () => {
    if (competitorUrls.length < MAX_COMPETITORS) setCompetitorUrls([...competitorUrls, '']);
  };
  const handleRemoveCompetitorUrl = (idx: number) => {
    setCompetitorUrls(urls => urls.filter((_, i) => i !== idx));
  };

  return (
    <div className="w-full min-h-full bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue flex flex-col items-center justify-center py-10 px-2 md:px-8 lg:px-16">
      {loadingScreen && loadingScreen.type === 'competitor' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-blue/90 backdrop-blur-lg">
          <CompetitorKeywordLoadingScreen message={loadingScreen.message} />
        </div>
      )}
      {loadingScreen && loadingScreen.type === 'gap' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-blue/90 backdrop-blur-lg">
          <ContentGapLoadingScreen message={loadingScreen.message} />
        </div>
      )}
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 items-center">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 mb-6 relative">
          <div className="flex items-center gap-3">
            <BarChart3 size={40} className="text-accent-blue drop-shadow-lg" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">Competitor Analysis</h1>
          </div>
          <Link
            to="/saved-analyses"
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-bold shadow-lg border border-accent-blue/30 hover:from-light-purple hover:to-accent-blue hover:scale-105 transition-all duration-200 text-lg mt-4 sm:mt-0 whitespace-nowrap"
            style={{ minWidth: '220px', justifyContent: 'center' }}
          >
            <Folder size={24} className="text-white" />
            View Saved Analyses
          </Link>
        </div>
        <p className="text-white/70 text-lg text-center max-w-xl mt-2 mb-2">Analyze your website and top competitors to discover actionable content gaps and SEO opportunities. Get clear, AI-powered recommendations to boost your rankings.</p>
        {/* Stepper */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {stepLabels.map((label, idx) => {
            // Only allow navigation to steps already completed or current
            const isClickable = idx + 1 < step || idx + 1 === step;
            return (
              <div
                key={label}
                className={`flex flex-col items-center gap-3 cursor-pointer ${isClickable ? 'hover:scale-105' : 'opacity-60 cursor-not-allowed'} transition-transform duration-200`}
                onClick={() => {
                  if (isClickable) setStep(idx + 1);
                }}
                tabIndex={isClickable ? 0 : -1}
                role="button"
                aria-disabled={!isClickable}
              >
                <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-accent-blue to-light-purple shadow-lg border-2 border-white/10 ${step === idx + 1 ? 'ring-4 ring-accent-blue scale-110' : ''} transition-transform duration-200`}>
                  {idx === 0 && <Globe size={24} className="text-white" />}
                  {idx === 1 && <KeyRound size={24} className="text-white" />}
                  {idx === 2 && <Users size={24} className="text-white" />}
                  {idx === 3 && <BarChart3 size={24} className="text-white" />}
                </div>
                <span className={`text-xs font-semibold mt-1 ${step === idx + 1 ? 'text-accent-blue' : 'text-white/60'}`}>{label}</span>
              </div>
            );
          })}
        </div>
        {/* Card Container */}
        <div className="w-full bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl shadow-2xl border border-white/10 p-8 flex flex-col gap-8 items-center max-w-full overflow-x-auto">
          {/* Step 1: User URL */}
          {step === 1 && (
            <div className="w-full flex flex-col items-center gap-6">
              <label className="text-white/90 font-bold text-2xl flex items-center gap-3">
                <Globe size={28} className="text-accent-blue" />
                Enter your website URL
              </label>
              <input
                type="text"
                className="w-full max-w-md px-6 py-4 rounded-xl bg-gradient-to-r from-dark-blue/80 to-medium-blue text-white border border-white/10 focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-300 text-lg backdrop-blur-sm shadow-lg"
                value={userUrl}
                onChange={e => setUserUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                disabled={keywordsLoading}
              />
              <button
                className="w-full max-w-md h-14 px-6 rounded-xl bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-bold shadow-lg hover:shadow-accent-blue/30 hover:scale-105 transition-all duration-300 text-lg flex items-center justify-center gap-3"
                onClick={handleExtractKeywords}
                disabled={keywordsLoading || !userUrl.trim() || !userUrl.startsWith('http')}
              >
                <KeyRound size={26} />
                {keywordsLoading ? 'Extracting...' : 'Extract Keywords'}
              </button>
              {keywordsError && <div className="text-red-400 text-base mt-2">{keywordsError}</div>}
              <div className="mt-2 text-white/70 text-sm text-center">Paste your homepage or main service page URL to get started. We’ll analyze your site and extract the most relevant keywords for your business.</div>
            </div>
          )}
          {/* Step 2: Keywords */}
          {step === 2 && (
            <div className="w-full flex flex-col items-center gap-6">
              <label className="text-white/90 font-bold text-2xl flex items-center gap-3">
                <KeyRound size={28} className="text-accent-blue" />
                Edit your keywords (max 5)
              </label>
              <div className="space-y-3 w-full max-w-md">
                {userKeywords.map((kw, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="text"
                      className="w-full px-5 py-3 rounded-lg bg-dark-blue/80 text-white border border-white/10 focus:outline-none focus:border-accent-blue text-lg shadow"
                      value={kw}
                      onChange={e => handleKeywordChange(idx, e.target.value)}
                    />
                    <button className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition" onClick={() => handleRemoveKeyword(idx)} disabled={userKeywords.length <= 1}>Remove</button>
                  </div>
                ))}
                <button className="mt-2 w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition" onClick={handleAddKeyword} disabled={userKeywords.length >= MAX_KEYWORDS}>Add Keyword</button>
              </div>
              <button
                className="w-full max-w-md h-14 px-6 rounded-xl bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-bold shadow-lg hover:shadow-accent-blue/30 hover:scale-105 transition-all duration-300 text-lg flex items-center justify-center gap-3"
                onClick={handleFindCompetitors}
                disabled={competitorsLoading || userKeywords.length === 0}
              >
                <Users size={26} />
                {competitorsLoading ? 'Finding...' : 'Find Competitors'}
              </button>
              {competitorsError && <div className="text-red-400 text-base mt-2">{competitorsError}</div>}
              <div className="mt-2 text-white/70 text-sm text-center">Edit or add keywords to better match your business focus. These will be used to find your top competitors.</div>
            </div>
          )}
          {/* Step 3: Competitor URLs */}
          {step === 3 && (
            <div className="w-full flex flex-col items-center gap-6">
              <label className="text-white/90 font-bold text-2xl flex items-center gap-3">
                <Users size={28} className="text-accent-blue" />
                Edit competitor URLs (max 10)
              </label>
              <div className="space-y-3 w-full max-w-md">
                {competitorUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="text"
                      className="w-full px-5 py-3 rounded-lg bg-dark-blue/80 text-white border border-white/10 focus:outline-none focus:border-accent-blue text-lg shadow"
                      value={url}
                      onChange={e => handleCompetitorUrlChange(idx, e.target.value)}
                    />
                    <button className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition" onClick={() => handleRemoveCompetitorUrl(idx)} disabled={competitorUrls.length <= 1}>Remove</button>
                  </div>
                ))}
                <button className="mt-2 w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition" onClick={handleAddCompetitorUrl} disabled={competitorUrls.length >= MAX_COMPETITORS}>Add Competitor</button>
              </div>
              <button
                className="w-full max-w-md h-14 px-6 rounded-xl bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-bold shadow-lg hover:shadow-accent-blue/30 hover:scale-105 transition-all duration-300 text-lg flex items-center justify-center gap-3"
                onClick={handleAnalyze}
                disabled={gapLoading || competitorUrls.length === 0}
              >
                <BarChart3 size={26} />
                {gapLoading ? 'Analyzing...' : 'Analyze'}
              </button>
              {gapError && <div className="text-red-400 text-base mt-2">{gapError}</div>}
              <div className="mt-2 text-white/70 text-sm text-center">Review and adjust competitor URLs. These sites will be analyzed for keyword and content gaps.</div>
            </div>
          )}
          {/* Step 4: Results */}
          {step === 4 && (
            <div className="w-full flex flex-col items-center gap-8">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-accent-blue flex items-center gap-3">
                <BarChart3 size={32} className="text-accent-blue" /> Analysis Results & Recommendations
              </h2>
              {/* Competitor Keywords Section */}
              <div className="w-full mb-6">
                <h3 className="font-bold text-xl text-white mb-3 flex items-center gap-2">
                  <Users size={22} className="text-accent-blue" /> Competitor Keywords
                </h3>
                {competitorUrls.length === 0 || Object.keys(competitorKeywords).length === 0 ? (
                  <div className="text-white/70 italic">No competitor keywords found.</div>
                ) : (
                  <div className="space-y-6">
                    {competitorUrls.map((url) => (
                      <div key={url} className="bg-gradient-to-r from-medium-blue/60 to-dark-blue rounded-xl p-4 shadow border border-white/10">
                        <div className="text-accent-blue font-semibold mb-2 break-all">{url}</div>
                        {competitorKeywords[url] && competitorKeywords[url].length > 0 ? (
                          <ul className="flex flex-wrap gap-2">
                            {competitorKeywords[url].map((kw, i) => (
                              <li key={i} className="bg-accent-blue/20 text-accent-blue px-3 py-1 rounded-lg text-sm font-medium shadow-sm break-words">{kw}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-white/60 italic">No keywords extracted.</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {analysisResult ? (
                <>
                 
                  <div className="w-full flex flex-col gap-8">
                    <div className="w-full">
                      <h3 className="font-bold text-xl text-white mb-3 flex items-center gap-2">
                        <KeyRound size={22} className="text-accent-blue" /> Content Gaps
                      </h3>
                      <ul className="space-y-4">
                        {analysisResult.content_gaps && analysisResult.content_gaps.map((gap: any, idx: number) => (
                          <li key={idx} className="bg-gradient-to-r from-medium-blue/70 to-dark-blue rounded-xl p-5 shadow-lg border border-white/10 break-words">
                            {gap && typeof gap === 'object' && gap.gap_topic ? (
                              <div className="space-y-3">
                                <div className="font-bold text-accent-blue text-lg break-words">{gap.gap_topic}</div>
                                {gap.why_it_matters && (
                                  <div className="text-white/90 break-words">
                                    <span className="font-semibold text-white">Why it matters:</span> {gap.why_it_matters}
                                  </div>
                                )}
                                {gap.competitor_reference && (
                                  <div className="text-white/70 text-sm break-all">
                                    <span className="font-semibold">Competitor Reference:</span> {gap.competitor_reference}
                                  </div>
                                )}
                              </div>
                            ) : typeof gap === 'string' ? (
                              <span className="text-white/90 text-base break-words">{gap}</span>
                            ) : (
                              <div className="space-y-2">
                                {gap.gap_type && <div className="font-bold text-accent-blue text-lg break-words">{gap.gap_type}</div>}
                                {gap.explanation && <div className="text-white/90 break-words"><span className="font-semibold">Why it matters:</span> {gap.explanation}</div>}
                                {gap.seo_impact && <div className="text-green-400 break-words"><span className="font-semibold">SEO Impact:</span> {gap.seo_impact}</div>}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="w-full">
                      <h3 className="font-bold text-xl text-white mb-3 flex items-center gap-2">
                        <Users size={22} className="text-accent-blue" /> Recommendations
                      </h3>
                      <ul className="space-y-4">
                        {normalizeRecommendations(analysisResult.recommendations).map((rec: any, idx: number) => (
                          <li key={idx} className="bg-gradient-to-r from-medium-blue/70 to-dark-blue rounded-xl p-5 shadow-lg border border-white/10 break-words">
                            {typeof rec === 'string' ? (
                              <span className="text-white/90 text-base break-words">{rec}</span>
                            ) : (
                              <div className="space-y-3">
                                <div className="font-bold text-accent-blue text-lg break-words">{rec.title}</div>
                                <div className="text-white/90 break-words">{rec.detail}</div>
                                <div className="text-white/70 break-words">
                                  <span className="font-semibold">Estimated Impact:</span> {rec.estimated_impact}
                                </div>
                                <div className="text-white/70 break-words">
                                  <span className="font-semibold">Implementation Steps:</span>
                                  <div className="mt-1 text-sm break-words">{rec.implementation_steps}</div>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4 mb-4">
                    <button
                      className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg border border-green-400/30 transition-all duration-200 flex items-center gap-2"
                      onClick={() => downloadAnalysisCSV(analysisResult)}
                    >
                      Download CSV
                    </button>
                    <button
                      className={`px-6 py-3 rounded-xl font-bold shadow-lg border transition-all duration-200 flex items-center gap-2 disabled:opacity-60 ${
                        isSaved 
                          ? 'bg-green-600 text-white border-green-400/30 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400/30'
                      }`}
                      onClick={handleSaveAnalysis}
                      disabled={saving || !analysisResult || isSaved}
                    >
                      <Save size={20} />
                      {saving ? 'Saving...' : isSaved ? 'Saved' : 'Save Analysis'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-white/80">No analysis result yet.</div>
              )}
              <div className="flex flex-col md:flex-row gap-4 mt-8 w-full">
                <button
                  className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-bold shadow-lg hover:shadow-accent-blue/30 hover:scale-105 transition-all duration-300 text-lg flex items-center justify-center gap-3"
                  onClick={() => {
                    setStep(1);
                    setIsSaved(false); // Reset saved state when starting new analysis
                  }}
                >
                  <Globe size={22} /> Start New Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitorAnalysis; 