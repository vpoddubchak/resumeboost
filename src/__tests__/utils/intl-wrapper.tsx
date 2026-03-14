import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { render, RenderOptions } from '@testing-library/react';
import messages from '@/messages/en.json';

interface IntlWrapperProps {
  children: React.ReactNode;
  locale?: string;
}

export function IntlWrapper({ children, locale = 'en' }: IntlWrapperProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

export function renderWithIntl(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: IntlWrapper, ...options });
}
