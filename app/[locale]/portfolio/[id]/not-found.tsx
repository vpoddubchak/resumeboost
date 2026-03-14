import { getTranslations } from 'next-intl/server';
import { Link } from '@/app/i18n/navigation';

export default async function CaseStudyNotFound() {
  const t = await getTranslations('errors');

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <svg
        className="w-12 h-12 text-gray-500 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h2 className="text-xl font-bold mb-2">{t('pageNotFound')}</h2>
      <p className="text-gray-400 text-sm mb-6 text-center max-w-md">
        {t('pageNotFoundDescription')}
      </p>
      <Link
        href="/portfolio"
        className="min-h-[44px] inline-flex items-center px-6 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:outline-none"
      >
        {t('goBackHome')}
      </Link>
    </div>
  );
}
