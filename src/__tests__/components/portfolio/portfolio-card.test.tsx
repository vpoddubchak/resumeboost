import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PortfolioCard } from '@/app/components/portfolio/portfolio-card';
import type { PortfolioContent } from '@prisma/client';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} data-testid="next-image" />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, ...props }: { href: string; children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <a href={href} className={className} {...props}>{children}</a>
  ),
}));

const baseItem: PortfolioContent = {
  content_id: 1,
  title: 'Senior Software Engineer Resume',
  description: 'Improved keywords and quantified achievements',
  content_type: 'engineering',
  file_url: null,
  is_featured: false,
  created_at: new Date('2024-01-01'),
};

describe('PortfolioCard', () => {
  describe('Rendering', () => {
    it('renders the card as a link element', () => {
      render(<PortfolioCard item={baseItem} />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('link has correct href to case study detail page', () => {
      render(<PortfolioCard item={baseItem} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/portfolio/1');
    });

    it('link has aria-label with item title', () => {
      render(<PortfolioCard item={baseItem} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'View case study: Senior Software Engineer Resume');
    });

    it('renders the title', () => {
      render(<PortfolioCard item={baseItem} />);
      expect(screen.getByText('Senior Software Engineer Resume')).toBeInTheDocument();
    });

    it('renders content_type as industry badge', () => {
      render(<PortfolioCard item={baseItem} />);
      expect(screen.getByText('engineering')).toBeInTheDocument();
    });

    it('renders description when present', () => {
      render(<PortfolioCard item={baseItem} />);
      expect(screen.getByText('Improved keywords and quantified achievements')).toBeInTheDocument();
    });

    it('shows "Key Improvements" label when description is present', () => {
      render(<PortfolioCard item={baseItem} />);
      expect(screen.getByText('Key Improvements')).toBeInTheDocument();
    });

    it('does not render description section when description is null', () => {
      render(<PortfolioCard item={{ ...baseItem, description: null }} />);
      expect(screen.queryByText('Key Improvements')).not.toBeInTheDocument();
    });

    it('does not render description section when description is empty string', () => {
      render(<PortfolioCard item={{ ...baseItem, description: '' }} />);
      expect(screen.queryByText('Key Improvements')).not.toBeInTheDocument();
    });
  });

  describe('Featured indicator', () => {
    it('shows Featured badge for featured items', () => {
      render(<PortfolioCard item={{ ...baseItem, is_featured: true }} />);
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('does not show Featured badge for non-featured items', () => {
      render(<PortfolioCard item={{ ...baseItem, is_featured: false }} />);
      expect(screen.queryByText('Featured')).not.toBeInTheDocument();
    });
  });

  describe('Thumbnail / image', () => {
    it('renders placeholder SVG when no file_url', () => {
      const { container } = render(<PortfolioCard item={baseItem} />);
      const thumbnail = container.querySelector('.bg-gradient-to-br');
      expect(thumbnail).toBeInTheDocument();
    });

    it('renders next/image when file_url is provided', () => {
      render(<PortfolioCard item={{ ...baseItem, file_url: 'https://example.com/resume.png' }} />);
      const img = screen.getByTestId('next-image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/resume.png');
    });

    it('next/image has descriptive alt text', () => {
      render(<PortfolioCard item={{ ...baseItem, file_url: 'https://example.com/resume.png' }} />);
      const img = screen.getByTestId('next-image');
      expect(img).toHaveAttribute('alt', 'Senior Software Engineer Resume resume example thumbnail');
    });
  });

  describe('Accessibility', () => {
    it('heading is an h3 element', () => {
      render(<PortfolioCard item={baseItem} />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Senior Software Engineer Resume');
    });

    it('link has hover and focus-visible transition styles', () => {
      render(<PortfolioCard item={baseItem} />);
      const link = screen.getByRole('link');
      expect(link.className).toContain('focus-visible');
      expect(link.className).toContain('hover:');
    });
  });
});
