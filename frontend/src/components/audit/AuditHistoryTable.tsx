import React from 'react';

const AuditHistoryTable: React.FC<{ allAudits: any[] }> = ({ allAudits }) => (
  <div className="bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col">
    <div className="text-accent-blue font-bold text-lg mb-4">Audit History</div>
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-white/90 text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="py-2 px-2">Date</th>
            <th className="py-2 px-2">URL</th>
            <th className="py-2 px-2">Mobile</th>
            <th className="py-2 px-2">Desktop</th>
            <th className="py-2 px-2">Overall</th>
          </tr>
        </thead>
        <tbody>
          {allAudits.map((audit, idx) => (
            <tr key={audit.id} className="border-b border-white/10 hover:bg-accent-blue/10 transition">
              <td className="py-2 px-2 whitespace-nowrap">{new Date(audit.timestamp).toLocaleString()}</td>
              <td className="py-2 px-2 max-w-[180px] truncate">{audit.url}</td>
              <td className="py-2 px-2">{audit.mobile_performance_score}</td>
              <td className="py-2 px-2">{audit.desktop_performance_score}</td>
              <td className="py-2 px-2">{audit.overall_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AuditHistoryTable; 