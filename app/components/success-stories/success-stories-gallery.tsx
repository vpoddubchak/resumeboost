'use client';

import { useState, useMemo } from 'react';
import type { SuccessStory } from '@prisma/client';
import { SuccessStoryCard } from './success-story-card';
import { SuccessStoriesFilter } from './success-stories-filter';

interface SuccessStoriesGalleryProps {
  items: SuccessStory[];
}

export function SuccessStoriesGallery({ items }: SuccessStoriesGalleryProps) {
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedOutcome, setSelectedOutcome] = useState('all');

  const industryOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.industry))).sort(),
    [items]
  );

  const outcomeOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.outcome_type))).sort(),
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const industryMatch = selectedIndustry === 'all' || item.industry === selectedIndustry;
      const outcomeMatch = selectedOutcome === 'all' || item.outcome_type === selectedOutcome;
      return industryMatch && outcomeMatch;
    });
  }, [items, selectedIndustry, selectedOutcome]);

  const resultCount = filteredItems.length;

  if (items.length === 0) {
    return (
      <div className="w-full space-y-6">
        <div
          role="status"
          aria-label="No success stories available"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <svg
            className="w-12 h-12 text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
            />
          </svg>
          <p className="text-gray-400 text-base font-medium">No success stories yet</p>
          <p className="text-gray-600 text-sm mt-1">Check back soon for client testimonials</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Filter controls */}
      <SuccessStoriesFilter
        industryOptions={industryOptions}
        outcomeOptions={outcomeOptions}
        selectedIndustry={selectedIndustry}
        selectedOutcome={selectedOutcome}
        onIndustryChange={setSelectedIndustry}
        onOutcomeChange={setSelectedOutcome}
      />

      {/* Live region for screen reader filter announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {selectedIndustry === 'all' && selectedOutcome === 'all'
          ? `Showing all ${resultCount} success stories`
          : `Showing ${resultCount} ${resultCount === 1 ? 'story' : 'stories'} for selected filters`}
      </div>

      {/* Gallery grid or filtered empty state */}
      {filteredItems.length === 0 ? (
        <div
          role="status"
          aria-label="No results for selected filters"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <svg
            className="w-12 h-12 text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-gray-400 text-base font-medium">No stories found</p>
          <p className="text-gray-600 text-sm mt-1">Try selecting a different filter</p>
        </div>
      ) : (
        <ul
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          aria-label="Success stories"
        >
          {filteredItems.map((item) => (
            <li key={item.story_id}>
              <SuccessStoryCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
