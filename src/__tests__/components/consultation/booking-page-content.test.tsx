import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BookingPageContent } from '@/app/components/consultation/booking-page-content';

// Mock next-auth/react
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

jest.mock('@/app/i18n/navigation', () => ({
  __esModule: true,
  Link: ({ href, children, className, ...props }: { href: string; children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <a href={href} className={className} {...props}>{children}</a>
  ),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('BookingPageContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows login prompt when not authenticated', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    render(<BookingPageContent />);

    expect(screen.getByText('Book Your Consultation')).toBeInTheDocument();
    expect(screen.getAllByText('Please sign in to book a consultation.').length).toBeGreaterThanOrEqual(1);
  });

  it('shows loading skeleton while session loads', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });

    const { container } = render(<BookingPageContent />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('renders date picker when authenticated and availability loaded', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { userId: 1, email: 'test@test.com' } },
      status: 'authenticated',
    });

    // Mock availability-days and my-booking fetches
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { availableDays: [1, 2, 3, 4, 5] },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { booking: null },
        }),
      });

    render(<BookingPageContent />);

    await waitFor(() => {
      expect(screen.getByText('Book Your Consultation')).toBeInTheDocument();
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('handles 409 conflict gracefully', async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue({
      data: { user: { userId: 1, email: 'test@test.com' } },
      status: 'authenticated',
    });

    const slotTime = new Date();
    slotTime.setDate(slotTime.getDate() + 1);
    slotTime.setHours(10, 0, 0, 0);

    mockFetch.mockImplementation(async (url: string, opts?: RequestInit) => {
      if (typeof url === 'string' && url.includes('/availability-days')) {
        return { ok: true, json: async () => ({ success: true, data: { availableDays: [1, 2, 3, 4, 5] } }) };
      }
      if (typeof url === 'string' && url.includes('/my-booking')) {
        return { ok: true, json: async () => ({ success: true, data: { booking: null } }) };
      }
      if (typeof url === 'string' && url.includes('/slots')) {
        return { ok: true, json: async () => ({ success: true, data: { date: '2026-03-15', timezone: 'Europe/Kyiv', slots: [{ start: slotTime.toISOString(), end: new Date(slotTime.getTime() + 30 * 60000).toISOString() }] } }) };
      }
      if (opts?.method === 'POST' && typeof url === 'string' && url.includes('/book')) {
        return { ok: false, status: 409, json: async () => ({ success: false, error: { code: 'SLOT_TAKEN', message: 'This slot is no longer available.' } }) };
      }
      return { ok: true, json: async () => ({ success: true, data: {} }) };
    });

    render(<BookingPageContent />);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    const options = screen.getAllByRole('option');
    const firstEnabled = options.find((opt) => opt.getAttribute('aria-disabled') !== 'true');
    if (!firstEnabled) return;
    await user.click(firstEnabled);

    await waitFor(() => {
      const allOptions = screen.getAllByRole('option');
      expect(allOptions.length).toBeGreaterThan(14);
    });

    const allOptions = screen.getAllByRole('option');
    const slotOption = allOptions[allOptions.length - 1];
    await user.click(slotOption);

    await waitFor(() => {
      expect(screen.getByText('Confirm Booking')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Confirm Booking'));

    await waitFor(() => {
      expect(screen.getByText('This slot was just booked. Please select another time.')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('full booking flow: select date → select slot → confirm → success', async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue({
      data: { user: { userId: 1, email: 'test@test.com' } },
      status: 'authenticated',
    });

    const slotTime = new Date();
    slotTime.setDate(slotTime.getDate() + 1);
    slotTime.setHours(10, 0, 0, 0);

    mockFetch.mockImplementation(async (url: string, opts?: RequestInit) => {
      if (typeof url === 'string' && url.includes('/availability-days')) {
        return { ok: true, json: async () => ({ success: true, data: { availableDays: [1, 2, 3, 4, 5] } }) };
      }
      if (typeof url === 'string' && url.includes('/my-booking')) {
        return { ok: true, json: async () => ({ success: true, data: { booking: null } }) };
      }
      if (typeof url === 'string' && url.includes('/slots')) {
        return { ok: true, json: async () => ({ success: true, data: { date: '2026-03-15', timezone: 'Europe/Kyiv', slots: [{ start: slotTime.toISOString(), end: new Date(slotTime.getTime() + 30 * 60000).toISOString() }] } }) };
      }
      if (opts?.method === 'POST' && typeof url === 'string' && url.includes('/book')) {
        return { ok: true, status: 201, json: async () => ({ success: true, data: { consultationId: 1, date: '2026-03-15', time: slotTime.toISOString(), timezone: 'UTC' }, meta: { timestamp: new Date().toISOString() } }) };
      }
      return { ok: true, json: async () => ({ success: true, data: {} }) };
    });

    render(<BookingPageContent />);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    const dateOptions = screen.getAllByRole('option');
    const firstEnabled = dateOptions.find((opt) => opt.getAttribute('aria-disabled') !== 'true');
    if (!firstEnabled) return;

    await user.click(firstEnabled);

    await waitFor(() => {
      const allOptions = screen.getAllByRole('option');
      expect(allOptions.length).toBeGreaterThan(14);
    });

    const allOptions = screen.getAllByRole('option');
    const slotOption = allOptions[allOptions.length - 1];
    await user.click(slotOption);

    await waitFor(() => {
      expect(screen.getByText('Confirm Booking')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Confirm Booking'));

    await waitFor(() => {
      expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
    });
  });
});
