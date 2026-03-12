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

jest.mock('@/app/components/resume/category-breakdown', () => ({
  CategoryBreakdown: ({ categories }: { categories: Array<{ key: string; label: string; score: number }> }) => (
    <div data-testid="category-breakdown">
      {categories.map((c) => (
        <div key={c.key} data-testid={`category-${c.key}`}>
          {c.label}: {c.score}%
        </div>
      ))}
    </div>
  ),
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

  describe('CategoryBreakdown integration', () => {
    it('renders CategoryBreakdown component in ReviewStep', () => {
      mockAnalysis = {
        analysisId: 4,
        score: 78,
        analysisData: {
          matchScore: 78,
          strengths: ['Good TypeScript skills'],
          weaknesses: ['Limited cloud experience'],
          recommendations: ['Learn AWS basics'],
          categoryScores: { skills: 80, experience: 75, qualifications: 70 },
        },
        recommendations: null,
        createdAt: '2026-03-12T10:00:00.000Z',
      };
      render(<ResumeAnalysisPage />);
      expect(screen.getByTestId('category-breakdown')).toBeInTheDocument();
    });

    it('passes correct category scores to CategoryBreakdown', () => {
      mockAnalysis = {
        analysisId: 5,
        score: 78,
        analysisData: {
          matchScore: 78,
          strengths: ['Good skills'],
          weaknesses: [],
          recommendations: ['Improve experience'],
          categoryScores: { skills: 80, experience: 75, qualifications: 70 },
        },
        recommendations: null,
        createdAt: '2026-03-12T10:00:00.000Z',
      };
      render(<ResumeAnalysisPage />);
      expect(screen.getByTestId('category-skills')).toHaveTextContent('Skills Match: 80%');
      expect(screen.getByTestId('category-experience')).toHaveTextContent('Experience Match: 75%');
      expect(screen.getByTestId('category-qualifications')).toHaveTextContent('Qualifications Match: 70%');
    });

    it('categoryScores defaults to 0 when missing from analysisData', () => {
      mockAnalysis = {
        analysisId: 6,
        score: 50,
        analysisData: {
          matchScore: 50,
          strengths: ['Some skill'],
          weaknesses: [],
          recommendations: ['Do something'],
        },
        recommendations: null,
        createdAt: '2026-03-12T10:00:00.000Z',
      };
      render(<ResumeAnalysisPage />);
      expect(screen.getByTestId('category-skills')).toHaveTextContent('Skills Match: 0%');
      expect(screen.getByTestId('category-experience')).toHaveTextContent('Experience Match: 0%');
      expect(screen.getByTestId('category-qualifications')).toHaveTextContent('Qualifications Match: 0%');
    });

    it('CategoryBreakdown renders between score section and strengths section', () => {
      mockAnalysis = {
        analysisId: 7,
        score: 82,
        analysisData: {
          matchScore: 82,
          strengths: ['Good TypeScript skills'],
          weaknesses: [],
          recommendations: ['Learn AWS'],
          categoryScores: { skills: 85, experience: 80, qualifications: 78 },
        },
        recommendations: null,
        createdAt: '2026-03-12T10:00:00.000Z',
      };
      render(<ResumeAnalysisPage />);
      const breakdown = screen.getByTestId('category-breakdown');
      const strengths = screen.getByText('Good TypeScript skills');
      // category-breakdown should appear before strengths content in DOM
      expect(breakdown.compareDocumentPosition(strengths) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });
});
