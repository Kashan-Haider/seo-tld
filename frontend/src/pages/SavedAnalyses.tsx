import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { BarChart3, Users, KeyRound, Folder, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmationDialog from '../components/ConfirmationDialog';

const SavedAnalyses: React.FC = () => {
  const { selectedProject } = useProjectStore();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<any>(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!selectedProject) return;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`/api/competitor-analysis/all?project_id=${selectedProject.id}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error('Failed to fetch analyses');
        const data = await res.json();
        setAnalyses(data);
        if (data.length > 0) setSelectedId(data[0].id);
      } catch (err: any) {
        setError(err.message || 'Failed to load analyses');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyses();
  }, [selectedProject]);
  
  const selected = analyses.find(a => a.id === selectedId);
  
  const handleDeleteClick = (analysis: any) => {
    setAnalysisToDelete(analysis);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!analysisToDelete) return;
    setDeletingId(analysisToDelete.id);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/competitor-analysis/delete-analysis/${analysisToDelete.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error('Failed to delete analysis');
      toast.success('Analysis deleted successfully');
      setAnalyses(analyses => analyses.filter(a => a.id !== analysisToDelete.id));
      if (selectedId === analysisToDelete.id) {
        setSelectedId(analyses.length > 1 ? analyses.find(a => a.id !== analysisToDelete.id)?.id || null : null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete analysis');
    } finally {
      setDeletingId(null);
      setAnalysisToDelete(null);
      setShowDeleteDialog(false);
    }
  };
  
  return (
    <div className="w-full min-h-full bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue flex flex-col items-center justify-center py-10 px-2 md:px-8 lg:px-16">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 items-center">
        <div className="flex flex-col items-center gap-2 mb-6 w-full">
          <div className="flex items-center gap-3">
            <Folder size={40} className="text-accent-blue drop-shadow-lg" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">Saved Analyses</h1>
          </div>
          <p className="text-white/70 text-lg text-center max-w-xl mt-2">Browse and review all your saved competitor analyses for this project.</p>
        </div>
        <div className="w-full flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <select
              className="px-4 py-2 rounded-lg bg-dark-blue/80 text-white border border-white/10 focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 text-base"
              value={selectedId || ''}
              onChange={e => setSelectedId(e.target.value)}
              disabled={analyses.length === 0}
            >
              {analyses.map(a => (
                <option key={a.id} value={a.id}>
                  {a.user_url} ({new Date(a.created_at).toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="text-white/70 text-center py-10">Loading analyses...</div>
        ) : error ? (
          <div className="text-red-400 text-center py-10">{error}</div>
        ) : !selected ? (
          <div className="text-white/60 italic p-6 bg-dark-blue/60 rounded-xl border border-white/10 text-center">
            No saved analyses found for this project.
          </div>
        ) : (
          <div className="w-full bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl shadow-2xl border border-white/10 p-8 flex flex-col gap-8 items-center">
            {/* Competitor Keywords Section */}
            <div className="w-full mb-6">
              <h3 className="font-bold text-xl text-white mb-3 flex items-center gap-2">
                <Users size={22} className="text-accent-blue" /> Competitor Keywords
              </h3>
              {selected.competitor_urls.length === 0 || Object.keys(selected.competitor_keywords).length === 0 ? (
                <div className="text-white/70 italic">No competitor keywords found.</div>
              ) : (
                <div className="space-y-6">
                  {selected.competitor_urls.map((url: string, idx: number) => (
                    <div key={url} className="bg-gradient-to-r from-medium-blue/60 to-dark-blue rounded-xl p-4 shadow border border-white/10">
                      <div className="text-accent-blue font-semibold mb-2 break-all">{url}</div>
                      {selected.competitor_keywords[url] && selected.competitor_keywords[url].length > 0 ? (
                        <ul className="flex flex-wrap gap-2">
                          {selected.competitor_keywords[url].map((kw: string, i: number) => (
                            <li key={i} className="bg-accent-blue/20 text-accent-blue px-3 py-1 rounded-lg text-sm font-medium shadow-sm">{kw}</li>
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
            {/* Content Gaps */}
            <div className="w-full">
              <h3 className="font-bold text-xl text-white mb-3 flex items-center gap-2">
                <KeyRound size={22} className="text-accent-blue" /> Content Gaps
              </h3>
              <ul className="space-y-4">
                {selected.content_gaps && selected.content_gaps.map((gap: any, idx: number) => (
                  <li key={idx} className="bg-gradient-to-r from-medium-blue/70 to-dark-blue rounded-xl p-5 shadow-lg border border-white/10">
                    {gap && typeof gap === 'object' && gap.title && gap.description ? (
                      <div>
                        <div className="font-bold text-accent-blue mb-1 text-lg">{gap.title}</div>
                        <div className="text-white/90">{gap.description}</div>
                      </div>
                    ) : typeof gap === 'string' ? (
                      <span className="text-white/90 text-base">{gap}</span>
                    ) : (
                      <div>
                        {gap.gap_type && <div className="font-bold text-accent-blue mb-1 text-lg">{gap.gap_type}</div>}
                        {gap.explanation && <div className="mb-1 text-white/90"><span className="font-semibold">Why it matters:</span> {gap.explanation}</div>}
                        {gap.seo_impact && <div className="text-green-400"><span className="font-semibold">SEO Impact:</span> {gap.seo_impact}</div>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {/* Recommendations */}
            <div className="w-full">
              <h3 className="font-bold text-xl text-white mb-3 flex items-center gap-2">
                <BarChart3 size={22} className="text-accent-blue" /> Recommendations
              </h3>
              <ul className="space-y-4">
                {selected.recommendations && selected.recommendations.map((rec: any, idx: number) => (
                  <li key={idx} className="bg-gradient-to-r from-medium-blue/70 to-dark-blue rounded-xl p-5 shadow-lg border border-white/10">
                    {typeof rec === 'string' ? (
                      <span className="text-white/90 text-base">{rec}</span>
                    ) : (
                      <div>
                        {rec.title && <div className="font-bold text-accent-blue mb-1 text-lg">{rec.title}</div>}
                        {rec.detail && <div className="text-white/90">{rec.detail}</div>}
                        {/* Render other fields if present */}
                        {Object.keys(rec).filter((k: string) => k !== 'title' && k !== 'detail').map((k: string) => (
                          <div key={k} className="text-white/70"><span className="font-semibold">{k}:</span> {String(rec[k])}</div>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {/* Improved Delete Button */}
        {selected && (
          <div className="w-full flex justify-end mb-4">
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-800 text-white font-semibold shadow border border-red-400/30 hover:bg-red-700 hover:scale-105 transition-all duration-200 disabled:opacity-60"
              onClick={() => handleDeleteClick(selected)}
              disabled={deletingId === selected.id}
              title="Delete analysis"
            >
              <Trash2 size={18} /> Delete Analysis
            </button>
          </div>
        )}
          </div>
        )}
      </div>
      
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setAnalysisToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Analysis"
        message={`Are you sure you want to delete this analysis? This action cannot be undone.`}
        confirmText="Delete Analysis"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default SavedAnalyses; 