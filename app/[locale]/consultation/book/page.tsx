import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/app/i18n/navigation';
import { routing } from '@/app/i18n/routing';
import { LanguageSwitcher } from '@/app/components/language-switcher';
import { BookingPageContent } from '@/app/components/consultation/booking-page-content';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consultation' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function ConsultationBookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tc = await getTranslations('common');

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gray-900 border-b border-gray-800">
        <Link href="/" className="text-white font-bold text-lg">
          {tc('appName')}
        </Link>
        <nav aria-label={tc('navigation.siteNavigation')}>
          <ul className="flex items-center gap-2">
            <li>
              <Link
                href="/"
                className="min-h-[44px] inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-none"
              >
                {tc('actions.goBackHome')}
              </Link>
            </li>
            <li>
              <Link
                href="/portfolio"
                className="min-h-[44px] inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-none"
              >
                {tc('navigation.portfolio')}
              </Link>
            </li>
            <li>
              <Link
                href="/resume-analysis"
                className="min-h-[44px] inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-none"
              >
                {tc('navigation.analyzeResume')}
              </Link>
            </li>
          </ul>
        </nav>
        <LanguageSwitcher />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-8 sm:py-12">
        <BookingPageContent />
      </main>
    </div>
  );
}
