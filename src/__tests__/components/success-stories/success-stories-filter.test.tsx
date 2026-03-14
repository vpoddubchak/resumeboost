import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SuccessStoriesFilter } from '@/app/components/success-stories/success-stories-filter';

const defaultProps = {
  industryOptions: ['engineering', 'marketing', 'design'],
  outcomeOptions: ['salary-increase', 'career-change', 'interviews-secured'],
  selectedIndustry: 'all',
  selectedOutcome: 'all',
  onIndustryChange: jest.fn(),
  onOutcomeChange: jest.fn(),
};

describe('SuccessStoriesFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Filter by Industry group', () => {
    render(<SuccessStoriesFilter {...defaultProps} />);
    expect(screen.getByRole('group', { name: 'Filter by Industry' })).toBeInTheDocument();
  });

  it('renders Filter by Outcome group', () => {
    render(<SuccessStoriesFilter {...defaultProps} />);
    expect(screen.getByRole('group', { name: 'Filter by Outcome' })).toBeInTheDocument();
  });

  it('renders All button as default selected for industry', () => {
    render(<SuccessStoriesFilter {...defaultProps} />);
    const industryGroup = screen.getByRole('group', { name: 'Filter by Industry' });
    const allBtn = industryGroup.querySelector('button[aria-pressed="true"]');
    expect(allBtn).toHaveTextContent('All');
  });

  it('renders All button as default selected for outcome', () => {
    render(<SuccessStoriesFilter {...defaultProps} />);
    const outcomeGroup = screen.getByRole('group', { name: 'Filter by Outcome' });
    const allBtn = outcomeGroup.querySelector('button[aria-pressed="true"]');
    expect(allBtn).toHaveTextContent('All');
  });

  it('renders all industry options', () => {
    render(<SuccessStoriesFilter {...defaultProps} />);
    expect(screen.getByRole('button', { name: /^engineering$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^marketing$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^design$/i })).toBeInTheDocument();
  });

  it('renders all outcome options with formatted labels', () => {
    render(<SuccessStoriesFilter {...defaultProps} />);
    expect(screen.getByRole('button', { name: /salary increase/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /career change/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /interviews secured/i })).toBeInTheDocument();
  });

  it('calls onIndustryChange when an industry button is clicked', () => {
    const onIndustryChange = jest.fn();
    render(<SuccessStoriesFilter {...defaultProps} onIndustryChange={onIndustryChange} />);
    fireEvent.click(screen.getByRole('button', { name: /^engineering$/i }));
    expect(onIndustryChange).toHaveBeenCalledWith('engineering');
  });

  it('calls onOutcomeChange when an outcome button is clicked', () => {
    const onOutcomeChange = jest.fn();
    render(<SuccessStoriesFilter {...defaultProps} onOutcomeChange={onOutcomeChange} />);
    fireEvent.click(screen.getByRole('button', { name: /career change/i }));
    expect(onOutcomeChange).toHaveBeenCalledWith('career-change');
  });

  it('marks selected industry as aria-pressed true', () => {
    render(<SuccessStoriesFilter {...defaultProps} selectedIndustry="engineering" />);
    const engBtn = screen.getByRole('button', { name: /^engineering$/i });
    expect(engBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks non-selected industries as aria-pressed false', () => {
    render(<SuccessStoriesFilter {...defaultProps} selectedIndustry="engineering" />);
    const marketingBtn = screen.getByRole('button', { name: /^marketing$/i });
    expect(marketingBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks selected outcome as aria-pressed true', () => {
    render(<SuccessStoriesFilter {...defaultProps} selectedOutcome="career-change" />);
    const careerBtn = screen.getByRole('button', { name: /career change/i });
    expect(careerBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('all buttons have minimum 44px touch target via min-h-[44px]', () => {
    const { container } = render(<SuccessStoriesFilter {...defaultProps} />);
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn.className).toContain('min-h-[44px]');
    });
  });

  it('all buttons have focus-visible ring styles for keyboard navigation', () => {
    const { container } = render(<SuccessStoriesFilter {...defaultProps} />);
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn.className).toContain('focus-visible:ring-2');
    });
  });
});
