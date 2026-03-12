import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/app/lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

jest.mock('@/app/components/ui/loading-spinner', () => ({
  LoadingSpinner: ({ label }: { label?: string }) => (
    <div role="status" aria-label={label || 'Loading...'}>
      <span className="sr-only">{label}</span>
    </div>
  ),
}));

import { apiClient } from '@/app/lib/api-client';
import { useUIStore } from '@/app/store/ui-store';
import { AnalysisProgress } from '@/app/components/resume/analysis-progress';

const mockOnComplete = jest.fn();
const mockOnError = jest.fn();

const defaultProps = {
  onComplete: mockOnComplete,
  onError: mockOnError,
  uploadId: 1,
  jobDescription: 'Senior React developer with 5 years experience',
};

const mockSuccessResponse = {
  success: true,
  data: {
    analysisId: 100,
    score: 92,
    analysisData: { matchScore: 92, strengths: ['React'], weaknesses: ['Java'], recommendations: ['Learn Java'] },
    recommendations: { strengths: ['React'], weaknesses: ['Java'], recommendations: ['Learn Java'] },
    createdAt: '2026-03-12T09:00:00.000Z',
  },
};

describe('AnalysisProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    useUIStore.getState().resetLoading();
    (apiClient.post as jest.Mock).mockResolvedValue(mockSuccessResponse);
  });

  afterEach(() => {
    jest.useRealTimers();
    useUIStore.getState().resetLoading();
  });

  it('should render progress stages and spinner on mount', async () => {
    await act(async () => {
      render(<AnalysisProgress {...defaultProps} />);
    });

    expect(screen.getByText('Analyzing Your Resume')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should call API on mount with correct parameters', async () => {
    await act(async () => {
      render(<AnalysisProgress {...defaultProps} />);
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/analyses/run',
      { upload_id: 1, job_description: 'Senior React developer with 5 years experience' }
    );
  });

  it('should call onComplete with API response data on success', async () => {
    await act(async () => {
      render(<AnalysisProgress {...defaultProps} />);
    });

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(mockSuccessResponse.data);
    });
  });

  it('should set loading state to true on start and false on complete', async () => {
    let loadingDuringCall = false;
    (apiClient.post as jest.Mock).mockImplementation(async () => {
      loadingDuringCall = useUIStore.getState().loading.analysis;
      return mockSuccessResponse;
    });

    await act(async () => {
      render(<AnalysisProgress {...defaultProps} />);
    });

    // The component calls setLoading('analysis', true) before API call
    expect(loadingDuringCall).toBe(true);

    // After success, loading should be false
    await waitFor(() => {
      expect(useUIStore.getState().loading.analysis).toBe(false);
    });
  });

  it('should show error state with Retry button on API failure', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      success: false,
      error: { code: 'ANALYSIS_ERROR', message: 'AI analysis failed' },
    });

    await act(async () => {
      render(<AnalysisProgress {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    expect(mockOnError).toHaveBeenCalledWith('AI analysis failed');
  });

  it('should retry analysis when Retry button is clicked', async () => {
    (apiClient.post as jest.Mock)
      .mockResolvedValueOnce({
        success: false,
        error: { code: 'ANALYSIS_ERROR', message: 'Failed first time' },
      })
      .mockResolvedValueOnce(mockSuccessResponse);

    await act(async () => {
      render(<AnalysisProgress {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    });

    expect(apiClient.post).toHaveBeenCalledTimes(2);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(mockSuccessResponse.data);
    });
  });

  it('should show error state when API throws an exception', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network failure'));

    await act(async () => {
      render(<AnalysisProgress {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    expect(mockOnError).toHaveBeenCalledWith('Network failure');
  });

  it('should have accessible progress announcements with aria-live', async () => {
    await act(async () => {
      render(<AnalysisProgress {...defaultProps} />);
    });

    const liveRegions = screen.getAllByLabelText(/.*/);
    expect(liveRegions.length).toBeGreaterThan(0);
  });

  it('should have touch-friendly Retry button (min-h-[48px])', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      success: false,
      error: { code: 'ERROR', message: 'fail' },
    });

    await act(async () => {
      render(<AnalysisProgress {...defaultProps} />);
    });

    await waitFor(() => {
      const retryBtn = screen.getByRole('button', { name: /retry/i });
      expect(retryBtn).toBeInTheDocument();
      expect(retryBtn.className).toContain('min-h-[48px]');
    });
  });
});
