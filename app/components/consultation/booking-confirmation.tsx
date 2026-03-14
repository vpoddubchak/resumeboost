'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/app/i18n/navigation';

interface BookingConfirmationProps {
  consultationDate: string;
  consultationTime: string;
  timezone: string;
  onBackToResults?: () => void;
}

export function BookingConfirmation({
  consultationDate,
  consultationTime,
  timezone,
  onBackToResults,
}: BookingConfirmationProps) {
  const t = useTranslations('consultation');
  const tc = useTranslations('common');

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-6">
      {/* Success icon */}
      <div className="mx-auto w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">{t('bookingConfirmed')}</h2>
        <p className="text-base text-gray-400">
          {t('bookingConfirmedDescription', {
            date: consultationDate,
            time: consultationTime,
            timezone,
          })}
        </p>
      </div>

      <div className="space-y-3">
        {onBackToResults && (
          <button
            onClick={onBackToResults}
            className="w-full min-h-[48px] py-3 px-6 rounded-xl font-semibold text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:outline-none"
          >
            {t('backToResults')}
          </button>
        )}
        <Link
          href="/"
          className="block w-full min-h-[48px] py-3 px-6 rounded-xl font-semibold text-base bg-gray-800 hover:bg-gray-700 text-gray-300 text-center transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:outline-none"
        >
          {tc('actions.goBackHome')}
        </Link>
      </div>
    </div>
  );
}
