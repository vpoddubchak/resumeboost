import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/app/lib/prisma';
import { CaseStudyDetail } from '@/app/components/portfolio/case-study-detail';

const getPortfolioItem = cache((id: number) =>
  prisma.portfolioContent.findUnique({ where: { content_id: id } })
);

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) return { title: 'Case Study | ResumeBoost' };
  const item = await getPortfolioItem(numericId);
  if (!item) return { title: 'Case Study | ResumeBoost' };
  return { title: `${item.title} | ResumeBoost` };
}

export async function generateStaticParams() {
  const items = await prisma.portfolioContent.findMany({
    select: { content_id: true },
  });
  return items.map((i) => ({ id: String(i.content_id) }));
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) notFound();

  const item = await getPortfolioItem(numericId);
  if (!item) notFound();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Page header — same as portfolio gallery */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gray-900 border-b border-gray-800">
        <Link
          href="/resume-analysis"
          className="flex items-center gap-2 text-white font-bold text-lg hover:text-blue-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded"
        >
          ResumeBoost
        </Link>
        <nav aria-label="Site navigation">
          <Link
            href="/resume-analysis"
            className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-none"
          >
            Analyze Resume
          </Link>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">
          <CaseStudyDetail item={item} />
        </div>
      </main>
    </div>
  );
}
