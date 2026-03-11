'use client';

interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
  feature?: string;
}

export function ErrorFallback({ error, onReset, feature }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 text-center"
    >
      <div className="mb-4 text-4xl">⚠️</div>
      <h2 className="mb-2 text-lg font-semibold text-gray-900">
        Something went wrong
      </h2>
      <p className="mb-4 max-w-md text-sm text-gray-600">
        {feature
          ? `We encountered an issue with ${feature}. Please try again.`
          : 'An unexpected error occurred. Please try again or refresh the page.'}
      </p>
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-4 w-full max-w-md text-left">
          <summary className="cursor-pointer text-xs text-gray-500">
            Error details (development only)
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
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorFallback;
