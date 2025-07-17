import React, { useState } from "react";
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface KeywordBoxProps {
  kw: {
    id: string;
    keyword: string;
    search_volume: string;
    keyword_difficulty: string;
    competitive_density: string;
    intent: string;
    project_id?: string;
  };
  isSaved: boolean;
  onSaveChange: (id: string, saved: boolean) => void;
  projectId: string;
}

const intentColors: Record<string, string> = {
  commercial: "text-pink-400",
  informational: "text-cyan-400",
  navigational: "text-yellow-400"
};

const KeywordBox: React.FC<KeywordBoxProps> = ({ kw, isSaved, onSaveChange, projectId }) => {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Only send id if it's a valid UUID
      const { id, ...rest } = kw;
      const isUUID = typeof id === 'string' && /^[0-9a-fA-F-]{36}$/.test(id);
      const payload = isUUID ? { ...kw, project_id: projectId } : { ...rest, project_id: projectId };
      if (!isUUID) delete (payload as any).id;
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/keywords/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save keyword");
      // Use keyword as the key for saved state
      onSaveChange(kw.keyword, true);
      toast.success('Keyword saved!');
    } catch (e) {
      toast.error('Failed to save keyword. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async () => {
    if (!kw.id || !/^([0-9a-fA-F-]{36})$/.test(kw.id)) {
      toast.error('Cannot unsave keyword: missing id.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/keywords/delete/${kw.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to unsave keyword');
      onSaveChange(kw.id, false);
      toast.success('Keyword removed from saved list.');
    } catch (e) {
      toast.error('Failed to unsave keyword. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl shadow-xl border border-white/10 p-6 flex flex-col gap-2 min-h-[180px] transition-all duration-200 hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-white truncate" title={kw.keyword}>{kw.keyword}</span>
        <button
          className={`ml-2 p-2 rounded-full transition-all duration-200 ${isSaved ? 'bg-green-600/80 hover:bg-green-700' : 'bg-blue-700/60 hover:bg-accent-blue'} disabled:opacity-60`}
          onClick={isSaved ? handleUnsave : handleSave}
          disabled={loading}
          aria-label={isSaved ? 'Unsave keyword' : 'Save keyword'}
        >
          {isSaved ? <BookmarkCheck className="text-white" size={22} /> : <Bookmark className="text-white" size={22} />}
        </button>
      </div>
      <div className="flex flex-col gap-1 text-white/90 text-base">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-indigo-300">Search Volume:</span>
          <span>{kw.search_volume}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-indigo-300">Difficulty:</span>
          <span>{kw.keyword_difficulty}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-indigo-300">Competition:</span>
          <span>{kw.competitive_density}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-indigo-300">Intent:</span>
          <span className={`font-semibold ${intentColors[kw.intent?.toLowerCase()] || 'text-white'}`}>{kw.intent}</span>
        </div>
      </div>
    </div>
  );
};

export default KeywordBox; 