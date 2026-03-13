import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const portfolioItems = [
  {
    title: 'Senior Software Engineer — FAANG Placement',
    description:
      'Before: Generic resume listing responsibilities without measurable impact. Candidate had applied to 20+ roles with a 5% response rate and zero interview callbacks from target companies.\n\nImprovements Made:\n• Rewrote bullet points with quantified achievements — e.g., "Reduced deployment time by 40% through CI/CD pipeline optimisation" and "Led migration of 3 microservices serving 2M daily requests"\n• Restructured technical skills into categories (Languages, Frameworks, Cloud/DevOps) aligned with FAANG job descriptions\n• Added a targeted summary highlighting system design and scalability expertise\n• Tailored keywords to pass ATS filters for Senior SWE roles at Google, Meta, and Amazon\n\nResults: Candidate secured 3 interview invitations from top-tier companies within 2 weeks. Response rate improved from 5% to 40%. Received and accepted an offer with an 18% salary increase over previous role.',
    content_type: 'engineering',
    file_url: null,
    is_featured: true,
  },
  {
    title: 'Marketing Manager — Agency to In-House Transition',
    description:
      'Before: Agency-focused resume emphasising client deliverables and project volume. Hiring managers at in-house teams perceived the candidate as a "vendor" rather than a strategic leader. Three months of applications yielded no senior-level interviews.\n\nImprovements Made:\n• Repositioned narrative from "agency executor" to "strategic marketing leader" by rewriting the professional summary around brand growth and P&L accountability\n• Highlighted campaign ROI metrics — e.g., "Drove 150% increase in qualified leads through integrated digital campaigns with $2M annual budget"\n• Replaced agency jargon with in-house brand management terminology (brand equity, customer lifetime value, market positioning)\n• Added a "Key Achievements" section showcasing cross-functional leadership with product, sales, and C-suite stakeholders\n\nResults: Secured a Senior Marketing Manager role at a Fortune 500 company within 6 weeks. Starting salary was 25% above previous agency compensation. Candidate reported the repositioned resume "completely changed how recruiters perceived my experience."',
    content_type: 'marketing',
    file_url: null,
    is_featured: true,
  },
  {
    title: 'UX/UI Designer — Portfolio Pivot',
    description:
      'Before: Portfolio-heavy resume that read like a project list without business context. The candidate was consistently passed over for Product Designer roles in favour of candidates who demonstrated strategic thinking and user research depth.\n\nImprovements Made:\n• Reframed each project around the design thinking process: problem definition → research → ideation → validation → measurable outcome\n• Added impact metrics — e.g., "Redesigned checkout flow increasing conversion by 22%" and "Design system adoption reduced component inconsistencies by 60% across 4 product teams"\n• Emphasised user research skills: usability testing, A/B experimentation, journey mapping\n• Restructured work history to lead with strategic contributions rather than visual deliverables\n\nResults: Candidate received 5 interview requests within 3 weeks, including from two Series-B startups and one public tech company. Accepted a Senior Product Designer role with a 30% compensation increase and design system ownership.',
    content_type: 'design',
    file_url: null,
    is_featured: false,
  },
  {
    title: 'Operations Manager — Cross-Industry Move',
    description:
      'Before: Manufacturing-focused resume heavy with industry-specific terminology (Six Sigma, lean manufacturing, plant operations). Tech recruiters consistently filtered the candidate out due to perceived lack of relevance to software/SaaS operations.\n\nImprovements Made:\n• Translated manufacturing process improvement into universal operations language — "Implemented continuous improvement framework" became "Designed and scaled operational workflows supporting 300% team growth"\n• Highlighted transferable cost savings: "Reduced operational costs by €1.2M annually through vendor consolidation and process automation"\n• Reframed leadership from plant-floor management to cross-functional team leadership in fast-paced, ambiguous environments\n• Added a "Tech Fluency" section showcasing Jira, Notion, data analytics tools, and API integration experience\n\nResults: Candidate landed an Operations Manager role at a Series-C fintech startup within 4 weeks. Salary matched previous manufacturing role with significantly better equity package. Hiring manager specifically cited the resume\'s clarity in translating cross-industry experience.',
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
