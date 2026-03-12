import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock stores before importing component
const mockGoToNextStep = jest.fn();
const mockSetCurrentStep = jest.fn();

jest.mock('@/app/store/ui-store', () => ({
  useUIStore: jest.fn((selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      goToNextStep: mockGoToNextStep,
      setCurrentStep: mockSetCurrentStep,
      currentStep: 3,
      steps: { upload: 'completed', analysis: 'completed', review: 'active', complete: 'disabled' },
    };
    return selector(state);
  }),
  selectCurrentStep: (state: Record<string, unknown>) => state.currentStep,
}));

let mockAnalysis: Record<string, unknown> | null = null;

jest.mock('@/app/store/resume-store', () => ({
  useResumeStore: jest.fn((selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      analysis: mockAnalysis,
    };
    return selector(state);
  }),
  selectUploadStatus: (state: Record<string, unknown>) => state.upload,
  selectJobDescription: (state: Record<string, unknown>) => state.jobDescription,
  selectAnalysisResult: (state: Record<string, unknown>) => state.analysis,
}));

jest.mock('@/app/components/resume/step-navigation', () => ({
  StepNavigation: () => <div data-testid="step-navigation">StepNav</div>,
}));

jest.mock('@/app/components/resume/file-upload', () => ({
  FileUpload: () => <div>FileUpload</div>,
}));

jest.mock('@/app/components/resume/job-description-input', () => ({
  JobDescriptionInput: () => <div>JobDescriptionInput</div>,
}));

jest.mock('@/app/components/resume/upload-progress', () => ({
  UploadProgress: () => <div>UploadProgress</div>,
}));

jest.mock('@/app/components/resume/analysis-progress', () => ({
  AnalysisProgress: () => <div>AnalysisProgress</div>,
}));

import ResumeAnalysisPage from '@/app/resume-analysis/page';

describe('ReviewStep (via ResumeAnalysisPage at step 3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalysis = null;
  });

  describe('null guard — analysis is null', () => {
    it('shows error alert when analysis is null', () => {
      mockAnalysis = null;
      render(<ResumeAnalysisPage />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Missing Analysis')).toBeInTheDocument();
    });

    it('shows "Go Back to Upload" button when analysis is null', () => {
      mockAnalysis = null;
      render(<ResumeAnalysisPage />);
      expect(screen.getByText('Go Back to Upload')).toBeInTheDocument();
    });

    it('redirects to Step 1 when "Go Back to Upload" is clicked', () => {
      mockAnalysis = null;
      render(<ResumeAnalysisPage />);
      fireEvent.click(screen.getByText('Go Back to Upload'));
      expect(mockSetCurrentStep).toHaveBeenCalledWith(1);
    });
  });

  describe('with valid analysis data', () => {
    beforeEach(() => {
      mockAnalysis = {
        analysisId: 1,
        score: 82,
        analysisData: {
          matchScore: 82,
          strengths: ['Good TypeScript skills'],
          weaknesses: ['Limited cloud experience'],
          recommendations: ['Learn AWS basics'],
        },
        recommendations: {
          strengths: ['Good TypeScript skills'],
          weaknesses: ['Limited cloud experience'],
          recommendations: ['Learn AWS basics'],
        },
        createdAt: '2026-03-12T10:00:00.000Z',
      };
    });

    it('renders AnalysisResults with correct score', () => {
      render(<ResumeAnalysisPage />);
      const scores = screen.getAllByText('82%');
      expect(scores.length).toBeGreaterThan(0);
    });

    it('renders strengths from analysisData', () => {
      render(<ResumeAnalysisPage />);
      expect(screen.getByText('Good TypeScript skills')).toBeInTheDocument();
    });

    it('renders weaknesses from analysisData', () => {
      render(<ResumeAnalysisPage />);
      expect(screen.getByText('Limited cloud experience')).toBeInTheDocument();
    });

    it('renders recommendations from analysisData', () => {
      render(<ResumeAnalysisPage />);
      expect(screen.getByText('Learn AWS basics')).toBeInTheDocument();
    });

    it('renders "Book a Consultation" CTA button', () => {
      render(<ResumeAnalysisPage />);
      expect(screen.getByText('Book a Consultation')).toBeInTheDocument();
    });

    it('calls goToNextStep when "Book a Consultation" is clicked', () => {
      render(<ResumeAnalysisPage />);
      fireEvent.click(screen.getByText('Book a Consultation'));
      expect(mockGoToNextStep).toHaveBeenCalledTimes(1);
    });

    it('renders "Back to Analysis" secondary button', () => {
      render(<ResumeAnalysisPage />);
      expect(screen.getByText('Back to Analysis')).toBeInTheDocument();
    });

    it('calls setCurrentStep(2) when "Back to Analysis" is clicked', () => {
      render(<ResumeAnalysisPage />);
      fireEvent.click(screen.getByText('Back to Analysis'));
      expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
    });

    it('CTA buttons have focus-visible ring classes', () => {
      render(<ResumeAnalysisPage />);
      const bookBtn = screen.getByText('Book a Consultation');
      const backBtn = screen.getByText('Back to Analysis');
      expect(bookBtn.className).toContain('focus-visible:ring-2');
      expect(backBtn.className).toContain('focus-visible:ring-2');
    });
  });

  describe('defensive defaults for malformed analysisData', () => {
    it('handles analysisData with missing arrays gracefully', () => {
      mockAnalysis = {
        analysisId: 2,
        score: 50,
        analysisData: {},
        recommendations: null,
        createdAt: '2026-03-12T10:00:00.000Z',
      };
      // Should not crash — defaults to empty arrays
      render(<ResumeAnalysisPage />);
      expect(screen.getByText('Resume Match Score')).toBeInTheDocument();
      const scores = screen.getAllByText('50%');
      expect(scores.length).toBeGreaterThan(0);
    });

    it('handles null analysisData gracefully', () => {
      mockAnalysis = {
        analysisId: 3,
        score: null,
        analysisData: null,
        recommendations: null,
        createdAt: '2026-03-12T10:00:00.000Z',
      };
      render(<ResumeAnalysisPage />);
      expect(screen.getByText('Resume Match Score')).toBeInTheDocument();
      const scores = screen.getAllByText('0%');
      expect(scores.length).toBeGreaterThan(0);
    });
  });
});
