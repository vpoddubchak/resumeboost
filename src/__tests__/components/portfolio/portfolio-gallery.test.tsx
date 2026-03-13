import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PortfolioGallery } from '@/app/components/portfolio/portfolio-gallery';
import type { PortfolioContent } from '@prisma/client';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const makeItem = (overrides: Partial<PortfolioContent> & { content_id: number }): PortfolioContent => ({
  title: `Item ${overrides.content_id}`,
  description: `Description for item ${overrides.content_id}`,
  content_type: 'engineering',
  file_url: null,
  is_featured: false,
  created_at: new Date('2024-01-01'),
  ...overrides,
});

const sampleItems: PortfolioContent[] = [
  makeItem({ content_id: 1, content_type: 'engineering', title: 'Engineer Resume' }),
  makeItem({ content_id: 2, content_type: 'marketing', title: 'Marketing Resume' }),
  makeItem({ content_id: 3, content_type: 'design', title: 'Design Resume' }),
  makeItem({ content_id: 4, content_type: 'engineering', title: 'Senior Engineer Resume' }),
];

describe('PortfolioGallery', () => {
  describe('Rendering with items', () => {
    it('renders a list of portfolio cards', () => {
      render(<PortfolioGallery items={sampleItems} />);
      const list = screen.getByRole('list', { name: 'Portfolio examples' });
      expect(list).toBeInTheDocument();
    });

    it('renders the correct number of cards', () => {
      render(<PortfolioGallery items={sampleItems} />);
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(sampleItems.length);
    });

    it('renders all card titles', () => {
      render(<PortfolioGallery items={sampleItems} />);
      expect(screen.getByText('Engineer Resume')).toBeInTheDocument();
      expect(screen.getByText('Marketing Resume')).toBeInTheDocument();
      expect(screen.getByText('Design Resume')).toBeInTheDocument();
      expect(screen.getByText('Senior Engineer Resume')).toBeInTheDocument();
    });

    it('renders filter controls', () => {
      render(<PortfolioGallery items={sampleItems} />);
      expect(screen.getByRole('group', { name: 'Filter by industry' })).toBeInTheDocument();
    });

    it('renders "All" filter option', () => {
      render(<PortfolioGallery items={sampleItems} />);
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });

    it('derives unique filter options from items', () => {
      render(<PortfolioGallery items={sampleItems} />);
      expect(screen.getByRole('button', { name: 'Engineering' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Marketing' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Design' })).toBeInTheDocument();
    });

    it('does not show duplicate filter options', () => {
      render(<PortfolioGallery items={sampleItems} />);
      const engineeringButtons = screen.getAllByRole('button', { name: 'Engineering' });
      expect(engineeringButtons).toHaveLength(1);
    });
  });

  describe('Client-side filtering', () => {
    it('shows all items when "All" filter is selected (default)', () => {
      render(<PortfolioGallery items={sampleItems} />);
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(4);
    });

    it('filters items when a content_type filter is clicked', () => {
      render(<PortfolioGallery items={sampleItems} />);
      fireEvent.click(screen.getByRole('button', { name: 'Engineering' }));
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });

    it('shows only matching items after filtering', () => {
      render(<PortfolioGallery items={sampleItems} />);
      fireEvent.click(screen.getByRole('button', { name: 'Marketing' }));
      expect(screen.getByText('Marketing Resume')).toBeInTheDocument();
      expect(screen.queryByText('Engineer Resume')).not.toBeInTheDocument();
      expect(screen.queryByText('Design Resume')).not.toBeInTheDocument();
    });

    it('returns to all items when "All" is clicked after filtering', () => {
      render(<PortfolioGallery items={sampleItems} />);
      fireEvent.click(screen.getByRole('button', { name: 'Engineering' }));
      fireEvent.click(screen.getByRole('button', { name: 'All' }));
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(4);
    });

    it('filters synchronously without re-rendering from a new items source', () => {
      render(<PortfolioGallery items={sampleItems} />);
      fireEvent.click(screen.getByRole('button', { name: 'Design' }));
      // Only 1 design item — if async fetch happened it would reset to all 4
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
      expect(screen.getByText('Design Resume')).toBeInTheDocument();
    });
  });

  describe('Empty states', () => {
    it('shows empty state when no items are provided', () => {
      render(<PortfolioGallery items={[]} />);
      expect(screen.getByText('No portfolio examples yet')).toBeInTheDocument();
    });

    it('does not show filters when no items are provided', () => {
      render(<PortfolioGallery items={[]} />);
      expect(screen.queryByRole('group', { name: 'Filter by industry' })).not.toBeInTheDocument();
    });

    it('empty state has role="status" for screen reader announcement', () => {
      render(<PortfolioGallery items={[]} />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'No portfolio examples available');
    });

    it('shows gallery when filter matches at least one item', () => {
      const singleItem = [makeItem({ content_id: 1, content_type: 'engineering' })];
      render(<PortfolioGallery items={singleItem} />);
      fireEvent.click(screen.getByRole('button', { name: 'Engineering' }));
      expect(screen.getByRole('listitem')).toBeInTheDocument();
      expect(screen.queryByText('No examples found')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-live="polite" region for filter result announcements', () => {
      render(<PortfolioGallery items={sampleItems} />);
      const liveRegions = document.querySelectorAll('[aria-live="polite"]');
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    it('aria-live region announces filter result count', () => {
      render(<PortfolioGallery items={sampleItems} />);
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toHaveTextContent(/Showing all 4 portfolio examples/i);
    });

    it('announces updated count after filtering', () => {
      render(<PortfolioGallery items={sampleItems} />);
      fireEvent.click(screen.getByRole('button', { name: 'Engineering' }));
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toHaveTextContent(/Showing 2 examples for engineering/i);
    });

    it('gallery list has aria-label', () => {
      render(<PortfolioGallery items={sampleItems} />);
      expect(screen.getByRole('list', { name: 'Portfolio examples' })).toBeInTheDocument();
    });

    it('empty state for no items has role="status"', () => {
      render(<PortfolioGallery items={[]} />);
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });
  });

  describe('Responsive grid', () => {
    it('gallery list has responsive grid classes', () => {
      render(<PortfolioGallery items={sampleItems} />);
      const list = screen.getByRole('list', { name: 'Portfolio examples' });
      expect(list.className).toContain('grid-cols-1');
      expect(list.className).toContain('sm:grid-cols-2');
      expect(list.className).toContain('lg:grid-cols-3');
    });
  });
});
