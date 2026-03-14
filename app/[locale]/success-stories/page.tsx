import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/app/i18n/navigation';
import { routing } from '@/app/i18n/routing';
import prisma from '@/app/lib/prisma';
import { SuccessStoriesGallery } from '@/app/components/success-stories/success-stories-gallery';
import { LanguageSwitcher } from '@/app/components/language-switcher';

export const revalidate = 3600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'stories' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function SuccessStoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('stories');
  const tc = await getTranslations('common');
  const items = await prisma.successStory.findMany({
    orderBy: [{ is_featured: 'desc' }, { created_at: 'desc' }],
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Page header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gray-900 border-b border-gray-800">
        <Link
          href="/resume-analysis"
          className="flex items-center gap-2 text-white font-bold text-lg hover:text-blue-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded"
        >
          {tc('appName')}
        </Link>
        <nav aria-label={tc('navigation.siteNavigation')}>
          <ul className="flex items-center gap-2">
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
                className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-none"
              >
                {tc('navigation.analyzeResume')}
              </Link>
            </li>
          </ul>
        </nav>
        <LanguageSwitcher />
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
            <p className="text-base text-gray-400 mt-1">
              {t('description')}
            </p>
          </div>

          <section aria-label={t('galleryLabel')}>
            <SuccessStoriesGallery items={items} />
          </section>
        </div>
      </main>
    </div>
  );
}
