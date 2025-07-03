import React from "react";

interface SeedFormProps {
  seed: string;
  lang: string;
  country: string;
  loading: boolean;
  onSeedChange: (v: string) => void;
  onLangChange: (v: string) => void;
  onCountryChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const SeedForm: React.FC<SeedFormProps> = ({
  seed, lang, country, loading,
  onSeedChange, onLangChange, onCountryChange, onSubmit
}) => (
  <form
    onSubmit={onSubmit}
    className="bg-gradient-to-br from-blue-900/80 to-indigo-800/80 backdrop-blur-md rounded-2xl p-6 mb-8 flex flex-col gap-6 shadow-2xl border border-blue-400/20"
  >
    <input
      className="p-3 rounded-xl bg-white/10 text-white border border-blue-400/30 focus:outline-none focus:ring-2 focus:ring-accent-blue transition"
      type="text"
      placeholder="Seed keyword (e.g. ai tools)"
      value={seed}
      onChange={e => onSeedChange(e.target.value)}
      required
      autoFocus
    />
    <div className="flex gap-4">
      <input
        className="p-3 rounded-xl bg-white/10 text-white border border-blue-400/30 focus:outline-none w-1/2"
        type="text"
        placeholder="Language (e.g. en)"
        value={lang}
        onChange={e => onLangChange(e.target.value)}
      />
      <input
        className="p-3 rounded-xl bg-white/10 text-white border border-blue-400/30 focus:outline-none w-1/2"
        type="text"
        placeholder="Country (e.g. us)"
        value={country}
        onChange={e => onCountryChange(e.target.value)}
      />
    </div>
    <button
      type="submit"
      className="bg-gradient-to-r from-accent-blue to-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:from-indigo-500 hover:to-accent-blue transition-all duration-200"
      disabled={loading}
    >
      {loading ? 'Generating...' : 'Generate'}
    </button>
  </form>
);

export default SeedForm; 