import React, { useState } from 'react';
import { BarChart3, Globe, KeyRound, Users } from 'lucide-react';

const MAX_KEYWORDS = 5;
const MAX_COMPETITORS = 10;

const stepLabels = [
  'Your Website',
  'Keywords',
  'Competitors',
  'Results',
];

const accent = 'from-accent-blue via-light-purple to-accent-blue';

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
  const [gapTaskId, setGapTaskId] = useState<string | null>(null);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapError, setGapError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Step 1: Extract keywords from user URL
  const handleExtractKeywords = async () => {
    if (!userUrl.trim() || !userUrl.startsWith('http')) {
      setKeywordsError('Please enter a valid website URL (must start with http or https).');
      return;
    }
    setKeywordsLoading(true);
    setKeywordsError(null);
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
      for (let i = 0; i < 180; i++) { // up to 180s
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
      // 2. Analyze content gap (async task)
      const res2 = await fetch('/api/competitor-analysis/content-gap-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ user_keywords: userKeywords, competitor_keywords_dict: keywordsResult })
      });
      if (!res2.ok) throw new Error('Failed to start content gap analysis');
      const { task_id: gapTaskId } = await res2.json();
      setGapTaskId(gapTaskId);
      // Poll for result
      let gapResult = null;
      for (let i = 0; i < 180; i++) { // up to 180s
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
      if (!gapResult) throw new Error('Content gap analysis timed out');
      setAnalysisResult(gapResult);
      setStep(4);
    } catch (err: any) {
      setGapError(err.message || 'An error occurred');
    } finally {
      setGapLoading(false);
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
    <div className="w-full min-h-screen bg-dark-blue flex flex-col items-center py-10 px-4 md:px-20 lg:px-40">
      <div className="w-full mx-auto flex flex-col gap-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <BarChart3 size={32} className="text-accent-blue" />
          Competitor Analysis
        </h1>
        {/* Stepper */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {stepLabels.map((label, idx) => (
            <div key={label} className="flex items-center gap-2">
              <button
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all duration-200 ${
                  step === idx + 1
                    ? 'bg-gradient-to-br ' + accent + ' text-white border-accent-blue scale-110 shadow-lg'
                    : 'bg-medium-blue text-white/60 border-white/20 hover:bg-accent-blue/20'
                }`}
                onClick={() => setStep(idx + 1)}
                disabled={
                  (idx === 1 && userKeywords.length === 0) ||
                  (idx === 2 && competitorUrls.length === 0) ||
                  (idx === 3 && !analysisResult)
                }
              >
                {idx + 1}
              </button>
              {idx < stepLabels.length - 1 && <span className="w-8 h-1 bg-gradient-to-r from-accent-blue to-light-purple rounded" />}
            </div>
          ))}
        </div>
        {/* Card Container */}
        <div className="bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl shadow-xl border border-white/10 p-8 flex flex-col gap-4 w-full max-w-2xl mx-auto">
          {step === 1 && (
            <div>
              <label className="text-white/80 font-semibold text-lg flex items-center gap-2">
                <Globe size={20} className="text-accent-blue" />
                Enter your website URL
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-medium-blue/80 to-medium-blue text-white border border-white/10 focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-300 text-base backdrop-blur-sm mt-2"
                value={userUrl}
                onChange={e => setUserUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                disabled={keywordsLoading}
              />
              <button
                className="mt-4 w-full h-12 px-6 rounded-xl bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-bold shadow-lg hover:shadow-accent-blue/30 hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
                onClick={handleExtractKeywords}
                disabled={keywordsLoading || !userUrl.trim() || !userUrl.startsWith('http')}
              >
                <KeyRound size={22} />
                {keywordsLoading ? 'Extracting...' : 'Extract Keywords'}
              </button>
              {keywordsError && <div className="text-red-400 text-sm mt-2">{keywordsError}</div>}
            </div>
          )}
          {step === 2 && (
            <div>
              <label className="text-white/80 font-semibold text-lg flex items-center gap-2">
                <KeyRound size={20} className="text-accent-blue" />
                Edit your keywords (max 5)
              </label>
              <div className="space-y-2 mt-2">
                {userKeywords.map((kw, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg bg-medium-blue/80 text-white border border-white/10 focus:outline-none focus:border-accent-blue text-base"
                      value={kw}
                      onChange={e => handleKeywordChange(idx, e.target.value)}
                    />
                    <button className="px-2 py-1 bg-red-500 text-white rounded-lg" onClick={() => handleRemoveKeyword(idx)} disabled={userKeywords.length <= 1}>Remove</button>
                  </div>
                ))}
                <button className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg" onClick={handleAddKeyword} disabled={userKeywords.length >= MAX_KEYWORDS}>Add Keyword</button>
              </div>
              <button
                className="mt-4 w-full h-12 px-6 rounded-xl bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-bold shadow-lg hover:shadow-accent-blue/30 hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
                onClick={handleFindCompetitors}
                disabled={competitorsLoading || userKeywords.length === 0}
              >
                <Users size={22} />
                {competitorsLoading ? 'Finding...' : 'Find Competitors'}
              </button>
              {competitorsError && <div className="text-red-400 text-sm mt-2">{competitorsError}</div>}
            </div>
          )}
          {step === 3 && (
            <div>
              <label className="text-white/80 font-semibold text-lg flex items-center gap-2">
                <BarChart3 size={20} className="text-accent-blue" />
                Edit competitor URLs (max 10)
              </label>
              <div className="space-y-2 mt-2">
                {competitorUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg bg-medium-blue/80 text-white border border-white/10 focus:outline-none focus:border-accent-blue text-base"
                      value={url}
                      onChange={e => handleCompetitorUrlChange(idx, e.target.value)}
                    />
                    <button className="px-2 py-1 bg-red-500 text-white rounded-lg" onClick={() => handleRemoveCompetitorUrl(idx)} disabled={competitorUrls.length <= 1}>Remove</button>
                  </div>
                ))}
                <button className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg" onClick={handleAddCompetitorUrl} disabled={competitorUrls.length >= MAX_COMPETITORS}>Add Competitor</button>
              </div>
              <button
                className="mt-4 w-full h-12 px-6 rounded-xl bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-bold shadow-lg hover:shadow-accent-blue/30 hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
                onClick={handleAnalyze}
                disabled={gapLoading || competitorUrls.length === 0}
              >
                <BarChart3 size={22} />
                {gapLoading ? 'Analyzing...' : 'Analyze'}
              </button>
              {gapError && <div className="text-red-400 text-sm mt-2">{gapError}</div>}
            </div>
          )}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-accent-blue flex items-center gap-2">
                <BarChart3 size={24} /> Analysis Results & Recommendations
              </h2>
              {analysisResult ? (
                <div>
                  <div className="mb-4">
                    <h3 className="font-semibold text-white mb-2">Content Gaps:</h3>
                    <ul className="list-disc ml-6 text-white/90">
                      {analysisResult.content_gaps && analysisResult.content_gaps.map((gap: any, idx: number) => (
                        <li key={idx} className="mb-3">
                          {typeof gap === 'string' ? (
                            gap
                          ) : (
                            <div className="bg-medium-blue/60 rounded-lg p-3">
                              {gap.gap_type && <div className="font-bold text-accent-blue mb-1">{gap.gap_type}</div>}
                              {gap.explanation && <div className="mb-1 text-white/90"><span className="font-semibold">Why it matters:</span> {gap.explanation}</div>}
                              {gap.seo_impact && <div className="text-green-400"><span className="font-semibold">SEO Impact:</span> {gap.seo_impact}</div>}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">Recommendations:</h3>
                    <ul className="list-disc ml-6 text-white/90">
                      {analysisResult.recommendations && analysisResult.recommendations.map((rec: any, idx: number) => (
                        <li key={idx} className="mb-2">
                          {typeof rec === 'string' ? (
                            rec
                          ) : (
                            <div className="bg-medium-blue/60 rounded-lg p-3">
                              {rec.title && <div className="font-bold text-accent-blue mb-1">{rec.title}</div>}
                              {rec.detail && <div className="text-white/90">{rec.detail}</div>}
                              {/* Render other fields if present */}
                              {Object.keys(rec).filter(k => k !== 'title' && k !== 'detail').map(k => (
                                <div key={k} className="text-white/70"><span className="font-semibold">{k}:</span> {String(rec[k])}</div>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-white/80">No analysis result yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitorAnalysis; 