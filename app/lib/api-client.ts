import { withRetry, RETRY_POLICIES } from './retry';
import type { RetryConfig } from './retry';

// ============================================================
// API Response Types (matches established pattern from Story 0.2)
// ============================================================

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================
// API Client Configuration
// ============================================================

interface ApiClientConfig {
  baseUrl?: string;
  retryConfig?: RetryConfig;
  circuitBreakerKey?: string;
  headers?: Record<string, string>;
  onLoadingChange?: (isLoading: boolean) => void;
}

const DEFAULT_CONFIG: Required<Pick<ApiClientConfig, 'baseUrl' | 'retryConfig'>> = {
  baseUrl: '',
  retryConfig: { maxRetries: 2, baseDelayMs: 500, maxDelayMs: 4000, backoffMultiplier: 2, jitter: true },
};

// ============================================================
// API Client
// ============================================================

async function makeRequest<T>(
  url: string,
  options: RequestInit,
  config: ApiClientConfig = {}
): Promise<ApiResponse<T>> {
  const { retryConfig = DEFAULT_CONFIG.retryConfig, circuitBreakerKey, headers: extraHeaders } = config;

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...extraHeaders,
    },
  };

  const { onLoadingChange } = config;
  onLoadingChange?.(true);

  try {
    return await withRetry<ApiResponse<T>>(
      async () => {
        const response = await fetch(url, mergedOptions);

        if (!response.ok) {
          // Try to parse error body
          try {
            const errorBody = await response.json();
            if (errorBody && typeof errorBody === 'object' && 'error' in errorBody) {
              return errorBody as ApiErrorResponse;
            }
          } catch {
            // Response body not JSON
          }

          return {
            success: false,
            error: {
              code: `HTTP_${response.status}`,
              message: response.statusText || `Request failed with status ${response.status}`,
            },
          };
        }

        return response.json() as Promise<ApiResponse<T>>;
      },
      retryConfig,
      circuitBreakerKey
    );
  } finally {
    onLoadingChange?.(false);
  }
}

export const apiClient = {
  async get<T>(url: string, config?: ApiClientConfig): Promise<ApiResponse<T>> {
    return makeRequest<T>(url, { method: 'GET' }, config);
  },

  async post<T>(url: string, body?: unknown, config?: ApiClientConfig): Promise<ApiResponse<T>> {
    return makeRequest<T>(
      url,
      {
        method: 'POST',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      config
    );
  },

  async put<T>(url: string, body?: unknown, config?: ApiClientConfig): Promise<ApiResponse<T>> {
    return makeRequest<T>(
      url,
      {
        method: 'PUT',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      config
    );
  },

  async patch<T>(url: string, body?: unknown, config?: ApiClientConfig): Promise<ApiResponse<T>> {
    return makeRequest<T>(
      url,
      {
        method: 'PATCH',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      config
    );
  },

  async delete<T>(url: string, config?: ApiClientConfig): Promise<ApiResponse<T>> {
    return makeRequest<T>(url, { method: 'DELETE' }, config);
  },
};

// Helper to create loading-aware config using UI store
export function withLoading(
  loadingKey: 'upload' | 'analysis' | 'saving',
  config?: ApiClientConfig
): ApiClientConfig {
  return {
    ...config,
    onLoadingChange: (isLoading: boolean) => {
      // Dynamic import to avoid circular dependency at module level
      // Consumer should use this on client side only
      try {
        const { useUIStore } = require('@/app/store/ui-store');
        useUIStore.getState().setLoading(loadingKey, isLoading);
      } catch {
        // Silently fail if store not available (e.g., server-side)
      }
    },
  };
}

export { RETRY_POLICIES };
export type { ApiClientConfig };
