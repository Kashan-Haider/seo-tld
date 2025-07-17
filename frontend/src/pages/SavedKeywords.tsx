import React, { useEffect, useState, useMemo } from 'react';
import { useProjectStore } from '../store/projectStore';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import SavedKeywordBox from '../components/generate-keywords/SavedKeywordBox ';
import { toast } from 'react-hot-toast';

interface KeywordSimpleObject {
  id: string;
  keyword: string;
  search_volume: string;
  keyword_difficulty: string;
  competitive_density: string;
  intent: string;
  project_id?: string;
}

// Helper to convert keywords to CSV
function keywordsToCSV(keywords: KeywordSimpleObject[]): string {
  const header = ['Keyword', 'Search Volume', 'Difficulty', 'Competition', 'Intent'];
  const rows = keywords.map(kw => [
    kw.keyword,
    kw.search_volume,
    kw.keyword_difficulty,
    kw.competitive_density,
    kw.intent
  ]);
  return [header, ...rows].map(row => row.map(field => `"${(field || '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

function downloadCSV(keywords: KeywordSimpleObject[]) {
  const csv = keywordsToCSV(keywords);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'saved_keywords.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const SavedKeywords: React.FC = () => {
  const { selectedProject } = useProjectStore();
  const projectId = selectedProject?.id;
  const [savedKeywords, setSavedKeywords] = useState<KeywordSimpleObject[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmUnsaveId, setConfirmUnsaveId] = useState<string | null>(null);
  const [unsaveLoading, setUnsaveLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`${import.meta.env.VITE_BACKEND_URL}/keywords/saved/${projectId}`)
      .then(res => res.json())
      .then(data => setSavedKeywords(data || []))
      .finally(() => setLoading(false));
  }, [projectId]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  // Memoize filtered results
  const filtered = useMemo(() => {
    if (!debouncedSearch) return savedKeywords;
    return savedKeywords.filter(kw =>
      kw.keyword.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [debouncedSearch, savedKeywords]);

  // Handle unsave with confirmation
  const handleUnsave = async (id: string) => {
    setUnsaveLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/keywords/delete/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to unsave keyword');
      setSavedKeywords(prev => prev.filter(kw => kw.id !== id));
      toast.success('Keyword removed from saved list.');
    } catch (e) {
      toast.error('Failed to unsave keyword. Please try again.');
    } finally {
      setUnsaveLoading(false);
      setConfirmUnsaveId(null);
    }
  };

  if (!projectId) {
    return (
      <div className="w-full min-h-screen bg-dark-blue flex flex-col items-center justify-center">
        <div className="text-white text-lg mb-4">Please select or create a project to view saved keywords.</div>
        <Link
          to="/create-project"
          className="px-4 py-2 rounded-xl bg-accent-blue text-white font-semibold shadow-lg hover:bg-light-purple transition"
        >
          Create Project
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-dark-blue flex flex-col items-center py-10 px-4 md:px-20 lg:px-40">
      <div className="w-full mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/generate-keywords" className="text-white hover:underline flex items-center">
            <ArrowLeft size={20} /> Back
          </Link>
          <BookOpen size={28} className="text-green-400" />
          <h1 className="text-2xl md:text-3xl font-bold text-green-300">Saved Keywords</h1>
        </div>
        <div className="bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl shadow-xl border border-white/10 p-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <div className="text-white/80 font-semibold text-lg">Project:</div>
              <div className="text-white text-xl font-bold">{selectedProject?.name}</div>
              <div className="text-white/60 text-sm">{selectedProject?.website_url}</div>
            </div>
            <input
              className="w-full md:w-72 px-4 py-2 rounded-xl bg-medium-blue/80 text-white border border-white/10 focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-300 text-base backdrop-blur-sm"
              placeholder="Search saved keywords..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={loading}
            />
            <button
              className="mt-2 md:mt-0 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg border border-green-400/30 transition-all duration-200"
              onClick={() => downloadCSV(filtered)}
              disabled={filtered.length === 0}
            >
              Download CSV
            </button>
          </div>
          {loading ? (
            <div className="text-white/70 text-center py-10">Loading saved keywords...</div>
          ) : filtered.length === 0 ? (
            <div className="text-white/60 italic p-6 bg-dark-blue/60 rounded-xl border border-white/10 text-center">
              No saved keywords found for this project.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(kw => (
                <SavedKeywordBox
                  key={kw.id}
                  kw={kw}
                  isSaved={true}
                  onSaveChange={(_id, saved) => {
                    // Only open the dialog for unsave, do nothing for save
                    if (!saved) setConfirmUnsaveId(kw.id);
                  }}
                  projectId={projectId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Confirmation Dialog */}
      {confirmUnsaveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-dark-blue rounded-2xl p-8 shadow-2xl border border-white/20 max-w-sm w-full flex flex-col items-center">
            <div className="text-white text-lg font-bold mb-4">Remove Keyword?</div>
            <div className="text-white/80 mb-6 text-center">Are you sure you want to unsave this keyword? This action cannot be undone.</div>
            <div className="flex gap-4 w-full justify-center">
              <button
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-60"
                onClick={() => handleUnsave(confirmUnsaveId)}
                disabled={unsaveLoading}
              >
                {unsaveLoading ? 'Removing...' : 'Yes, Unsave'}
              </button>
              <button
                className="px-5 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold"
                onClick={() => setConfirmUnsaveId(null)}
                disabled={unsaveLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedKeywords; 