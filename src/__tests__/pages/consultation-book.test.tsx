import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next-intl/server
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(async (opts?: { locale?: string; namespace?: string } | string) => {
    const messages = require('@/messages/en.json');
    const ns = typeof opts === 'string' ? opts : opts?.namespace;
    const resolveKey = (key: string) => {
      const fullKey = ns ? `${ns}.${key}` : key;
      const parts = fullKey.split('.');
      let result: any = messages;
      for (const part of parts) {
        if (result && typeof result === 'object' && part in result) {
          result = result[part];
        } else {
          return fullKey;
        }
      }
      return typeof result === 'string' ? result : fullKey;
    };
    const t = (key: string) => resolveKey(key);
    t.has = () => true;
    return t;
  }),
  setRequestLocale: jest.fn(),
}));

jest.mock('next-intl/routing', () => ({
  defineRouting: jest.fn(() => ({
    locales: ['en', 'uk'],
    defaultLocale: 'en',
  })),
}));

jest.mock('@/app/i18n/routing', () => ({
  routing: {
    locales: ['en', 'uk'],
    defaultLocale: 'en',
  },
}));

jest.mock('@/app/i18n/navigation', () => ({
  __esModule: true,
  Link: ({ href, children, className, ...props }: { href: string; children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <a href={href} className={className} {...props}>{children}</a>
  ),
}));

jest.mock('@/app/components/language-switcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">LangSwitch</div>,
}));

jest.mock('@/app/components/consultation/booking-page-content', () => ({
  BookingPageContent: () => <div data-testid="booking-page-content">BookingPageContent</div>,
}));

import ConsultationBookPage from '@/app/[locale]/consultation/book/page';

describe('Consultation Book Page', () => {
  const defaultParams = Promise.resolve({ locale: 'en' });

  it('renders the page header with app name', async () => {
    const Page = await ConsultationBookPage({ params: defaultParams });
    render(Page);
    expect(screen.getByText('ResumeBoost')).toBeInTheDocument();
  });

  it('renders navigation links', async () => {
    const Page = await ConsultationBookPage({ params: defaultParams });
    render(Page);
    expect(screen.getByText('Go back home')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Analyze Resume')).toBeInTheDocument();
  });

  it('renders BookingPageContent component', async () => {
    const Page = await ConsultationBookPage({ params: defaultParams });
    render(Page);
    expect(screen.getByTestId('booking-page-content')).toBeInTheDocument();
  });

  it('renders LanguageSwitcher', async () => {
    const Page = await ConsultationBookPage({ params: defaultParams });
    render(Page);
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
  });

  it('generateStaticParams returns both locales', async () => {
    const { generateStaticParams } = await import('@/app/[locale]/consultation/book/page');
    const params = generateStaticParams();
    expect(params).toEqual([{ locale: 'en' }, { locale: 'uk' }]);
  });
});
