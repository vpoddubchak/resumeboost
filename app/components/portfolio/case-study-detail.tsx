import type { PortfolioContent } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';

interface CaseStudyDetailProps {
  item: PortfolioContent;
}

export function CaseStudyDetail({ item }: CaseStudyDetailProps) {
  const formattedDate = item.created_at
    ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
        new Date(item.created_at)
      )
    : null;

  return (
    <article>
      {/* Back navigation */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href="/portfolio"
          className="min-h-[44px] inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded"
        >
          ← Back to Portfolio
        </Link>
      </nav>

      {/* Header section */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-600/30 capitalize">
            {item.content_type}
          </span>
          {item.is_featured && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500 text-yellow-950">
              Featured
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white">{item.title}</h1>

        {formattedDate && (
          <time className="text-sm text-gray-400" dateTime={item.created_at.toISOString()}>
            {formattedDate}
          </time>
        )}
      </div>

      {/* Thumbnail */}
      <div className="relative w-full h-56 sm:h-72 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl overflow-hidden mb-8">
        {item.file_url ? (
          <Image
            src={item.file_url}
            alt={`${item.title} resume example`}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
            <svg
              className="w-16 h-16 text-blue-600/40"
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
          </div>
        )}
      </div>

      {/* Description / Case study narrative */}
      {item.description != null && item.description.length > 0 && (
        <section aria-label="Case study details">
          <h2 className="text-lg font-semibold text-white mb-4">Case Study Details</h2>
          <div className="text-gray-300 leading-relaxed whitespace-pre-line text-base">
            {item.description}
          </div>
        </section>
      )}
    </article>
  );
}
