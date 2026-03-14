'use client';

import { useTranslations } from 'next-intl';

interface FilterGroupProps {
  label: string;
  options: string[];
  selected: string;
  onChange: (value: string) => void;
  formatLabel?: (value: string) => string;
}

function FilterGroup({ label, options, selected, onChange, formatLabel }: FilterGroupProps) {
  const tc = useTranslations('common');
  const format = formatLabel ?? ((v: string) => v.charAt(0).toUpperCase() + v.slice(1));

  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider self-center mr-1">
        {label}:
      </span>
      {['all', ...options].map((option) => {
        const isSelected = selected === option;
        const displayLabel = option === 'all' ? tc('all') : format(option);

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={isSelected}
            className={[
              'min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:outline-none',
              isSelected
                ? 'bg-blue-600 text-white border border-blue-500'
                : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:text-white',
            ].join(' ')}
          >
            {displayLabel}
          </button>
        );
      })}
    </div>
  );
}

interface SuccessStoriesFilterProps {
  industryOptions: string[];
  outcomeOptions: string[];
  selectedIndustry: string;
  selectedOutcome: string;
  onIndustryChange: (value: string) => void;
  onOutcomeChange: (value: string) => void;
}

function formatOutcomeLabel(value: string): string {
  return value
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function SuccessStoriesFilter({
  industryOptions,
  outcomeOptions,
  selectedIndustry,
  selectedOutcome,
  onIndustryChange,
  onOutcomeChange,
}: SuccessStoriesFilterProps) {
  const t = useTranslations('stories');

  return (
    <div className="space-y-3">
      <FilterGroup
        label={t('filterByIndustry')}
        options={industryOptions}
        selected={selectedIndustry}
        onChange={onIndustryChange}
      />
      <FilterGroup
        label={t('filterByOutcome')}
        options={outcomeOptions}
        selected={selectedOutcome}
        onChange={onOutcomeChange}
        formatLabel={formatOutcomeLabel}
      />
    </div>
  );
}
