import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SuccessStoryCard } from '@/app/components/success-stories/success-story-card';
import type { SuccessStory } from '@prisma/client';

const baseStory: SuccessStory = {
  story_id: 1,
  client_name: 'Sarah',
  client_role: 'Software Engineer',
  industry: 'engineering',
  challenge: 'Had a weak resume with no quantified impact.',
  solution: 'Rewrote bullets using STAR method with measurable outcomes.',
  results: 'Received 4 interview invitations within 2 weeks.',
  testimonial_quote: 'The difference was night and day.',
  outcome_type: 'salary-increase',
  metrics: { salaryIncrease: '35%', interviewsSecured: 4, timeToOffer: '5 weeks' },
  is_featured: true,
  created_at: new Date('2024-01-01'),
};

describe('SuccessStoryCard', () => {
  it('renders client name', () => {
    render(<SuccessStoryCard item={baseStory} />);
    expect(screen.getByText('Sarah')).toBeInTheDocument();
  });

  it('renders client role', () => {
    render(<SuccessStoryCard item={baseStory} />);
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('renders industry badge', () => {
    render(<SuccessStoryCard item={baseStory} />);
    expect(screen.getByText('engineering')).toBeInTheDocument();
  });

  it('renders featured badge when is_featured is true', () => {
    render(<SuccessStoryCard item={baseStory} />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('does not render featured badge when is_featured is false', () => {
    render(<SuccessStoryCard item={{ ...baseStory, is_featured: false }} />);
    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });

  it('renders testimonial quote in a blockquote element', () => {
    const { container } = render(<SuccessStoryCard item={baseStory} />);
    const blockquote = container.querySelector('blockquote');
    expect(blockquote).toBeInTheDocument();
    expect(blockquote).toHaveTextContent('The difference was night and day.');
  });

  it('renders cite element for testimonial attribution', () => {
    const { container } = render(<SuccessStoryCard item={baseStory} />);
    const cite = container.querySelector('cite');
    expect(cite).toBeInTheDocument();
    expect(cite).toHaveTextContent('— Sarah');
  });

  it('renders challenge section', () => {
    render(<SuccessStoryCard item={baseStory} />);
    expect(screen.getByText('Challenge')).toBeInTheDocument();
    expect(screen.getByText('Had a weak resume with no quantified impact.')).toBeInTheDocument();
  });

  it('renders solution section', () => {
    render(<SuccessStoryCard item={baseStory} />);
    expect(screen.getByText('Solution')).toBeInTheDocument();
    expect(screen.getByText('Rewrote bullets using STAR method with measurable outcomes.')).toBeInTheDocument();
  });

  it('renders results section', () => {
    render(<SuccessStoryCard item={baseStory} />);
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Received 4 interview invitations within 2 weeks.')).toBeInTheDocument();
  });

  it('renders metrics badges from canonical metrics shape', () => {
    render(<SuccessStoryCard item={baseStory} />);
    expect(screen.getByText(/↑ Salary: 35%/)).toBeInTheDocument();
    expect(screen.getByText(/Interviews: 4/)).toBeInTheDocument();
    expect(screen.getByText(/Time to Offer: 5 weeks/)).toBeInTheDocument();
  });

  it('renders nothing for metrics when metrics is null', () => {
    render(<SuccessStoryCard item={{ ...baseStory, metrics: null }} />);
    expect(screen.queryByText(/↑ Salary/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Interviews/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Time to Offer/)).not.toBeInTheDocument();
  });

  it('renders outcome_type badge with formatted label', () => {
    render(<SuccessStoryCard item={baseStory} />);
    expect(screen.getByText('Salary Increase')).toBeInTheDocument();
  });

  it('renders article element with accessible aria-label', () => {
    render(<SuccessStoryCard item={baseStory} />);
    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
    expect(article).toHaveAttribute('aria-label', 'Success story: Sarah, Software Engineer');
  });

  it('renders accessible aria-label without role when client_role is null', () => {
    render(<SuccessStoryCard item={{ ...baseStory, client_role: null }} />);
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-label', 'Success story: Sarah');
  });

  it('does not render testimonial section when testimonial_quote is null', () => {
    const { container } = render(<SuccessStoryCard item={{ ...baseStory, testimonial_quote: null }} />);
    expect(container.querySelector('blockquote')).not.toBeInTheDocument();
  });

  it('does not render client_role when null', () => {
    render(<SuccessStoryCard item={{ ...baseStory, client_role: null }} />);
    expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
  });
});
