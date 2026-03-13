'use client';

import { useState, useMemo } from 'react';
import type { PortfolioContent } from '@prisma/client';
import { PortfolioCard } from './portfolio-card';
import { PortfolioFilter } from './portfolio-filter';

interface PortfolioGalleryProps {
  items: PortfolioContent[];
}

export function PortfolioGallery({ items }: PortfolioGalleryProps) {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filterOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.content_type))).sort(),
    [items]
  );

  const filteredItems = useMemo(
    () =>
      selectedFilter === 'all'
        ? items
        : items.filter((item) => item.content_type === selectedFilter),
    [items, selectedFilter]
  );

  const resultCount = filteredItems.length;

  if (items.length === 0) {
    return (
      <div className="w-full space-y-6">
        <div
          role="status"
          aria-label="No portfolio examples available"
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-400 text-base font-medium">No portfolio examples yet</p>
          <p className="text-gray-600 text-sm mt-1">Check back soon for resume examples</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Filter controls */}
      <PortfolioFilter
        options={filterOptions}
        selected={selectedFilter}
        onChange={setSelectedFilter}
      />

      {/* Live region for screen reader filter announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {selectedFilter === 'all'
          ? `Showing all ${resultCount} portfolio examples`
          : `Showing ${resultCount} ${resultCount === 1 ? 'example' : 'examples'} for ${selectedFilter}`}
      </div>

      {/* Gallery grid or empty state */}
      {filteredItems.length === 0 ? (
        <div
          role="status"
          aria-label="No results for selected filter"
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
          <p className="text-gray-400 text-base font-medium">No examples found</p>
          <p className="text-gray-600 text-sm mt-1">Try selecting a different filter</p>
        </div>
      ) : (
        <ul
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          aria-label="Portfolio examples"
        >
          {filteredItems.map((item) => (
            <li key={item.content_id}>
              <PortfolioCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
