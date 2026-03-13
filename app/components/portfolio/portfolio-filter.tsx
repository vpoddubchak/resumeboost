'use client';

interface PortfolioFilterProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}

export function PortfolioFilter({ options, selected, onChange }: PortfolioFilterProps) {
  return (
    <div role="group" aria-label="Filter by industry" className="flex flex-wrap gap-2">
      {['all', ...options].map((option) => {
        const isSelected = selected === option;
        const label = option === 'all' ? 'All' : option.charAt(0).toUpperCase() + option.slice(1);

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
            {label}
          </button>
        );
      })}
    </div>
  );
}
