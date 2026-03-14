import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, ...props }: { href: string; children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <a href={href} className={className} {...props}>{children}</a>
  ),
}));

import SuccessStoriesError from '@/app/success-stories/error';

describe('SuccessStoriesError', () => {
  const mockReset = jest.fn();
  const mockError = Object.assign(new Error('Test error'), { digest: 'abc123' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the error heading', () => {
    render(<SuccessStoriesError error={mockError} reset={mockReset} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Something went wrong' })).toBeInTheDocument();
  });

  it('renders error description text', () => {
    render(<SuccessStoriesError error={mockError} reset={mockReset} />);
    expect(screen.getByText(/couldn.t load success stories/i)).toBeInTheDocument();
  });

  it('renders Try again button that calls reset', () => {
    render(<SuccessStoriesError error={mockError} reset={mockReset} />);
    const btn = screen.getByRole('button', { name: 'Try again' });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('renders Back to Home link pointing to /', () => {
    render(<SuccessStoriesError error={mockError} reset={mockReset} />);
    const link = screen.getByRole('link', { name: 'Back to Home' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders error icon as decorative (aria-hidden)', () => {
    const { container } = render(<SuccessStoriesError error={mockError} reset={mockReset} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('Try again button has accessible focus-visible styling', () => {
    render(<SuccessStoriesError error={mockError} reset={mockReset} />);
    const btn = screen.getByRole('button', { name: 'Try again' });
    expect(btn.className).toContain('focus-visible:ring-2');
  });

  it('Back to Home link has accessible focus-visible styling', () => {
    render(<SuccessStoriesError error={mockError} reset={mockReset} />);
    const link = screen.getByRole('link', { name: 'Back to Home' });
    expect(link.className).toContain('focus-visible:ring-2');
  });

  it('both interactive elements have min 44px touch targets', () => {
    const { container } = render(<SuccessStoriesError error={mockError} reset={mockReset} />);
    const btn = screen.getByRole('button', { name: 'Try again' });
    const link = screen.getByRole('link', { name: 'Back to Home' });
    expect(btn.className).toContain('min-h-[44px]');
    expect(link.className).toContain('min-h-[44px]');
  });
});
