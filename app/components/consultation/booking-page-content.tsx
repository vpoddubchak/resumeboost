'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Link } from '@/app/i18n/navigation';
import { DatePicker } from './date-picker';
import { TimeSlots } from './time-slots';
import { BookingConfirmation } from './booking-confirmation';

type BookingStatus = 'idle' | 'booking' | 'confirmed' | 'error';

interface BookingResult {
  date: string;
  time: string;
  timezone: string;
}

interface BookingPageContentProps {
  onBackToResults?: () => void;
}

export function BookingPageContent({ onBackToResults }: BookingPageContentProps) {
  const { data: session, status: sessionStatus } = useSession();
  const t = useTranslations('consultation');
  const tc = useTranslations('common');
  const locale = useLocale();

  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [daysLoading, setDaysLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('idle');
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Fetch available days and check for existing booking on mount
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [daysRes, bookingRes] = await Promise.all([
          fetch('/api/consultations/availability-days'),
          fetch('/api/consultations/my-booking'),
        ]);

        // Available days
        if (daysRes.ok) {
          const daysJson = await daysRes.json();
          if (daysJson.success) {
            const days = daysJson.data.availableDays;
            setAvailableDays(days.length > 0 ? days : [1, 2, 3, 4, 5]);
          }
        } else {
          setAvailableDays([1, 2, 3, 4, 5]);
        }

        // Existing booking
        if (bookingRes.ok) {
          const bookingJson = await bookingRes.json();
          if (bookingJson.success && bookingJson.data.booking) {
            const b = bookingJson.data.booking;
            setBookingResult({ date: b.date, time: b.time, timezone: b.timezone });
            setBookingStatus('confirmed');
          }
        }
      } catch {
        setAvailableDays([1, 2, 3, 4, 5]);
      } finally {
        setDaysLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  // Reset slot when date changes
  useEffect(() => {
    setSelectedSlot(null);
    setErrorMessage(null);
  }, [selectedDate]);

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    setBookingStatus('booking');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/consultations/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotStart: selectedSlot }),
      });

      const json = await res.json();

      if (res.status === 409 && json.error?.code === 'ALREADY_BOOKED') {
        setBookingStatus('error');
        setErrorMessage(t('alreadyBooked'));
        return;
      }

      if (res.status === 409) {
        setBookingStatus('error');
        setErrorMessage(t('slotTaken'));
        setSelectedSlot(null);
        // Force re-fetch slots by resetting date briefly
        if (selectedDate) {
          const d = new Date(selectedDate);
          setSelectedDate(null);
          setTimeout(() => setSelectedDate(d), 0);
        }
        return;
      }

      if (!res.ok || !json.success) {
        setBookingStatus('error');
        setErrorMessage(json.error?.message || t('errorLoadingSlots'));
        return;
      }

      // Format date and time for display
      const slotDate = new Date(selectedSlot);
      const dateFormatter = new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const timeFormatter = new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const tzName = Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-US', { timeZoneName: 'short' })
        .formatToParts(slotDate)
        .find((p) => p.type === 'timeZoneName')?.value || 'UTC';

      setBookingResult({
        date: dateFormatter.format(slotDate),
        time: timeFormatter.format(slotDate),
        timezone: tzName,
      });
      setBookingStatus('confirmed');
    } catch {
      setBookingStatus('error');
      setErrorMessage(t('errorLoadingSlots'));
    }
  };

  const handleCancelBooking = async () => {
    setCancelling(true);
    try {
      const res = await fetch('/api/consultations/my-booking', { method: 'DELETE' });
      const json = await res.json();

      if (res.ok && json.success) {
        setBookingStatus('idle');
        setBookingResult(null);
        setSelectedDate(null);
        setSelectedSlot(null);
        setErrorMessage(null);
      } else {
        setErrorMessage(json.error?.message || t('cancelError'));
      }
    } catch {
      setErrorMessage(t('cancelError'));
    } finally {
      setCancelling(false);
    }
  };

  // Loading session
  if (sessionStatus === 'loading') {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-gray-800 animate-pulse rounded-lg" />
        <div className="h-4 w-96 bg-gray-800 animate-pulse rounded-lg" />
        <div className="h-20 bg-gray-800 animate-pulse rounded-xl" />
      </div>
    );
  }

  // Not authenticated — show login prompt
  if (!session?.user) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-2xl font-bold text-white">{t('bookingTitle')}</h1>
        <p className="text-base text-gray-400">{t('loginRequired')}</p>
        <Link
          href={`/login?callbackUrl=/${locale}/consultation/book`}
          className="inline-flex items-center min-h-[48px] px-8 py-3 rounded-xl font-semibold text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:outline-none"
        >
          {tc('actions.signIn')}
        </Link>
      </div>
    );
  }

  // Booking confirmed
  if (bookingStatus === 'confirmed' && bookingResult) {
    return (
      <BookingConfirmation
        consultationDate={bookingResult.date}
        consultationTime={bookingResult.time}
        timezone={bookingResult.timezone}
        onBackToResults={onBackToResults}
        onCancel={handleCancelBooking}
        cancelling={cancelling}
      />
    );
  }

  // Days still loading
  if (daysLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-gray-800 animate-pulse rounded-lg" />
        <div className="h-4 w-96 bg-gray-800 animate-pulse rounded-lg" />
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="w-16 h-20 bg-gray-800 animate-pulse rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t('bookingTitle')}</h1>
        <p className="text-base text-gray-400 mt-1">{t('bookingDescription')}</p>
        <p className="text-sm text-blue-400 mt-1">{t('bookingNote')}</p>
      </div>

      {/* Date Picker */}
      <DatePicker
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        availableDays={availableDays}
      />

      {/* Time Slots */}
      {selectedDate && (
        <TimeSlots
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
        />
      )}

      {/* Error message */}
      {errorMessage && (
        <p className="text-sm text-red-400" role="alert">{errorMessage}</p>
      )}

      {/* Confirm Booking Button */}
      {selectedSlot && (
        <button
          onClick={handleConfirmBooking}
          disabled={bookingStatus === 'booking'}
          className={[
            'w-full min-h-[48px] py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200',
            'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:outline-none',
            bookingStatus === 'booking'
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-blue-500/25 cursor-pointer',
          ].join(' ')}
        >
          {bookingStatus === 'booking' ? t('booking') : t('confirmBooking')}
        </button>
      )}
    </div>
  );
}
