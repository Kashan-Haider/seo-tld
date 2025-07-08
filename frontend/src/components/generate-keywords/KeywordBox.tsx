import React, { useState } from "react";
import { Bookmark, BookmarkCheck } from 'lucide-react';

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
      const res = await fetch("/api/keywords/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...kw, project_id: projectId })
      });
      if (!res.ok) throw new Error("Failed to save keyword");
      onSaveChange(kw.id, true);
    } catch (e) {
      // Optionally show error
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = () => {
    onSaveChange(kw.id, false);
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