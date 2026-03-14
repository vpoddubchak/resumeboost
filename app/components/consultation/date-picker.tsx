'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useCallback, useRef, useEffect } from 'react';

interface DatePickerProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  availableDays: number[];
}

export function DatePicker({ selectedDate, onSelectDate, availableDays }: DatePickerProps) {
  const t = useTranslations('consultation');
  const locale = useLocale();
  const listRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }

  const isAvailable = (date: Date) => availableDays.includes(date.getDay());

  const isSameDay = (a: Date, b: Date | null) =>
    b !== null &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isToday = (date: Date) => isSameDay(date, today);

  const isTomorrow = (date: Date) => {
    const tom = new Date(today);
    tom.setDate(today.getDate() + 1);
    return isSameDay(date, tom);
  };

  const getDayLabel = (date: Date) => {
    if (isToday(date)) return t('today');
    if (isTomorrow(date)) return t('tomorrow');
    return new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-US', { weekday: 'short' }).format(date);
  };

  const getDateNumber = (date: Date) => date.getDate();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex = index;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = Math.min(index + 1, dates.length - 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = Math.max(index - 1, 0);
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = dates.length - 1;
      }
      if (nextIndex !== index) {
        const buttons = listRef.current?.querySelectorAll('[role="option"]');
        (buttons?.[nextIndex] as HTMLButtonElement)?.focus();
      }
    },
    [dates.length]
  );

  useEffect(() => {
    if (selectedDate && listRef.current) {
      const selectedIndex = dates.findIndex((d) => isSameDay(d, selectedDate));
      if (selectedIndex >= 0) {
        const buttons = listRef.current.querySelectorAll('[role="option"]');
        (buttons[selectedIndex] as HTMLElement)?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-400">{t('selectDate')}</h3>
      <div
        ref={listRef}
        role="listbox"
        aria-label={t('selectDate')}
        className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-700"
      >
        {dates.map((date, index) => {
          const available = isAvailable(date);
          const selected = isSameDay(date, selectedDate);

          return (
            <button
              key={date.toISOString()}
              role="option"
              aria-selected={selected}
              aria-disabled={!available}
              tabIndex={selected ? 0 : -1}
              disabled={!available}
              onClick={() => available && onSelectDate(date)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={[
                'flex-shrink-0 snap-start flex flex-col items-center justify-center w-16 h-20 rounded-xl text-sm font-medium transition-all duration-200',
                'min-h-[48px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:outline-none',
                selected
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : available
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer'
                  : 'bg-gray-900 text-gray-600 cursor-not-allowed',
              ].join(' ')}
            >
              <span className="text-xs">{getDayLabel(date)}</span>
              <span className="text-lg font-bold">{getDateNumber(date)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
