import React, { useState } from 'react';
import { KeyRound, Globe, Languages } from 'lucide-react';
import ErrorMessage from '../components/generate-keywords/ErrorMessage';
import LoadingOverlay from '../components/generate-keywords/LoadingOverlay';

const defaultLang = 'en';
const defaultCountry = 'us';

// KeywordBox component for displaying each keyword as a card/chip
const KeywordBox: React.FC<{ keyword: string }> = ({ keyword }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(keyword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      className="relative group bg-gradient-to-br from-blue-900 via-indigo-700 to-blue-700 rounded-xl shadow border border-white/10 px-5 py-3 flex items-center justify-between gap-3 cursor-pointer select-text transition-all duration-300 hover:scale-102 hover:shadow-lg hover:from-blue-800 hover:to-indigo-700"
      style={{ minHeight: 56 }}
    >
      <div className="flex items-center gap-2">
        <KeyRound size={20} className="text-accent-blue drop-shadow" />
        <span className="text-base font-semibold text-white tracking-wide drop-shadow-sm">
          {keyword}
        </span>
      </div>
      <button
        onClick={e => { e.stopPropagation(); handleCopy(); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
        title={copied ? 'Copied!' : 'Copy keyword'}
        aria-label="Copy keyword"
        type="button"
      >
        {copied ? (
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M5 10l4 4 6-6" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        ) : (
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="5" y="7" width="10" height="10" rx="2" stroke="white" strokeWidth="1.5"/><rect x="7.5" y="3" width="7.5" height="7.5" rx="2" stroke="white" strokeWidth="1.5"/></svg>
        )}
      </button>
      {/* Tooltip */}
      <span className={`absolute right-3 -top-7 text-xs px-2 py-1 rounded bg-black/80 text-white pointer-events-none transition-opacity duration-200 ${copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-80'}`}>
        {copied ? 'Copied!' : 'Copy'}
      </span>
    </div>
  );
};

const LongTailKeywords: React.FC = () => {
  const [seed, setSeed] = useState('');
  // Remove lang and country state
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setKeywords([]);
    try {
      const res = await fetch('/api/keywords/long-tail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed }), // Only send seed
      });
      if (!res.ok) throw new Error('Failed to generate keywords');
      const data = await res.json();
      setKeywords(data.keywords || []);
    } catch (e: any) {
      setError(e.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-dark-blue flex flex-col items-center py-10 px-4 md:px-20 lg:px-40">
      <div className="w-full mx-auto flex flex-col gap-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <KeyRound size={32} className="text-accent-blue" />
          Long Tail Keyword Generator
        </h1>
        {/* Card Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl shadow-xl border border-white/10 p-6 flex flex-col gap-4"
        >
          <label className="text-white/80 font-semibold text-lg flex items-center gap-2">
            <KeyRound size={20} className="text-accent-blue" />
            Seed Keyword
          </label>
          <input
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-medium-blue/80 to-medium-blue text-white border border-white/10 focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-300 text-base backdrop-blur-sm"
            placeholder="Enter a seed keyword..."
            value={seed}
            onChange={e => setSeed(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e as any); }}
            disabled={loading}
          />
          <button
            type="submit"
            className="mt-2 w-full h-12 px-6 rounded-xl bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-bold shadow-lg hover:shadow-accent-blue/30 hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
            disabled={loading || !seed.trim()}
          >
            <KeyRound size={22} />
            {loading ? 'Generating...' : 'Generate Keywords'}
          </button>
          {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
        </form>
        {loading && <LoadingOverlay step={1} totalSteps={1} message="Generating long-tail keywords..." />}
        {error && <ErrorMessage error={error} />}
        {keywords.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-white mb-4">Generated Keywords</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {keywords.map((kw, idx) => (
                <KeywordBox key={idx} keyword={kw} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LongTailKeywords; 