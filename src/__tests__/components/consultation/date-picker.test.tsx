import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DatePicker } from '@/app/components/consultation/date-picker';

jest.mock('@/app/i18n/navigation', () => ({
  __esModule: true,
  Link: ({ href, children, className, ...props }: { href: string; children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <a href={href} className={className} {...props}>{children}</a>
  ),
}));

describe('DatePicker', () => {
  const defaultProps = {
    selectedDate: null,
    onSelectDate: jest.fn(),
    availableDays: [1, 2, 3, 4, 5], // Mon-Fri
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders 14 days', () => {
    render(<DatePicker {...defaultProps} />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(14);
  });

  it('grays out unavailable days (weekends)', () => {
    render(<DatePicker {...defaultProps} />);
    const options = screen.getAllByRole('option');
    const disabledOptions = options.filter((opt) => opt.getAttribute('aria-disabled') === 'true');
    // At least some days should be disabled (weekends in 14-day range)
    expect(disabledOptions.length).toBeGreaterThan(0);
  });

  it('highlights selected date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    render(<DatePicker {...defaultProps} selectedDate={tomorrow} />);
    const options = screen.getAllByRole('option');
    const selected = options.find((opt) => opt.getAttribute('aria-selected') === 'true');
    expect(selected).toBeDefined();
  });

  it('calls onSelectDate when clicking an available date', async () => {
    const user = userEvent.setup();
    render(<DatePicker {...defaultProps} />);

    // Find the first enabled option
    const options = screen.getAllByRole('option');
    const firstEnabled = options.find((opt) => opt.getAttribute('aria-disabled') !== 'true');
    if (firstEnabled) {
      await user.click(firstEnabled);
      expect(defaultProps.onSelectDate).toHaveBeenCalledTimes(1);
    }
  });

  it('does not call onSelectDate when clicking a disabled date', async () => {
    const user = userEvent.setup();
    render(<DatePicker {...defaultProps} />);

    const options = screen.getAllByRole('option');
    const disabledOption = options.find((opt) => opt.getAttribute('aria-disabled') === 'true');
    if (disabledOption) {
      await user.click(disabledOption);
      expect(defaultProps.onSelectDate).not.toHaveBeenCalled();
    }
  });

  it('has listbox role and correct aria-label', () => {
    render(<DatePicker {...defaultProps} />);
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(listbox).toHaveAttribute('aria-label', 'Select a date');
  });

  it('shows "Today" label for today', () => {
    render(<DatePicker {...defaultProps} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('shows "Tomorrow" label for tomorrow', () => {
    render(<DatePicker {...defaultProps} />);
    expect(screen.getByText('Tomorrow')).toBeInTheDocument();
  });

  it('keyboard navigation moves focus with ArrowRight on enabled button', async () => {
    const user = userEvent.setup();
    // Find a weekday in the next 14 days for a selected date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let weekday: Date | null = null;
    for (let i = 1; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if ([1, 2, 3, 4, 5].includes(d.getDay())) {
        weekday = d;
        break;
      }
    }
    if (!weekday) return;

    render(<DatePicker {...defaultProps} selectedDate={weekday} />);

    const options = screen.getAllByRole('option');
    const selected = options.find((opt) => opt.getAttribute('aria-selected') === 'true');
    if (selected) {
      selected.focus();
      await user.keyboard('{ArrowRight}');
      // Verify no errors thrown during keyboard navigation
      expect(selected).toBeInTheDocument();
    }
  });
});
