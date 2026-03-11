/**
 * @jest-environment node
 */
import { apiClient, withLoading } from '@/app/lib/api-client';

// Mock retry — pass through the function directly (retry tested separately)
jest.mock('@/app/lib/retry', () => ({
  withRetry: jest.fn(async (fn: () => Promise<unknown>) => fn()),
  RETRY_POLICIES: { default: { maxRetries: 0 } },
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('apiClient [P0]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- GET ---
  describe('GET', () => {
    it('[P0] should return parsed JSON on success', async () => {
      // Given: a successful API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: 1 } }),
      });

      // When: GET request is made
      const result = await apiClient.get('/api/test');

      // Then: parsed response returned
      expect(result).toEqual({ success: true, data: { id: 1 } });
      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ method: 'GET' }));
    });

    it('[P0] should return error response for non-ok status with JSON body', async () => {
      // Given: a 400 response with error body
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ success: false, error: { code: 'VALIDATION', message: 'Invalid' } }),
      });

      // When
      const result = await apiClient.get('/api/test');

      // Then
      expect(result).toEqual({ success: false, error: { code: 'VALIDATION', message: 'Invalid' } });
    });

    it('[P0] should return generic error for non-ok status without JSON body', async () => {
      // Given: a 500 response with non-JSON body
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('not json'); },
      });

      // When
      const result = await apiClient.get('/api/test');

      // Then
      expect(result).toEqual({
        success: false,
        error: { code: 'HTTP_500', message: 'Internal Server Error' },
      });
    });
  });

  // --- POST ---
  describe('POST', () => {
    it('[P0] should send JSON body', async () => {
      // Given
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { created: true } }),
      });

      // When
      await apiClient.post('/api/test', { name: 'foo' });

      // Then
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'foo' }),
        })
      );
    });

    it('[P0] should handle POST without body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: null }),
      });

      await apiClient.post('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({ method: 'POST', body: undefined })
      );
    });
  });

  // --- PUT ---
  describe('PUT', () => {
    it('[P1] should send PUT request with body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { updated: true } }),
      });

      await apiClient.put('/api/test/1', { name: 'bar' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ name: 'bar' }) })
      );
    });
  });

  // --- PATCH ---
  describe('PATCH', () => {
    it('[P1] should send PATCH request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      await apiClient.patch('/api/test/1', { status: 'active' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  // --- DELETE ---
  describe('DELETE', () => {
    it('[P1] should send DELETE request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: null }),
      });

      await apiClient.delete('/api/test/1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  // --- Loading callback ---
  describe('onLoadingChange', () => {
    it('[P0] should call onLoadingChange(true) before request and (false) after', async () => {
      // Given
      const onLoadingChange = jest.fn();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      // When
      await apiClient.get('/api/test', { onLoadingChange });

      // Then: called true first, then false
      expect(onLoadingChange).toHaveBeenCalledTimes(2);
      expect(onLoadingChange).toHaveBeenNthCalledWith(1, true);
      expect(onLoadingChange).toHaveBeenNthCalledWith(2, false);
    });

    it('[P0] should call onLoadingChange(false) even on fetch error', async () => {
      const onLoadingChange = jest.fn();
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(apiClient.get('/api/test', { onLoadingChange })).rejects.toThrow('Network error');

      expect(onLoadingChange).toHaveBeenNthCalledWith(1, true);
      expect(onLoadingChange).toHaveBeenNthCalledWith(2, false);
    });
  });

  // --- Custom headers ---
  describe('custom config', () => {
    it('[P1] should merge custom headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      await apiClient.get('/api/test', { headers: { 'X-Custom': 'value' } });

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Custom': 'value',
        })
      );
    });
  });
});

describe('withLoading [P1]', () => {
  it('should return config with onLoadingChange callback', () => {
    const config = withLoading('upload');

    expect(config).toHaveProperty('onLoadingChange');
    expect(typeof config.onLoadingChange).toBe('function');
  });

  it('should merge with existing config', () => {
    const config = withLoading('analysis', { headers: { 'X-Test': '1' } });

    expect(config.headers).toEqual({ 'X-Test': '1' });
    expect(config.onLoadingChange).toBeDefined();
  });
});
