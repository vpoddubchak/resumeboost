import type { SuccessStory } from '@prisma/client';
import { Prisma } from '@prisma/client';

function isMetricsObject(v: Prisma.JsonValue): v is Record<string, string | number> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const METRIC_LABELS: Record<string, string> = {
  salaryIncrease: '↑ Salary',
  interviewsSecured: 'Interviews',
  timeToOffer: 'Time to Offer',
  responseRateImprovement: '↑ Response Rate',
};

interface SuccessStoryCardProps {
  item: SuccessStory;
}

export function SuccessStoryCard({ item }: SuccessStoryCardProps) {
  const metricsObj = item.metrics && isMetricsObject(item.metrics) ? item.metrics : null;

  const outcomeLabel = item.outcome_type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <article
      className="group bg-gray-900 rounded-xl border border-gray-800 overflow-hidden transition-all duration-200 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/20 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
      aria-label={`Success story: ${item.client_name}${item.client_role ? `, ${item.client_role}` : ''}`}
    >
      <div className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Header: name, role, badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-base leading-snug">{item.client_name}</h3>
            {item.client_role && (
              <p className="text-sm text-gray-400 mt-0.5">{item.client_role}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {item.is_featured && (
              <span className="px-2 py-0.5 bg-yellow-500 text-yellow-950 text-xs font-bold rounded-full">
                Featured
              </span>
            )}
          </div>
        </div>

        {/* Industry + outcome_type badges */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-600/30 capitalize">
            {item.industry}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-600/20 text-purple-300 border border-purple-600/30">
            {outcomeLabel}
          </span>
        </div>

        {/* Testimonial quote */}
        {item.testimonial_quote && (
          <blockquote className="border-l-2 border-blue-500/50 pl-3">
            <p className="text-sm text-gray-300 italic leading-relaxed before:content-['\u201C'] after:content-['\u201D']">
              {item.testimonial_quote}
            </p>
            <cite className="mt-1 block text-xs text-gray-500 not-italic">— {item.client_name}</cite>
          </blockquote>
        )}

        {/* Challenge / Solution / Results */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Challenge</p>
            <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">{item.challenge}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Solution</p>
            <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">{item.solution}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Results</p>
            <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">{item.results}</p>
          </div>
        </div>

        {/* Metrics badges */}
        {metricsObj && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-800">
            {Object.entries(metricsObj).map(([key, val]) => (
              <span
                key={key}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700"
              >
                {METRIC_LABELS[key] ?? key}: {String(val)}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
