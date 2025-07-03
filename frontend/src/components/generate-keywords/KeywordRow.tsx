import React from "react";

const intentColors: Record<string, string> = {
  Commercial: "text-pink-400",
  Informational: "text-cyan-400",
  Navigational: "text-yellow-400"
};

const KeywordRow: React.FC<{ kw: any }> = ({ kw }) => (
  <tr className="border-t border-blue-400/10 hover:bg-blue-800/30 transition">
    <td className="px-4 py-2">{kw.keyword}</td>
    <td className="px-4 py-2 text-center">{kw.search_volume}</td>
    <td className="px-4 py-2 text-center">{kw.keyword_difficulty}</td>
    <td className="px-4 py-2 text-center">{kw.cpc_usd}</td>
    <td className="px-4 py-2 text-center">{kw.competitive_density}</td>
    <td className={`px-4 py-2 text-center font-semibold ${intentColors[kw.intent] || "text-white"}`}>{kw.intent}</td>
    <td className="px-4 py-2 text-center">
      {Array.isArray(kw.features) ? kw.features.join(', ') : kw.features}
    </td>
  </tr>
);

export default KeywordRow; 