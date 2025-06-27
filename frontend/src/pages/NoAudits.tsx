import React from 'react';
import { Zap } from 'lucide-react';
import type { NoAuditsProps } from '../typing';

interface EnhancedNoAuditsProps extends NoAuditsProps {
  isLoading?: boolean;
  error?: string | null;
}

const NoAudits: React.FC<EnhancedNoAuditsProps> = ({ projectName, onGenerateAudit, isLoading, error }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full">
      <div className="bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue rounded-3xl border border-white/10 shadow-2xl p-10 max-w-2xl w-full flex flex-col items-center">
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="bg-accent-blue/30 rounded-full p-5 mb-2 shadow-lg">
            <Zap size={56} className="text-accent-blue animate-pulse drop-shadow-lg" />
          </div>
          <div className="text-3xl md:text-4xl font-extrabold text-white mb-2 text-center tracking-tight drop-shadow">No Audits Found</div>
          <div className="text-light-gray text-base md:text-lg text-center max-w-xl mb-6">
            {projectName
              ? `This project (${projectName}) doesn't have any audit reports yet. Start your first audit to analyze your website's SEO, performance, and more!`
              : "This project doesn't have any audit reports yet. Start your first audit to analyze your website's SEO, performance, and more!"}
          </div>
          <button
            className={`mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white font-bold shadow-xl hover:scale-105 transition-all text-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
            onClick={onGenerateAudit}
            disabled={isLoading}
          >
            {isLoading && (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            )}
            {isLoading ? 'Generating Audit Report...' : 'Generate Audit'}
          </button>
          {error && <div className="text-red-400 mt-4 text-center w-full">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default NoAudits; 