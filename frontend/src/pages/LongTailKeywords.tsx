import React, { useState } from 'react';
import { KeyRound, Globe, Languages, Loader2 } from 'lucide-react';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ko', label: 'Korean' },
  { code: 'nl', label: 'Dutch' },
  { code: 'sv', label: 'Swedish' },
  // Add more as needed
];

const COUNTRY_OPTIONS = [
  { code: 'us', label: 'United States' },
  { code: 'gb', label: 'United Kingdom' },
  { code: 'fr', label: 'France' },
  { code: 'de', label: 'Germany' },
  { code: 'es', label: 'Spain' },
  { code: 'it', label: 'Italy' },
  { code: 'br', label: 'Brazil' },
  { code: 'in', label: 'India' },
  { code: 'jp', label: 'Japan' },
  { code: 'cn', label: 'China' },
  { code: 'ru', label: 'Russia' },
  { code: 'tr', label: 'Turkey' },
  { code: 'ca', label: 'Canada' },
  { code: 'au', label: 'Australia' },
  { code: 'mx', label: 'Mexico' },
  { code: 'kr', label: 'South Korea' },
  { code: 'nl', label: 'Netherlands' },
  { code: 'se', label: 'Sweden' },
  // Add more as needed
];

const KeywordBox: React.FC<{ keyword: string }> = ({ keyword }) => (
  <div className="bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-xl shadow border border-white/10 px-4 py-2 text-white text-base font-semibold flex items-center gap-2 hover:bg-accent-blue/10 transition cursor-pointer select-text">
    <KeyRound size={18} className="text-accent-blue" />
    <span>{keyword}</span>
  </div>
);

const LongTailKeywords: React.FC = () => {
  const [seed, setSeed] = useState('');
  const [lang, setLang] = useState('en');
  const [country, setCountry] = useState('us');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setKeywords([]);
    try {
      const res = await fetch('/api/keyword/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed, lang, country }),
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
    <div className="w-full min-h-screen bg-dark-blue flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <KeyRound size={32} className="text-accent-blue" />
          Long Tail Keyword Generator
        </h1>
        <div className="bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl shadow-xl border border-white/10 p-6 flex flex-col gap-4">
          <label className="text-white/80 font-semibold text-lg flex items-center gap-2">
            <KeyRound size={20} className="text-accent-blue" />
            Seed Keyword
          </label>
          <input
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-medium-blue/80 to-medium-blue text-white border border-white/10 focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all duration-300 text-base backdrop-blur-sm"
            placeholder="Enter a seed keyword..."
            value={seed}
            onChange={e => setSeed(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); }}
            disabled={loading}
          />
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-white/60 text-sm flex items-center gap-1">
                <Languages size={16} className="text-light-purple" /> Language
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg bg-medium-blue/60 text-white border border-white/10 focus:outline-none focus:border-accent-blue text-base"
                value={lang}
                onChange={e => setLang(e.target.value)}
                disabled={loading}
              >
                {LANGUAGE_OPTIONS.map(opt => (
                  <option key={opt.code} value={opt.code}>{opt.label} ({opt.code})</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-white/60 text-sm flex items-center gap-1">
                <Globe size={16} className="text-accent-blue" /> Country
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg bg-medium-blue/60 text-white border border-white/10 focus:outline-none focus:border-accent-blue text-base"
                value={country}
                onChange={e => setCountry(e.target.value)}
                disabled={loading}
              >
                {COUNTRY_OPTIONS.map(opt => (
                  <option key={opt.code} value={opt.code}>{opt.label} ({opt.code})</option>
                ))}
              </select>
            </div>
          </div>
          <button
            className="mt-2 w-full h-12 px-6 rounded-xl bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-bold shadow-lg hover:shadow-accent-blue/30 hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
            onClick={handleGenerate}
            disabled={loading || !seed.trim()}
          >
            {loading ? <Loader2 className="animate-spin" size={22} /> : <KeyRound size={22} />}
            {loading ? 'Generating...' : 'Generate Keywords'}
          </button>
          {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
        </div>
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