import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CaseStudyDetail } from '@/app/components/portfolio/case-study-detail';
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
  description: 'Transformed a generic resume into a results-driven profile.\n\nKey improvements and measurable outcomes included.',
  content_type: 'engineering',
  file_url: null,
  is_featured: false,
  created_at: new Date('2024-03-15'),
};

describe('CaseStudyDetail', () => {
  describe('Rendering', () => {
    it('renders the title as an h1 heading', () => {
      render(<CaseStudyDetail item={baseItem} />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Senior Software Engineer Resume');
    });

    it('renders the content_type badge', () => {
      render(<CaseStudyDetail item={baseItem} />);
      expect(screen.getByText('engineering')).toBeInTheDocument();
    });

    it('renders description content', () => {
      render(<CaseStudyDetail item={baseItem} />);
      expect(screen.getByText(/Transformed a generic resume/)).toBeInTheDocument();
    });

    it('renders "Case Study Details" section heading', () => {
      render(<CaseStudyDetail item={baseItem} />);
      expect(screen.getByRole('heading', { level: 2, name: 'Case Study Details' })).toBeInTheDocument();
    });

    it('renders formatted date', () => {
      render(<CaseStudyDetail item={baseItem} />);
      expect(screen.getByText('March 2024')).toBeInTheDocument();
    });

    it('renders back to portfolio link', () => {
      render(<CaseStudyDetail item={baseItem} />);
      const backLink = screen.getByRole('link', { name: /Back to Portfolio/ });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/portfolio');
    });
  });

  describe('Featured badge', () => {
    it('shows Featured badge when is_featured is true', () => {
      render(<CaseStudyDetail item={{ ...baseItem, is_featured: true }} />);
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('does not show Featured badge when is_featured is false', () => {
      render(<CaseStudyDetail item={baseItem} />);
      expect(screen.queryByText('Featured')).not.toBeInTheDocument();
    });
  });

  describe('Thumbnail / image', () => {
    it('renders placeholder SVG when file_url is null', () => {
      const { container } = render(<CaseStudyDetail item={baseItem} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders next/image when file_url is provided', () => {
      render(<CaseStudyDetail item={{ ...baseItem, file_url: 'https://example.com/resume.png' }} />);
      const img = screen.getByTestId('next-image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/resume.png');
    });

    it('image has descriptive alt text', () => {
      render(<CaseStudyDetail item={{ ...baseItem, file_url: 'https://example.com/resume.png' }} />);
      const img = screen.getByTestId('next-image');
      expect(img).toHaveAttribute('alt', 'Senior Software Engineer Resume resume example');
    });
  });

  describe('Null description handling', () => {
    it('does not render description section when description is null', () => {
      render(<CaseStudyDetail item={{ ...baseItem, description: null }} />);
      expect(screen.queryByText('Case Study Details')).not.toBeInTheDocument();
    });

    it('does not render description section when description is empty string', () => {
      render(<CaseStudyDetail item={{ ...baseItem, description: '' }} />);
      expect(screen.queryByText('Case Study Details')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('wraps content in an article element', () => {
      render(<CaseStudyDetail item={baseItem} />);
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('has breadcrumb navigation', () => {
      render(<CaseStudyDetail item={baseItem} />);
      expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    });

    it('case study details section has aria-label', () => {
      render(<CaseStudyDetail item={baseItem} />);
      expect(screen.getByRole('region', { name: 'Case study details' })).toBeInTheDocument();
    });
  });
});
