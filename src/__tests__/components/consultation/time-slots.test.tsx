import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TimeSlots } from '@/app/components/consultation/time-slots';

jest.mock('@/app/i18n/navigation', () => ({
  __esModule: true,
  Link: ({ href, children, className, ...props }: { href: string; children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <a href={href} className={className} {...props}>{children}</a>
  ),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('TimeSlots', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const defaultProps = {
    selectedDate: tomorrow,
    selectedSlot: null,
    onSelectSlot: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders available slots after fetching', async () => {
    const slotTime = new Date(tomorrow);
    slotTime.setHours(10, 0, 0, 0);
    const slotEnd = new Date(slotTime.getTime() + 30 * 60 * 1000);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          date: '2026-03-15',
          timezone: 'Europe/Kyiv',
          slots: [
            { start: slotTime.toISOString(), end: slotEnd.toISOString() },
          ],
        },
      }),
    });

    render(<TimeSlots {...defaultProps} />);

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows empty state when no slots', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { date: '2026-03-15', timezone: 'Europe/Kyiv', slots: [] },
      }),
    });

    render(<TimeSlots {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No slots available for this date. Try another day.')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {})); // never resolves
    render(<TimeSlots {...defaultProps} />);

    expect(screen.getByText('Loading available times...')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<TimeSlots {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load available times. Please try again.')).toBeInTheDocument();
    });
  });

  it('fetches with correct date parameter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { date: '2026-03-15', timezone: 'Europe/Kyiv', slots: [] },
      }),
    });

    render(<TimeSlots {...defaultProps} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/consultations/slots?date=');
  });
});
