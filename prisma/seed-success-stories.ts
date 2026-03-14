import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const successStories = [
  {
    client_name: 'Sarah',
    client_role: 'Software Engineer',
    industry: 'engineering',
    challenge:
      'Sarah had been applying to senior engineering roles for 4 months with no response. Her resume listed job duties without quantified impact and lacked the keywords ATS systems were scanning for at top tech companies.',
    solution:
      'ResumeBoost rewrote every bullet point using the STAR method with measurable outcomes. We restructured her technical skills section to align with FAANG expectations and added a targeted summary emphasising distributed systems experience.',
    results:
      'Sarah received 4 interview invitations within 2 weeks of updating her resume, including from two FAANG-tier companies. She accepted an offer with a 35% salary increase over her previous role.',
    testimonial_quote:
      "I had almost given up on making the jump to a senior role. After ResumeBoost, my inbox was suddenly full of recruiter messages. The difference was night and day.",
    outcome_type: 'salary-increase',
    metrics: { salaryIncrease: '35%', interviewsSecured: 4, timeToOffer: '5 weeks', responseRateImprovement: '60%' },
    is_featured: true,
  },
  {
    client_name: 'Marcus',
    client_role: 'Marketing Manager',
    industry: 'marketing',
    challenge:
      'Marcus spent 6 months trying to transition from agency to in-house brand management. Recruiters perceived him as a vendor rather than a strategic leader. His resume focused on client deliverables instead of business outcomes.',
    solution:
      'We repositioned Marcus from "agency executor" to "strategic brand leader." His professional summary was rewritten around P&L ownership, and every bullet was reframed to highlight brand growth, market share, and cross-functional leadership.',
    results:
      'Marcus landed a Senior Brand Manager role at a Fortune 500 FMCG company within 6 weeks. His new salary was 28% above his agency compensation, with a performance bonus and equity.',
    testimonial_quote:
      'The resume ResumeBoost created made me look like a completely different candidate — in the best way. I finally got calls back from the companies I actually wanted to work for.',
    outcome_type: 'career-change',
    metrics: { salaryIncrease: '28%', interviewsSecured: 6, timeToOffer: '6 weeks' },
    is_featured: true,
  },
  {
    client_name: 'Priya',
    client_role: 'UX Designer',
    industry: 'design',
    challenge:
      'Priya was consistently shortlisted but not progressing past first-round interviews. Her resume read like a project list without business context, and she struggled to communicate the strategic value of her design work.',
    solution:
      'ResumeBoost reframed each project using the design thinking process with business outcomes front and centre. We added conversion metrics, user research depth, and a section highlighting her design system contributions.',
    results:
      'Priya received 5 callbacks in 3 weeks including from two Series-B startups and a public tech company. She accepted a Senior Product Designer role with a 30% compensation increase and ownership of the design system.',
    testimonial_quote:
      "I always struggled to explain my value in a resume. ResumeBoost translated my work into language that resonated with hiring managers and not just other designers.",
    outcome_type: 'salary-increase',
    metrics: { salaryIncrease: '30%', interviewsSecured: 5, timeToOffer: '4 weeks', responseRateImprovement: '50%' },
    is_featured: false,
  },
  {
    client_name: 'James',
    client_role: 'Operations Manager',
    industry: 'management',
    challenge:
      'James had 12 years in manufacturing operations and wanted to move into tech. His resume was full of industry-specific jargon and plant-floor terminology that tech recruiters did not understand or value.',
    solution:
      'We translated James\'s operational expertise into universal language: process automation, cross-functional team leadership, and cost optimisation. A "Tech Fluency" section was added to bridge the credibility gap.',
    results:
      'James secured an Operations Manager role at a Series-C fintech startup within 4 weeks. The hiring manager specifically cited the resume\'s clarity in conveying cross-industry experience as the reason he was selected over more "tech-native" candidates.',
    testimonial_quote:
      'I had been rejected from every tech role I applied for. ResumeBoost figured out how to make my experience relevant, and the results spoke for themselves.',
    outcome_type: 'career-change',
    metrics: { interviewsSecured: 3, timeToOffer: '4 weeks', responseRateImprovement: '45%' },
    is_featured: false,
  },
  {
    client_name: 'Aisha',
    client_role: 'Financial Analyst',
    industry: 'finance',
    challenge:
      'Aisha had strong credentials but her resume undersold her impact. Bullet points described her responsibilities rather than her contributions, and her quantitative achievements were buried in job descriptions.',
    solution:
      'ResumeBoost restructured Aisha\'s resume to lead with quantified financial impact. We promoted her key achievements — cost savings, forecast accuracy improvements, and process automations — to the top of each role.',
    results:
      'Aisha progressed to final-round interviews at 3 investment banks and accepted a VP-level role with a 40% total compensation increase. She credited the resume for finally communicating her true commercial value.',
    testimonial_quote:
      'My previous resume did not do justice to the work I had actually done. ResumeBoost helped me articulate my value in a way that got me to the table at firms I had dreamed of joining.',
    outcome_type: 'interviews-secured',
    metrics: { salaryIncrease: '40%', interviewsSecured: 8, timeToOffer: '7 weeks', responseRateImprovement: '70%' },
    is_featured: true,
  },
  {
    client_name: 'Tom',
    client_role: 'Clinical Research Coordinator',
    industry: 'healthcare',
    challenge:
      'Tom wanted to move from clinical research into healthcare technology product management. His resume was heavy on clinical protocol language that product hiring managers found opaque and irrelevant.',
    solution:
      'We positioned Tom\'s clinical expertise as a competitive advantage in healthtech — translating protocol management into product requirements, regulatory compliance into risk management, and patient data into user insight.',
    results:
      'Tom received interview offers from 4 digital health companies and accepted a Product Manager role at a Series-A healthtech startup. The role was a 20% salary increase with significant equity upside.',
    testimonial_quote:
      'I was worried my clinical background would hold me back in product. ResumeBoost showed me — and hiring managers — that it was actually my biggest differentiator.',
    outcome_type: 'career-change',
    metrics: { salaryIncrease: '20%', interviewsSecured: 4, timeToOffer: '8 weeks' },
    is_featured: false,
  },
  {
    client_name: 'Elena',
    client_role: 'Data Scientist',
    industry: 'engineering',
    challenge:
      'Elena had strong technical skills but her resume was a wall of tools and technologies with no narrative. She was consistently screened out before speaking to a human, suggesting ATS keyword issues combined with low-impact framing.',
    solution:
      'ResumeBoost rebuilt Elena\'s resume around data-driven business outcomes rather than tool lists. We highlighted model accuracy improvements, revenue impact, and stakeholder-facing work to position her as a business-focused data scientist.',
    results:
      'Elena doubled her interview rate within 3 weeks and secured a Senior Data Scientist role at a growth-stage e-commerce company with a 25% salary uplift and flexible remote work.',
    testimonial_quote:
      "I knew I was good at my job — I just could not seem to prove it on paper. ResumeBoost fixed that problem completely.",
    outcome_type: 'interviews-secured',
    metrics: { salaryIncrease: '25%', interviewsSecured: 6, timeToOffer: '3 weeks', responseRateImprovement: '100%' },
    is_featured: false,
  },
  {
    client_name: 'Daniel',
    client_role: 'HR Business Partner',
    industry: 'management',
    challenge:
      'Daniel had been in generalist HR roles for 8 years and wanted to move into a strategic HRBP position at a tech company. His resume focused on administrative HR tasks rather than business partnership and talent strategy.',
    solution:
      'We repositioned Daniel from HR administrator to strategic people partner. His resume was rewritten to highlight workforce planning, organisational design, and talent acquisition outcomes tied to business growth metrics.',
    results:
      'Daniel secured an HRBP role at a mid-stage SaaS company within 5 weeks, with a 22% salary increase and direct partnership with the VP of Engineering — the type of strategic role he had been targeting.',
    testimonial_quote:
      'ResumeBoost understood exactly what I was trying to achieve and helped me tell the right story. I went from being ignored to being headhunted.',
    outcome_type: 'salary-increase',
    metrics: { salaryIncrease: '22%', interviewsSecured: 5, timeToOffer: '5 weeks', responseRateImprovement: '55%' },
    is_featured: false,
  },
];

async function seedSuccessStories() {
  console.log('Seeding success stories...');

  await prisma.successStory.deleteMany({});
  const result = await prisma.successStory.createMany({
    data: successStories,
  });

  console.log(`Success stories seeding complete. Inserted ${result.count} items.`);
}

seedSuccessStories()
  .catch((e) => {
    console.error('Success stories seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
