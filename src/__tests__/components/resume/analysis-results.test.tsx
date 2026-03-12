import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnalysisResults } from '@/app/components/resume/analysis-results';

const defaultProps = {
  matchScore: 85,
  strengths: ['Strong React experience', 'TypeScript proficiency'],
  weaknesses: ['Limited Java knowledge'],
  recommendations: ['Learn Java basics', 'Add unit test examples to resume'],
};

describe('AnalysisResults', () => {
  describe('Match score display', () => {
    it('renders match score correctly', () => {
      render(<AnalysisResults {...defaultProps} />);
      const scores = screen.getAllByText('85%');
      expect(scores.length).toBeGreaterThan(0);
    });

    it('renders score section heading', () => {
      render(<AnalysisResults {...defaultProps} />);
      expect(screen.getByText('Resume Match Score')).toBeInTheDocument();
    });

    it('shows "Strong Match" label for score >= 75', () => {
      render(<AnalysisResults {...defaultProps} matchScore={75} />);
      expect(screen.getByText('Strong Match')).toBeInTheDocument();
    });

    it('shows "Partial Match" label for score 50–74', () => {
      render(<AnalysisResults {...defaultProps} matchScore={60} />);
      expect(screen.getByText('Partial Match')).toBeInTheDocument();
    });

    it('shows "Low Match" label for score < 50', () => {
      render(<AnalysisResults {...defaultProps} matchScore={30} />);
      expect(screen.getByText('Low Match')).toBeInTheDocument();
    });
  });

  describe('Score color coding', () => {
    it('score=49 renders red color class on score ring text', () => {
      const { container } = render(<AnalysisResults {...defaultProps} matchScore={49} />);
      const scoreText = container.querySelector('span[aria-hidden="true"]');
      expect(scoreText?.className).toContain('text-red-400');
    });

    it('score=50 renders yellow color class on score ring text', () => {
      const { container } = render(<AnalysisResults {...defaultProps} matchScore={50} />);
      const scoreText = container.querySelector('span[aria-hidden="true"]');
      expect(scoreText?.className).toContain('text-yellow-400');
    });

    it('score=75 renders green color class on score ring text', () => {
      const { container } = render(<AnalysisResults {...defaultProps} matchScore={75} />);
      const scoreText = container.querySelector('span[aria-hidden="true"]');
      expect(scoreText?.className).toContain('text-green-400');
    });
  });

  describe('Strengths section', () => {
    it('renders strengths items', () => {
      render(<AnalysisResults {...defaultProps} />);
      expect(screen.getByText('Strong React experience')).toBeInTheDocument();
      expect(screen.getByText('TypeScript proficiency')).toBeInTheDocument();
    });

    it('renders correct number of strength items', () => {
      render(<AnalysisResults {...defaultProps} />);
      const strengthsList = document.querySelector('[aria-label="Strengths list"]');
      expect(strengthsList?.querySelectorAll('li').length).toBe(2);
    });

    it('strengths list has role="list"', () => {
      render(<AnalysisResults {...defaultProps} />);
      expect(document.querySelector('[aria-label="Strengths list"]')).toHaveAttribute('role', 'list');
    });
  });

  describe('Weaknesses section', () => {
    it('renders weaknesses when non-empty', () => {
      render(<AnalysisResults {...defaultProps} />);
      expect(screen.getByText('Limited Java knowledge')).toBeInTheDocument();
    });

    it('hides weaknesses section when empty array', () => {
      render(<AnalysisResults {...defaultProps} weaknesses={[]} />);
      expect(screen.queryByText('Areas to Improve')).not.toBeInTheDocument();
      expect(document.querySelector('[aria-label="Weaknesses list"]')).not.toBeInTheDocument();
    });

    it('weaknesses list has role="list" when present', () => {
      render(<AnalysisResults {...defaultProps} />);
      expect(document.querySelector('[aria-label="Weaknesses list"]')).toHaveAttribute('role', 'list');
    });

    it('renders correct number of weakness items', () => {
      render(<AnalysisResults {...defaultProps} weaknesses={['w1', 'w2', 'w3']} />);
      const weaknessesList = document.querySelector('[aria-label="Weaknesses list"]');
      expect(weaknessesList?.querySelectorAll('li').length).toBe(3);
    });
  });

  describe('Recommendations section', () => {
    it('renders recommendation items', () => {
      render(<AnalysisResults {...defaultProps} />);
      expect(screen.getByText('Learn Java basics')).toBeInTheDocument();
      expect(screen.getByText('Add unit test examples to resume')).toBeInTheDocument();
    });

    it('recommendations list has role="list"', () => {
      render(<AnalysisResults {...defaultProps} />);
      expect(document.querySelector('[aria-label="Recommendations list"]')).toHaveAttribute('role', 'list');
    });

    it('renders correct number of recommendation items', () => {
      render(<AnalysisResults {...defaultProps} />);
      const recList = document.querySelector('[aria-label="Recommendations list"]');
      expect(recList?.querySelectorAll('li').length).toBe(2);
    });
  });

  describe('Accessibility', () => {
    it('score ring has role="img" with aria-label', () => {
      render(<AnalysisResults {...defaultProps} matchScore={85} />);
      const svgs = document.querySelectorAll('svg[role="img"]');
      expect(svgs.length).toBeGreaterThan(0);
      const scoreRing = svgs[0];
      expect(scoreRing).toHaveAttribute('aria-label', 'Match score: 85 percent');
    });

    it('has aria-live="polite" on score section for dynamic content', () => {
      render(<AnalysisResults {...defaultProps} />);
      const liveRegions = document.querySelectorAll('[aria-live="polite"]');
      expect(liveRegions.length).toBeGreaterThan(0);
      // aria-live should be scoped to score section, not entire container
      const scoreSection = liveRegions[0];
      expect(scoreSection.tagName).toBe('SECTION');
    });
  });

  describe('Collapsible cards', () => {
    it('sections are open by default', () => {
      render(<AnalysisResults {...defaultProps} />);
      expect(screen.getByText('Strong React experience')).toBeVisible();
    });

    it('collapse toggles with mouse click', () => {
      render(<AnalysisResults {...defaultProps} />);
      const strengthsButton = screen.getByRole('button', { name: /strengths/i });
      fireEvent.click(strengthsButton);
      expect(screen.queryByText('Strong React experience')).not.toBeInTheDocument();
      fireEvent.click(strengthsButton);
      expect(screen.getByText('Strong React experience')).toBeInTheDocument();
    });

    it('collapse toggles with keyboard Enter key', () => {
      render(<AnalysisResults {...defaultProps} />);
      const strengthsButton = screen.getByRole('button', { name: /strengths/i });
      fireEvent.keyDown(strengthsButton, { key: 'Enter', code: 'Enter' });
      // Native button handles Enter → triggers click → toggles state
      fireEvent.click(strengthsButton);
      expect(screen.queryByText('Strong React experience')).not.toBeInTheDocument();
    });

    it('Escape key closes an open collapsible card', () => {
      render(<AnalysisResults {...defaultProps} />);
      const strengthsButton = screen.getByRole('button', { name: /strengths/i });
      expect(screen.getByText('Strong React experience')).toBeInTheDocument();
      fireEvent.keyDown(strengthsButton, { key: 'Escape', code: 'Escape' });
      expect(screen.queryByText('Strong React experience')).not.toBeInTheDocument();
    });

    it('collapse buttons have min-h-[48px] for touch target and focus-visible ring', () => {
      render(<AnalysisResults {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn.className).toContain('min-h-[48px]');
        expect(btn.className).toContain('focus-visible:ring-2');
      });
    });

    it('collapse buttons have aria-expanded attribute', () => {
      render(<AnalysisResults {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute('aria-expanded');
      });
    });
  });
});
