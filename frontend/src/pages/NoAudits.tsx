import React from 'react';
import { Zap } from 'lucide-react';
import type { NoAuditsProps } from '../typing';

const NoAudits: React.FC<NoAuditsProps> = ({ projectName, onGenerateAudit }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-2xl border border-white/10 shadow-2xl p-10">
      <div className="flex flex-col items-center gap-4">
        <div className="bg-accent-blue/20 rounded-full p-4 mb-2">
          <Zap size={48} className="text-accent-blue animate-pulse" />
        </div>
        <div className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">No Audits Found</div>
        <div className="text-light-gray text-base md:text-lg text-center max-w-xl mb-4">
          {projectName
            ? `This project (${projectName}) doesn't have any audit reports yet. Start your first audit to analyze your website's SEO, performance, and more!`
            : "This project doesn't have any audit reports yet. Start your first audit to analyze your website's SEO, performance, and more!"}
        </div>
        <button
          className="mt-2 px-6 py-2 rounded-lg bg-accent-blue text-white font-semibold shadow-lg hover:bg-accent-blue/80 transition text-lg"
          onClick={onGenerateAudit}
        >
          Generate Audit
        </button>
      </div>
    </div>
  );
};

export default NoAudits; 