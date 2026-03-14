import type { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/app/lib/prisma';
import { SuccessStoriesGallery } from '@/app/components/success-stories/success-stories-gallery';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Success Stories | ResumeBoost',
  description:
    'Browse real client success stories and testimonials. See how ResumeBoost helped professionals land their dream roles with measurable results.',
};

export default async function SuccessStoriesPage() {
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
          ResumeBoost
        </Link>
        <nav aria-label="Site navigation">
          <ul className="flex items-center gap-2">
            <li>
              <Link
                href="/portfolio"
                className="min-h-[44px] inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-none"
              >
                Portfolio
              </Link>
            </li>
            <li>
              <Link
                href="/resume-analysis"
                className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-none"
              >
                Analyze Resume
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Success Stories</h1>
            <p className="text-base text-gray-400 mt-1">
              Real outcomes from real clients — see what&apos;s possible with ResumeBoost
            </p>
          </div>

          <section aria-label="Success stories">
            <SuccessStoriesGallery items={items} />
          </section>
        </div>
      </main>
    </div>
  );
}
