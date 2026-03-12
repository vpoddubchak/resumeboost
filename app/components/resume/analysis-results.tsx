'use client';

import { useState } from 'react';
import { ScoreRing } from '@/app/components/ui/score-ring';

interface AnalysisResultsProps {
  matchScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

const SCORE_THRESHOLDS = {
  HIGH: 75,
  MEDIUM: 50,
} as const;

function getScoreLabel(score: number): string {
  if (score >= SCORE_THRESHOLDS.HIGH) return 'Strong Match';
  if (score >= SCORE_THRESHOLDS.MEDIUM) return 'Partial Match';
  return 'Low Match';
}

function getScoreLabelClass(score: number): string {
  if (score >= SCORE_THRESHOLDS.HIGH) return 'text-green-400';
  if (score >= SCORE_THRESHOLDS.MEDIUM) return 'text-yellow-400';
  return 'text-red-400';
}

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleCard({ title, children, defaultOpen = true }: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  };

  return (
    <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center justify-between px-4 py-3 min-h-[48px] text-left hover:bg-gray-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-none"
        aria-expanded={isOpen}
      >
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

export function AnalysisResults({
  matchScore,
  strengths,
  weaknesses,
  recommendations,
}: AnalysisResultsProps) {
  const scoreLabel = getScoreLabel(matchScore);
  const scoreLabelClass = getScoreLabelClass(matchScore);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Score Section */}
      <section className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col items-center gap-3" aria-live="polite">
        <h2 className="text-2xl font-bold text-white" aria-label="Match score section">
          Resume Match Score
        </h2>
        <ScoreRing score={matchScore} size="lg" className="hidden sm:inline-flex" />
        <ScoreRing score={matchScore} size="md" className="sm:hidden" />
        <p className={`text-base font-semibold ${scoreLabelClass}`}>
          {scoreLabel}
        </p>
      </section>

      {/* Strengths */}
      <CollapsibleCard title="Strengths">
        <ul role="list" aria-label="Strengths list" className="space-y-2 mt-2">
          {strengths.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-base text-gray-300">
              <span className="text-green-400 shrink-0 mt-0.5" aria-hidden="true">✅</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CollapsibleCard>

      {/* Weaknesses — hidden if empty */}
      {weaknesses.length > 0 && (
        <CollapsibleCard title="Areas to Improve">
          <ul role="list" aria-label="Weaknesses list" className="space-y-2 mt-2">
            {weaknesses.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-base text-gray-300">
                <span className="text-yellow-400 shrink-0 mt-0.5" aria-hidden="true">⚠️</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CollapsibleCard>
      )}

      {/* Recommendations */}
      <CollapsibleCard title="Recommendations">
        <ol role="list" aria-label="Recommendations list" className="space-y-2 mt-2">
          {recommendations.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-base text-gray-300">
              <span
                className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mt-0.5"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span>
                <span className="mr-1" aria-hidden="true">🔧</span>
                {item}
              </span>
            </li>
          ))}
        </ol>
      </CollapsibleCard>
    </div>
  );
}

export default AnalysisResults;
