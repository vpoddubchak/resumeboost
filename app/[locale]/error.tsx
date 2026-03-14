'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  useEffect(() => {
    console.error('[RootError]', error.message, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="mb-6 text-6xl">😔</div>
      <h1 className="mb-3 text-2xl font-bold text-gray-900">
        {t('somethingWentWrong')}
      </h1>
      <p className="mb-6 max-w-md text-gray-600">
        {t('unexpectedError')}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {t('tryAgain')}
      </button>
    </div>
  );
}
