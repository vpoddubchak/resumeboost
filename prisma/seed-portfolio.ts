import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const portfolioItems = [
  {
    title: 'Senior Software Engineer — FAANG Placement',
    description:
      'Transformed a generic resume into a results-driven profile. Added quantified achievements (reduced deployment time by 40%), restructured technical skills section, and tailored keywords to ATS requirements. Candidate received interview invites from 3 top-tier companies within 2 weeks.',
    content_type: 'engineering',
    file_url: null,
    is_featured: true,
  },
  {
    title: 'Marketing Manager — Agency to In-House Transition',
    description:
      'Repositioned candidate from agency background to in-house marketing leadership. Highlighted campaign ROI metrics, rebranded summary to reflect strategic value, and aligned experience with brand management terminology. Secured senior role at Fortune 500 company.',
    content_type: 'marketing',
    file_url: null,
    is_featured: true,
  },
  {
    title: 'UX/UI Designer — Portfolio Pivot',
    description:
      'Overhauled resume for designer transitioning to product-focused roles. Emphasised user research skills and design system contributions, added measurable impact statements (improved checkout conversion by 22%), and restructured work history for clarity.',
    content_type: 'design',
    file_url: null,
    is_featured: false,
  },
  {
    title: 'Operations Manager — Cross-Industry Move',
    description:
      'Helped operations professional pivot from manufacturing to tech industry. Translated process improvement experience into startup-friendly language, highlighted cost savings (€1.2M annually), and reframed leadership accomplishments for a fast-paced environment.',
    content_type: 'management',
    file_url: null,
    is_featured: false,
  },
  {
    title: 'Data Analyst — Entry Level to Mid-Senior',
    description:
      'Elevated an analyst resume with stronger action verbs and quantified outcomes. Added data storytelling narrative, highlighted Python and SQL project impact, and restructured education section to showcase relevant certifications prominently.',
    content_type: 'engineering',
    file_url: null,
    is_featured: false,
  },
  {
    title: 'Product Manager — Startup to Enterprise',
    description:
      'Repositioned PM candidate for enterprise roles by emphasising cross-functional leadership and stakeholder management. Added product launch metrics (3 features shipped to 50K+ users), reframed agile experience, and tailored tone to enterprise expectations.',
    content_type: 'management',
    file_url: null,
    is_featured: true,
  },
  {
    title: 'Content Strategist — Freelance to Full-Time',
    description:
      'Consolidated 5 years of freelance work into a cohesive narrative for full-time applications. Highlighted content performance metrics (300% organic traffic growth), structured portfolio references, and tailored messaging for B2B SaaS companies.',
    content_type: 'marketing',
    file_url: null,
    is_featured: false,
  },
  {
    title: 'Graphic Designer — Expanding into Brand Strategy',
    description:
      'Evolved resume beyond execution skills to position candidate as a brand strategist. Added brand identity case studies, incorporated business impact language, and reorganised experience to lead with strategic contributions over deliverables.',
    content_type: 'design',
    file_url: null,
    is_featured: false,
  },
];

async function seedPortfolio() {
  console.log('Seeding portfolio content...');

  await prisma.portfolioContent.deleteMany({});
  const result = await prisma.portfolioContent.createMany({
    data: portfolioItems,
  });

  console.log(`Portfolio seeding complete. Inserted ${result.count} items.`);
}

seedPortfolio()
  .catch((e) => {
    console.error('Portfolio seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
