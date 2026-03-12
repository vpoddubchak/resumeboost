'use client';

import { useState, useEffect } from 'react';

export interface CategoryScore {
  key: string;
  label: string;
  score: number;
  matched: string[];
  gaps: string[];
  analysis?: string;
}

interface CategoryBreakdownProps {
  categories: CategoryScore[];
}

function getCategoryColor(score: number): string {
  if (score >= 75) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getCategoryTextColor(score: number): string {
  if (score >= 75) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

interface CategoryRowProps {
  category: CategoryScore;
  animated: boolean;
}

function CategoryRow({ category, animated }: CategoryRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasDetails = category.matched.length > 0 || category.gaps.length > 0 || !!category.analysis;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (hasDetails) setIsOpen((prev) => !prev);
    }
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  };

  const barColor = getCategoryColor(category.score);
  const textColor = getCategoryTextColor(category.score);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => hasDetails && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        disabled={!hasDetails}
        aria-expanded={hasDetails ? isOpen : undefined}
        aria-label={`${category.label}: ${category.score}%${hasDetails ? ', click to expand details' : ''}`}
        className={[
          'w-full min-h-[48px] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-3 py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-none',
          hasDetails ? 'hover:bg-gray-800 cursor-pointer' : 'cursor-default',
        ].join(' ')}
      >
        <span className="text-base font-semibold text-white text-left sm:w-44 shrink-0">
          {category.label}
        </span>
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={category.score} aria-valuemin={0} aria-valuemax={100} aria-label={`${category.label} progress`}>
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
              style={{ width: animated ? `${category.score}%` : '0%' }}
            />
          </div>
          <span className={`text-sm font-bold w-10 text-right shrink-0 ${textColor}`}>
            {category.score}%
          </span>
          {hasDetails && (
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {isOpen && hasDetails && (
        <div className="ml-3 sm:ml-48 space-y-2 pb-2">
          {category.analysis && (
            <p className="text-sm text-gray-400 italic px-1">{category.analysis}</p>
          )}
          <ul
            role="list"
            aria-label={`${category.label} details`}
            className="space-y-1"
          >
            {category.matched.map((item, i) => (
              <li key={`m-${i}`} className="flex items-start gap-2 text-sm text-green-400">
                <span className="shrink-0 mt-0.5" aria-hidden="true">✓</span>
                <span>{item}</span>
              </li>
            ))}
            {category.gaps.map((item, i) => (
              <li key={`g-${i}`} className="flex items-start gap-2 text-sm text-red-400">
                <span className="shrink-0 mt-0.5" aria-hidden="true">✗</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(true);
  }, []);

  return (
    <section
      role="region"
      aria-label="Category Breakdown"
      className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-2"
    >
      <h2 className="text-2xl font-bold text-white px-3 pb-2">Category Breakdown</h2>
      <div className="space-y-1">
        {categories.map((category) => (
          <CategoryRow key={category.key} category={category} animated={animated} />
        ))}
      </div>
    </section>
  );
}
