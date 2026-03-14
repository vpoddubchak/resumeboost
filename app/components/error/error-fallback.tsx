'use client';

import { useTranslations } from 'next-intl';

interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
  feature?: string;
}

export function ErrorFallback({ error, onReset, feature }: ErrorFallbackProps) {
  const t = useTranslations('errors');
  return (
    <div
      role="alert"
      className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 text-center"
    >
      <div className="mb-4 text-4xl">⚠️</div>
      <h2 className="mb-2 text-lg font-semibold text-gray-900">
        {t('somethingWentWrong')}
      </h2>
      <p className="mb-4 max-w-md text-sm text-gray-600">
        {feature
          ? t('featureError', { feature })
          : t('genericError')}
      </p>
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-4 w-full max-w-md text-left">
          <summary className="cursor-pointer text-xs text-gray-500">
            {t('errorDetails')}
          </summary>
          <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs text-red-700">
            {error.message}
          </pre>
        </details>
      )}
      {onReset && (
        <button
          onClick={onReset}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {t('tryAgain')}
        </button>
      )}
    </div>
  );
}

export default ErrorFallback;
