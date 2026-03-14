import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// React.cache is not available in Jest — provide identity mock
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  cache: (fn: unknown) => fn,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

jest.mock('@/app/i18n/navigation', () => ({
  __esModule: true,
  Link: ({ href, children, className, ...props }: { href: string; children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <a href={href} className={className} {...props}>{children}</a>
  ),
}));

jest.mock('@/app/components/language-switcher', () => ({
  __esModule: true,
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

const mockNotFound = jest.fn();
jest.mock('next/navigation', () => ({
  notFound: (...args: unknown[]) => mockNotFound(...args),
}));

const mockFindUnique = jest.fn();
jest.mock('@/app/lib/prisma', () => ({
  __esModule: true,
  default: {
    portfolioContent: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

import CaseStudyPage from '@/app/[locale]/portfolio/[id]/page';
import type { PortfolioContent } from '@prisma/client';

const sampleItem: PortfolioContent = {
  content_id: 1,
  title: 'Engineer Resume',
  description: 'Improved engineering resume with quantified achievements.',
  content_type: 'engineering',
  file_url: null,
  is_featured: true,
  created_at: new Date('2024-01-01'),
};

describe('CaseStudyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the case study detail for a valid item', async () => {
    mockFindUnique.mockResolvedValue(sampleItem);

    const Page = await CaseStudyPage({ params: Promise.resolve({ id: '1' }) });
    render(Page);

    expect(screen.getByRole('heading', { level: 1, name: 'Engineer Resume' })).toBeInTheDocument();
    expect(screen.getByText('engineering')).toBeInTheDocument();
    expect(screen.getByText(/Improved engineering resume/)).toBeInTheDocument();
  });

  it('renders page header with ResumeBoost brand link', async () => {
    mockFindUnique.mockResolvedValue(sampleItem);

    const Page = await CaseStudyPage({ params: Promise.resolve({ id: '1' }) });
    render(Page);

    const brandLink = screen.getByRole('link', { name: 'ResumeBoost' });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/resume-analysis');
  });

  it('renders Analyze Resume navigation link', async () => {
    mockFindUnique.mockResolvedValue(sampleItem);

    const Page = await CaseStudyPage({ params: Promise.resolve({ id: '1' }) });
    render(Page);

    const analyzeLink = screen.getByRole('link', { name: 'Analyze Resume' });
    expect(analyzeLink).toBeInTheDocument();
    expect(analyzeLink).toHaveAttribute('href', '/resume-analysis');
  });

  it('renders header and main landmarks', async () => {
    mockFindUnique.mockResolvedValue(sampleItem);

    const Page = await CaseStudyPage({ params: Promise.resolve({ id: '1' }) });
    render(Page);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('calls notFound() when item is null', async () => {
    mockFindUnique.mockResolvedValue(null);

    try {
      await CaseStudyPage({ params: Promise.resolve({ id: '999' }) });
    } catch {
      // notFound() may throw
    }

    expect(mockNotFound).toHaveBeenCalled();
  });

  it('calls notFound() for non-numeric id', async () => {
    try {
      await CaseStudyPage({ params: Promise.resolve({ id: 'abc' }) });
    } catch {
      // notFound() may throw
    }

    expect(mockNotFound).toHaveBeenCalled();
  });

  it('queries prisma with correct content_id', async () => {
    mockFindUnique.mockResolvedValue(sampleItem);

    await CaseStudyPage({ params: Promise.resolve({ id: '1' }) });

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { content_id: 1 },
    });
  });

  it('renders back to portfolio link', async () => {
    mockFindUnique.mockResolvedValue(sampleItem);

    const Page = await CaseStudyPage({ params: Promise.resolve({ id: '1' }) });
    render(Page);

    const backLink = screen.getByRole('link', { name: /Back to Portfolio/ });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/portfolio');
  });

  it('shows Featured badge for featured items', async () => {
    mockFindUnique.mockResolvedValue(sampleItem);

    const Page = await CaseStudyPage({ params: Promise.resolve({ id: '1' }) });
    render(Page);

    expect(screen.getByText('Featured')).toBeInTheDocument();
  });
});
