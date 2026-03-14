import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

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

const mockFindMany = jest.fn();
jest.mock('@/app/lib/prisma', () => ({
  __esModule: true,
  default: {
    portfolioContent: {
      findMany: mockFindMany,
    },
  },
}));

import PortfolioPage from '@/app/[locale]/portfolio/page';
import type { PortfolioContent } from '@prisma/client';

const sampleItems: PortfolioContent[] = [
  {
    content_id: 1,
    title: 'Engineer Resume',
    description: 'Improved engineering resume',
    content_type: 'engineering',
    file_url: null,
    is_featured: true,
    created_at: new Date('2024-01-01'),
  },
  {
    content_id: 2,
    title: 'Marketing Resume',
    description: 'Improved marketing resume',
    content_type: 'marketing',
    file_url: null,
    is_featured: false,
    created_at: new Date('2024-01-02'),
  },
];

describe('PortfolioPage', () => {
  beforeEach(() => {
    mockFindMany.mockResolvedValue(sampleItems);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page heading', async () => {
    const Page = await PortfolioPage({ params: Promise.resolve({ locale: 'en' }) });
    render(Page);
    expect(screen.getByRole('heading', { level: 1, name: 'Resume Portfolio' })).toBeInTheDocument();
  });

  it('renders the page description', async () => {
    const Page = await PortfolioPage({ params: Promise.resolve({ locale: 'en' }) });
    render(Page);
    expect(
      screen.getByText(/Browse our gallery of improved resume examples/)
    ).toBeInTheDocument();
  });

  it('renders portfolio gallery section with aria-label', async () => {
    const Page = await PortfolioPage({ params: Promise.resolve({ locale: 'en' }) });
    render(Page);
    expect(screen.getByRole('region', { name: 'Portfolio gallery' })).toBeInTheDocument();
  });

  it('renders portfolio cards from database', async () => {
    const Page = await PortfolioPage({ params: Promise.resolve({ locale: 'en' }) });
    render(Page);
    expect(screen.getByText('Engineer Resume')).toBeInTheDocument();
    expect(screen.getByText('Marketing Resume')).toBeInTheDocument();
  });

  it('renders the ResumeBoost brand link in header', async () => {
    const Page = await PortfolioPage({ params: Promise.resolve({ locale: 'en' }) });
    render(Page);
    const brandLink = screen.getByRole('link', { name: 'ResumeBoost' });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/resume-analysis');
  });

  it('renders navigation link to resume analysis', async () => {
    const Page = await PortfolioPage({ params: Promise.resolve({ locale: 'en' }) });
    render(Page);
    const analyzeLink = screen.getByRole('link', { name: 'Analyze Resume' });
    expect(analyzeLink).toBeInTheDocument();
    expect(analyzeLink).toHaveAttribute('href', '/resume-analysis');
  });

  it('renders header landmark', async () => {
    const Page = await PortfolioPage({ params: Promise.resolve({ locale: 'en' }) });
    render(Page);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders main landmark', async () => {
    const Page = await PortfolioPage({ params: Promise.resolve({ locale: 'en' }) });
    render(Page);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('queries prisma with correct ordering (featured first, then newest)', async () => {
    await PortfolioPage({ params: Promise.resolve({ locale: 'en' }) });
    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: [{ is_featured: 'desc' }, { created_at: 'desc' }],
    });
  });

  it('renders empty gallery when no portfolio items exist', async () => {
    mockFindMany.mockResolvedValue([]);
    const Page = await PortfolioPage({ params: Promise.resolve({ locale: 'en' }) });
    render(Page);
    expect(screen.getByText('No portfolio examples yet')).toBeInTheDocument();
  });
});
