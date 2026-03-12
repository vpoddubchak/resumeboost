import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategoryBreakdown } from '@/app/components/resume/category-breakdown';
import type { CategoryScore } from '@/app/components/resume/category-breakdown';

const defaultCategories: CategoryScore[] = [
  { key: 'skills', label: 'Skills Match', score: 80, details: ['Strong React experience', 'TypeScript proficiency'] },
  { key: 'experience', label: 'Experience Match', score: 60, details: ['5 years experience'] },
  { key: 'qualifications', label: 'Qualifications Match', score: 40, details: ['Missing AWS certification'] },
];

describe('CategoryBreakdown', () => {
  describe('Rendering category labels and scores', () => {
    it('renders all category labels', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      expect(screen.getByText('Skills Match')).toBeInTheDocument();
      expect(screen.getByText('Experience Match')).toBeInTheDocument();
      expect(screen.getByText('Qualifications Match')).toBeInTheDocument();
    });

    it('renders section heading "Category Breakdown"', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
    });

    it('renders score percentages', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('has role="region" and aria-label on the section', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      const region = screen.getByRole('region', { name: 'Category Breakdown' });
      expect(region).toBeInTheDocument();
    });
  });

  describe('Color coding', () => {
    it('score >= 75 uses green bar (bg-green-500)', () => {
      const categories: CategoryScore[] = [
        { key: 'skills', label: 'Skills Match', score: 80, details: [] },
      ];
      const { container } = render(<CategoryBreakdown categories={categories} />);
      const bar = container.querySelector('.bg-green-500');
      expect(bar).toBeInTheDocument();
    });

    it('score >= 50 and < 75 uses yellow bar (bg-yellow-500)', () => {
      const categories: CategoryScore[] = [
        { key: 'experience', label: 'Experience Match', score: 60, details: [] },
      ];
      const { container } = render(<CategoryBreakdown categories={categories} />);
      const bar = container.querySelector('.bg-yellow-500');
      expect(bar).toBeInTheDocument();
    });

    it('score < 50 uses red bar (bg-red-500)', () => {
      const categories: CategoryScore[] = [
        { key: 'qualifications', label: 'Qualifications Match', score: 40, details: [] },
      ];
      const { container } = render(<CategoryBreakdown categories={categories} />);
      const bar = container.querySelector('.bg-red-500');
      expect(bar).toBeInTheDocument();
    });

    it('score exactly 75 uses green (boundary)', () => {
      const categories: CategoryScore[] = [
        { key: 'skills', label: 'Skills Match', score: 75, details: [] },
      ];
      const { container } = render(<CategoryBreakdown categories={categories} />);
      expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
    });

    it('score exactly 50 uses yellow (boundary)', () => {
      const categories: CategoryScore[] = [
        { key: 'skills', label: 'Skills Match', score: 50, details: [] },
      ];
      const { container } = render(<CategoryBreakdown categories={categories} />);
      expect(container.querySelector('.bg-yellow-500')).toBeInTheDocument();
    });

    it('score 49 uses red (below medium boundary)', () => {
      const categories: CategoryScore[] = [
        { key: 'skills', label: 'Skills Match', score: 49, details: [] },
      ];
      const { container } = render(<CategoryBreakdown categories={categories} />);
      expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
    });
  });

  describe('Progress bar', () => {
    it('progress bars have role="progressbar"', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      const bars = screen.getAllByRole('progressbar');
      expect(bars.length).toBe(3);
    });

    it('progress bars have aria-valuenow matching score', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      const bars = screen.getAllByRole('progressbar');
      expect(bars[0]).toHaveAttribute('aria-valuenow', '80');
      expect(bars[1]).toHaveAttribute('aria-valuenow', '60');
      expect(bars[2]).toHaveAttribute('aria-valuenow', '40');
    });

    it('progress bars have aria-valuemin=0 and aria-valuemax=100', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      const bars = screen.getAllByRole('progressbar');
      bars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
      });
    });
  });

  describe('Expandable detail panels', () => {
    it('detail items are NOT shown by default', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      expect(screen.queryByText('Strong React experience')).not.toBeInTheDocument();
    });

    it('clicking a category row expands to show detail items', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      const skillsButton = screen.getByRole('button', { name: /skills match/i });
      fireEvent.click(skillsButton);
      expect(screen.getByText('Strong React experience')).toBeInTheDocument();
      expect(screen.getByText('TypeScript proficiency')).toBeInTheDocument();
    });

    it('clicking again collapses the detail panel', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      const skillsButton = screen.getByRole('button', { name: /skills match/i });
      fireEvent.click(skillsButton);
      expect(screen.getByText('Strong React experience')).toBeInTheDocument();
      fireEvent.click(skillsButton);
      expect(screen.queryByText('Strong React experience')).not.toBeInTheDocument();
    });

    it('Enter key toggles panel open', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      const skillsButton = screen.getByRole('button', { name: /skills match/i });
      fireEvent.keyDown(skillsButton, { key: 'Enter', code: 'Enter' });
      expect(screen.getByText('Strong React experience')).toBeInTheDocument();
    });

    it('Space key toggles panel open', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      const skillsButton = screen.getByRole('button', { name: /skills match/i });
      fireEvent.keyDown(skillsButton, { key: ' ', code: 'Space' });
      expect(screen.getByText('Strong React experience')).toBeInTheDocument();
    });

    it('Escape key closes expanded panel', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      const skillsButton = screen.getByRole('button', { name: /skills match/i });
      fireEvent.click(skillsButton);
      expect(screen.getByText('Strong React experience')).toBeInTheDocument();
      fireEvent.keyDown(skillsButton, { key: 'Escape', code: 'Escape' });
      expect(screen.queryByText('Strong React experience')).not.toBeInTheDocument();
    });

    it('aria-expanded attribute is false when collapsed', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      const skillsButton = screen.getByRole('button', { name: /skills match/i });
      expect(skillsButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('aria-expanded toggles to true when expanded', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      const skillsButton = screen.getByRole('button', { name: /skills match/i });
      fireEvent.click(skillsButton);
      expect(skillsButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('details list has aria-label with category name', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      const skillsButton = screen.getByRole('button', { name: /skills match/i });
      fireEvent.click(skillsButton);
      expect(screen.getByRole('list', { name: 'Skills Match details' })).toBeInTheDocument();
    });
  });

  describe('Empty details array', () => {
    it('renders category without expand toggle when details is empty', () => {
      const categories: CategoryScore[] = [
        { key: 'skills', label: 'Skills Match', score: 80, details: [] },
      ];
      render(<CategoryBreakdown categories={categories} />);
      const btn = screen.getByRole('button', { name: /skills match/i });
      expect(btn).toHaveAttribute('disabled');
    });

    it('empty details: aria-expanded is NOT set on disabled row', () => {
      const categories: CategoryScore[] = [
        { key: 'skills', label: 'Skills Match', score: 80, details: [] },
      ];
      render(<CategoryBreakdown categories={categories} />);
      const btn = screen.getByRole('button', { name: /skills match/i });
      expect(btn).not.toHaveAttribute('aria-expanded');
    });
  });

  describe('Touch targets and focus-visible', () => {
    it('category rows have min-h-[48px] for touch targets', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn.className).toContain('min-h-[48px]');
      });
    });

    it('category rows have focus-visible ring classes', () => {
      render(<CategoryBreakdown categories={defaultCategories} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn.className).toContain('focus-visible:ring-2');
        expect(btn.className).toContain('focus-visible:ring-blue-500');
      });
    });
  });

  describe('Responsive classes', () => {
    it('label has sm:w-44 class for desktop alignment', () => {
      const { container } = render(<CategoryBreakdown categories={defaultCategories} />);
      const labelEl = container.querySelector('.sm\\:w-44');
      expect(labelEl).toBeInTheDocument();
    });
  });
});
