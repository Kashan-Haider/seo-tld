import React from "react";
import KeywordRow from "./KeywordRow";

interface KeywordsTableProps {
  keywords: any[];
}

const KeywordsTable: React.FC<KeywordsTableProps> = ({ keywords }) => (
  <div className="overflow-x-auto bg-gradient-to-br from-blue-900/80 to-indigo-800/80 rounded-2xl p-6 shadow-2xl border border-blue-400/20">
    <table className="min-w-full text-white text-lg">
      <thead>
        <tr>
          <th className="px-4 py-2 font-semibold">Keyword</th>
          <th className="px-4 py-2 font-semibold">Search Volume</th>
          <th className="px-4 py-2 font-semibold">Difficulty</th>
          <th className="px-4 py-2 font-semibold">CPC (USD)</th>
          <th className="px-4 py-2 font-semibold">Competition</th>
          <th className="px-4 py-2 font-semibold">Intent</th>
          <th className="px-4 py-2 font-semibold">Features</th>
        </tr>
      </thead>
      <tbody>
        {keywords.map((kw, i) => (
          <KeywordRow key={i} kw={kw} />
        ))}
      </tbody>
    </table>
  </div>
);

export default KeywordsTable; 