import type { PortfolioContent } from '@prisma/client';
import Image from 'next/image';

interface PortfolioCardProps {
  item: PortfolioContent;
}

export function PortfolioCard({ item }: PortfolioCardProps) {
  return (
    <article
      className="group bg-gray-900 rounded-xl border border-gray-800 overflow-hidden transition-all duration-200 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/20 focus-within:border-blue-600/50 focus-within:shadow-lg focus-within:shadow-blue-900/20"
    >
      {/* Thumbnail */}
      <div className="relative w-full h-40 bg-gradient-to-br from-blue-900/30 to-purple-900/30 overflow-hidden">
        {item.file_url ? (
          <Image
            src={item.file_url}
            alt={`${item.title} resume example thumbnail`}
            fill
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
            <svg
              className="w-12 h-12 text-blue-600/40"
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
        {item.is_featured && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-500 text-yellow-950 text-xs font-bold rounded-full">
            Featured
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Industry badge */}
        <span className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-600/30 capitalize">
          {item.content_type}
        </span>

        {/* Title */}
        <h3 className="text-white font-semibold text-base leading-snug">
          {item.title}
        </h3>

        {/* Key improvements / description */}
        {item.description != null && item.description.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Key Improvements
            </p>
            <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">
              {item.description}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
