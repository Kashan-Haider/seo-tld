import React, { useState } from 'react';
import { KeyRound, Globe, Languages, Table2 } from 'lucide-react';
import KeywordBox from '../components/generate-keywords/KeywordBox';
import ErrorMessage from '../components/generate-keywords/ErrorMessage';
import LoadingOverlay from '../components/generate-keywords/LoadingOverlay';
import { useProjectStore } from '../store/projectStore';
import { Link } from 'react-router-dom';

interface KeywordSimpleObject {
  id: string;
  keyword: string;
  search_volume: string;
  keyword_difficulty: string;
  competitive_density: string;
  intent: string;
  project_id?: string;
}

const attributeExplanations = [
  { name: "Keyword", desc: "The suggested search phrase related to your seed." },
  { name: "Search Volume", desc: "Estimated monthly searches for this keyword (very high, high, medium, low, very low)." },
  { name: "Difficulty", desc: "How hard it is to rank for this keyword (extreme, very high, high, medium, low, very low)." },
  { name: "Competition", desc: "How competitive the keyword is for advertisers (very high, high, medium, low, very low)." },
  { name: "Intent", desc: "The likely search intent: Commercial, Informational, or Navigational." }
];

const defaultLang = 'en';
const defaultCountry = 'us';
const defaultTopN = 10;

const totalSteps = 6; // Update if your backend has more/less steps

const GenerateKeywords: React.FC = () => {
  const [seed, setSeed] = useState('');
  const [lang, setLang] = useState(defaultLang);
  const [country, setCountry] = useState(defaultCountry);
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<KeywordSimpleObject[]>([]);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const { selectedProject } = useProjectStore();
  const projectId = selectedProject?.id;
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [progressMsg, setProgressMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setKeywords([]);
    setCurrentStep(1);
    setProgressMsg("");
    try {
      const token = localStorage.getItem('access_token');
      // Step 1: Start async keyword generation task
      const startRes = await fetch('/api/keywords/suggestions-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          seed: seed,
          lang: lang,
          country: country,
          top_n: defaultTopN,
        }),
      });
      if (!startRes.ok) {
        const errorData = await startRes.json();
        throw new Error(errorData.message || 'Failed to start keyword generation');
      }
      const { task_id } = await startRes.json();
      // Step 2: Poll for progress
      let done = false;
      while (!done) {
        await new Promise(res => setTimeout(res, 1200));
        const pollRes = await fetch(`/api/keywords/task-status/${task_id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!pollRes.ok) throw new Error('Failed to poll keyword generation status');
        const data = await pollRes.json();
        if (data.state === 'PENDING') {
          setCurrentStep(1);
          setProgressMsg('Queued...');
        } else if (data.state === 'PROGRESS') {
          setCurrentStep(data.current || 1);
          setProgressMsg(data.status || 'In progress...');
        } else if (data.state === 'SUCCESS') {
          setCurrentStep(data.current || totalSteps);
          setProgressMsg('Complete!');
          setKeywords(data.result.keywords || []);
          done = true;
          setLoading(false);
        } else if (data.state === 'FAILURE') {
          setError(data.error || 'Keyword generation failed');
          setLoading(false);
          done = true;
        } else {
          setProgressMsg('Working...');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setLoading(false);
    }
  };

  const handleSaveChange = (id: string, isNowSaved: boolean) => {
    setSaved(prev => ({ ...prev, [id]: isNowSaved }));
  };

  if (!projectId) {
    return (
      <div className="w-full min-h-screen bg-dark-blue flex flex-col items-center justify-center">
        <div className="text-white text-lg">Please select or create a project to generate and save keywords.</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-dark-blue flex flex-col items-center py-10 px-4 md:px-20 lg:px-40">
      <div className="w-full mx-auto flex flex-col gap-6">
        {/* Link to Saved Keywords page */}
        <div className="flex justify-end mb-2">
          <Link
            to="/saved-keywords"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg transition-all duration-200 border border-green-400/30"
          >
            <span>View Saved Keywords</span>
          </Link>
        </div>
        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <KeyRound size={32} className="text-accent-blue" />
          Keyword Generator
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
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e); }}
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
                <option value="en">English (en)</option>
                <option value="fr">French (fr)</option>
                <option value="es">Spanish (es)</option>
                <option value="de">German (de)</option>
                <option value="it">Italian (it)</option>
                <option value="pt">Portuguese (pt)</option>
                <option value="ru">Russian (ru)</option>
                <option value="ja">Japanese (ja)</option>
                <option value="zh">Chinese (zh)</option>
                <option value="ar">Arabic (ar)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="tr">Turkish (tr)</option>
                <option value="ko">Korean (ko)</option>
                <option value="nl">Dutch (nl)</option>
                <option value="sv">Swedish (sv)</option>
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
                <option value="us">United States (us)</option>
                <option value="gb">United Kingdom (gb)</option>
                <option value="fr">France (fr)</option>
                <option value="de">Germany (de)</option>
                <option value="es">Spain (es)</option>
                <option value="it">Italy (it)</option>
                <option value="br">Brazil (br)</option>
                <option value="in">India (in)</option>
                <option value="jp">Japan (jp)</option>
                <option value="cn">China (cn)</option>
                <option value="ru">Russia (ru)</option>
                <option value="tr">Turkey (tr)</option>
                <option value="ca">Canada (ca)</option>
                <option value="au">Australia (au)</option>
                <option value="mx">Mexico (mx)</option>
                <option value="kr">South Korea (kr)</option>
                <option value="nl">Netherlands (nl)</option>
                <option value="se">Sweden (se)</option>
              </select>
            </div>
          </div>
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
        {loading && (
          <LoadingOverlay
            step={currentStep}
            totalSteps={totalSteps}
            message={progressMsg}
          />
        )}
        {error && <ErrorMessage error={error} />}
        {keywords.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-2">
              <Table2 size={22} className="text-accent-blue" />
              <h2 className="text-xl font-bold text-white">Generated Keywords</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {keywords.map((kw, i) => (
                <KeywordBox
                  key={kw.keyword + i}
                  kw={{ ...kw, id: kw.keyword }}
                  isSaved={!!saved[kw.keyword]}
                  onSaveChange={handleSaveChange}
                  projectId={projectId}
                />
              ))}
            </div>
            {/* Attribute explanations */}
            <div className="mt-8 bg-dark-blue/80 rounded-2xl p-6 border border-white/10 shadow-lg">
              <h2 className="text-lg font-bold mb-4 text-accent-blue">What do these columns mean?</h2>
              <ul className="space-y-2 text-white/90">
                {attributeExplanations.map(attr => (
                  <li key={attr.name}>
                    <span className="font-semibold text-indigo-300">{attr.name}:</span>{' '}
                    <span>{attr.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateKeywords; 