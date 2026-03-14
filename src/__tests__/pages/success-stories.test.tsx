import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, ...props }: { href: string; children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <a href={href} className={className} {...props}>{children}</a>
  ),
}));

const mockFindMany = jest.fn();
jest.mock('@/app/lib/prisma', () => ({
  __esModule: true,
  default: {
    successStory: {
      findMany: mockFindMany,
    },
  },
}));

import SuccessStoriesPage from '@/app/success-stories/page';
import type { SuccessStory } from '@prisma/client';

const sampleItems: SuccessStory[] = [
  {
    story_id: 1,
    client_name: 'Sarah',
    client_role: 'Software Engineer',
    industry: 'engineering',
    challenge: 'Weak resume',
    solution: 'Rewrote bullets',
    results: 'Got interviews',
    testimonial_quote: 'Great service',
    outcome_type: 'salary-increase',
    metrics: { salaryIncrease: '35%', interviewsSecured: 4 },
    is_featured: true,
    created_at: new Date('2024-01-01'),
  },
  {
    story_id: 2,
    client_name: 'Marcus',
    client_role: 'Marketing Manager',
    industry: 'marketing',
    challenge: 'Agency-focused resume',
    solution: 'Repositioned narrative',
    results: 'Landed in-house role',
    testimonial_quote: null,
    outcome_type: 'career-change',
    metrics: null,
    is_featured: false,
    created_at: new Date('2024-01-02'),
  },
];

describe('SuccessStoriesPage', () => {
  beforeEach(() => {
    mockFindMany.mockResolvedValue(sampleItems);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page heading', async () => {
    const Page = await SuccessStoriesPage();
    render(Page);
    expect(screen.getByRole('heading', { level: 1, name: 'Success Stories' })).toBeInTheDocument();
  });

  it('renders the page description', async () => {
    const Page = await SuccessStoriesPage();
    render(Page);
    expect(screen.getByText(/Real outcomes from real clients/)).toBeInTheDocument();
  });

  it('renders success stories section with aria-label', async () => {
    const Page = await SuccessStoriesPage();
    render(Page);
    expect(screen.getByRole('region', { name: 'Success stories' })).toBeInTheDocument();
  });

  it('renders story cards from database', async () => {
    const Page = await SuccessStoriesPage();
    render(Page);
    expect(screen.getByText('Sarah')).toBeInTheDocument();
    expect(screen.getByText('Marcus')).toBeInTheDocument();
  });

  it('renders the ResumeBoost brand link in header', async () => {
    const Page = await SuccessStoriesPage();
    render(Page);
    const brandLink = screen.getByRole('link', { name: 'ResumeBoost' });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/resume-analysis');
  });

  it('renders navigation link to portfolio', async () => {
    const Page = await SuccessStoriesPage();
    render(Page);
    const portfolioLink = screen.getByRole('link', { name: 'Portfolio' });
    expect(portfolioLink).toBeInTheDocument();
    expect(portfolioLink).toHaveAttribute('href', '/portfolio');
  });

  it('renders navigation link to analyze resume', async () => {
    const Page = await SuccessStoriesPage();
    render(Page);
    const analyzeLink = screen.getByRole('link', { name: 'Analyze Resume' });
    expect(analyzeLink).toBeInTheDocument();
    expect(analyzeLink).toHaveAttribute('href', '/resume-analysis');
  });

  it('renders header landmark', async () => {
    const Page = await SuccessStoriesPage();
    render(Page);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders main landmark', async () => {
    const Page = await SuccessStoriesPage();
    render(Page);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('queries prisma with correct ordering (featured first, then newest)', async () => {
    await SuccessStoriesPage();
    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: [{ is_featured: 'desc' }, { created_at: 'desc' }],
    });
  });

  it('renders empty gallery when no success stories exist', async () => {
    mockFindMany.mockResolvedValue([]);
    const Page = await SuccessStoriesPage();
    render(Page);
    expect(screen.getByText('No success stories yet')).toBeInTheDocument();
  });
});
