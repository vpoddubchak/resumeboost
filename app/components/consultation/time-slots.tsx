'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useState, useEffect } from 'react';

interface Slot {
  start: string;
  end: string;
}

interface TimeSlotsProps {
  selectedDate: Date;
  selectedSlot: string | null;
  onSelectSlot: (slotStartUTC: string) => void;
}

export function TimeSlots({ selectedDate, selectedSlot, onSelectSlot }: TimeSlotsProps) {
  const t = useTranslations('consultation');
  const locale = useLocale();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchSlots() {
      setLoading(true);
      setError(false);
      setSlots([]);

      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

      try {
        const res = await fetch(`/api/consultations/slots?date=${dateStr}`);
        if (!res.ok) throw new Error('Failed to fetch slots');
        const json = await res.json();
        if (!cancelled && json.success) {
          setSlots(json.data.slots);
        } else if (!cancelled) {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSlots();
    return () => { cancelled = true; };
  }, [selectedDate]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">{t('availableSlots')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" aria-busy="true" aria-label={t('loadingSlots')}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-gray-800 animate-pulse" />
          ))}
        </div>
        <p className="text-sm text-gray-500" aria-live="polite">{t('loadingSlots')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">{t('availableSlots')}</h3>
        <p className="text-sm text-red-400" role="alert">{t('errorLoadingSlots')}</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">{t('availableSlots')}</h3>
        <p className="text-sm text-gray-500">{t('noSlotsAvailable')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-400">{t('availableSlots')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="listbox" aria-label={t('availableSlots')}>
        {slots.map((slot) => {
          const selected = selectedSlot === slot.start;
          return (
            <button
              key={slot.start}
              role="option"
              aria-selected={selected}
              onClick={() => onSelectSlot(slot.start)}
              className={[
                'min-h-[48px] px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:outline-none',
                selected
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer',
              ].join(' ')}
            >
              {formatTime(slot.start)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
