import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SuccessStoriesGallery } from '@/app/components/success-stories/success-stories-gallery';
import type { SuccessStory } from '@prisma/client';

const makeStory = (overrides: Partial<SuccessStory> & Pick<SuccessStory, 'story_id'>): SuccessStory => ({
  client_name: 'Client',
  client_role: 'Role',
  industry: 'engineering',
  challenge: 'Challenge text',
  solution: 'Solution text',
  results: 'Results text',
  testimonial_quote: null,
  outcome_type: 'salary-increase',
  metrics: null,
  is_featured: false,
  created_at: new Date('2024-01-01'),
  ...overrides,
});

const sampleItems: SuccessStory[] = [
  makeStory({ story_id: 1, client_name: 'Sarah', industry: 'engineering', outcome_type: 'salary-increase' }),
  makeStory({ story_id: 2, client_name: 'Marcus', industry: 'marketing', outcome_type: 'career-change' }),
  makeStory({ story_id: 3, client_name: 'Priya', industry: 'design', outcome_type: 'salary-increase' }),
];

describe('SuccessStoriesGallery', () => {
  it('renders all items when no filter selected', () => {
    render(<SuccessStoriesGallery items={sampleItems} />);
    expect(screen.getByText('Sarah')).toBeInTheDocument();
    expect(screen.getByText('Marcus')).toBeInTheDocument();
    expect(screen.getByText('Priya')).toBeInTheDocument();
  });

  it('renders empty state when items array is empty', () => {
    render(<SuccessStoriesGallery items={[]} />);
    expect(screen.getByText('No success stories yet')).toBeInTheDocument();
    expect(screen.getByText('Check back soon for client testimonials')).toBeInTheDocument();
  });

  it('renders empty state with accessible aria-label', () => {
    render(<SuccessStoriesGallery items={[]} />);
    expect(screen.getByRole('status', { name: 'No success stories available' })).toBeInTheDocument();
  });

  it('filters items by industry', () => {
    render(<SuccessStoriesGallery items={sampleItems} />);
    const marketingBtn = screen.getByRole('button', { name: /marketing/i });
    fireEvent.click(marketingBtn);
    expect(screen.queryByText('Sarah')).not.toBeInTheDocument();
    expect(screen.getByText('Marcus')).toBeInTheDocument();
    expect(screen.queryByText('Priya')).not.toBeInTheDocument();
  });

  it('filters items by outcome_type', () => {
    render(<SuccessStoriesGallery items={sampleItems} />);
    const careerBtn = screen.getByRole('button', { name: /career change/i });
    fireEvent.click(careerBtn);
    expect(screen.queryByText('Sarah')).not.toBeInTheDocument();
    expect(screen.getByText('Marcus')).toBeInTheDocument();
    expect(screen.queryByText('Priya')).not.toBeInTheDocument();
  });

  it('filters with combined industry and outcome_type', () => {
    render(<SuccessStoriesGallery items={sampleItems} />);
    const engineeringBtn = screen.getByRole('button', { name: /^engineering$/i });
    fireEvent.click(engineeringBtn);
    const salaryBtn = screen.getByRole('button', { name: /salary increase/i });
    fireEvent.click(salaryBtn);
    expect(screen.getByText('Sarah')).toBeInTheDocument();
    expect(screen.queryByText('Marcus')).not.toBeInTheDocument();
    expect(screen.queryByText('Priya')).not.toBeInTheDocument();
  });

  it('shows empty state when combined filters produce no results', () => {
    render(<SuccessStoriesGallery items={sampleItems} />);
    const marketingBtn = screen.getByRole('button', { name: /^marketing$/i });
    fireEvent.click(marketingBtn);
    const salaryBtn = screen.getByRole('button', { name: /salary increase/i });
    fireEvent.click(salaryBtn);
    expect(screen.getByText('No stories found')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'No results for selected filters' })).toBeInTheDocument();
  });

  it('renders aria-live region for filter announcements', () => {
    const { container } = render(<SuccessStoriesGallery items={sampleItems} />);
    const liveRegion = container.querySelector('[aria-live="polite"][aria-atomic="true"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it('aria-live region announces all stories count initially', () => {
    const { container } = render(<SuccessStoriesGallery items={sampleItems} />);
    const liveRegion = container.querySelector('[aria-live="polite"][aria-atomic="true"]');
    expect(liveRegion).toHaveTextContent('Showing all 3 success stories');
  });

  it('renders grid as ul with aria-label', () => {
    render(<SuccessStoriesGallery items={sampleItems} />);
    expect(screen.getByRole('list', { name: 'Success stories' })).toBeInTheDocument();
  });

  it('renders each story in a li element', () => {
    render(<SuccessStoriesGallery items={sampleItems} />);
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });

  it('resets to all stories when All button is clicked after filtering', () => {
    render(<SuccessStoriesGallery items={sampleItems} />);
    const marketingBtn = screen.getByRole('button', { name: /^marketing$/i });
    fireEvent.click(marketingBtn);
    expect(screen.queryByText('Sarah')).not.toBeInTheDocument();

    const allButtons = screen.getAllByRole('button', { name: /^All$/i });
    fireEvent.click(allButtons[0]);
    expect(screen.getByText('Sarah')).toBeInTheDocument();
  });
});
