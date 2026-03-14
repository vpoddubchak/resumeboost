import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default availability rules...');

  // Mon-Fri (1-5), 10:00-18:00 Kyiv time
  const defaultRules = [
    { day_of_week: 1, start_time: '10:00', end_time: '18:00' },
    { day_of_week: 2, start_time: '10:00', end_time: '18:00' },
    { day_of_week: 3, start_time: '10:00', end_time: '18:00' },
    { day_of_week: 4, start_time: '10:00', end_time: '18:00' },
    { day_of_week: 5, start_time: '10:00', end_time: '18:00' },
  ];

  for (const rule of defaultRules) {
    await prisma.availabilityRule.upsert({
      where: {
        day_of_week_start_time: {
          day_of_week: rule.day_of_week,
          start_time: rule.start_time,
        },
      },
      update: {
        end_time: rule.end_time,
        is_active: true,
      },
      create: {
        day_of_week: rule.day_of_week,
        start_time: rule.start_time,
        end_time: rule.end_time,
        is_active: true,
      },
    });
  }

  console.log('Seeded 5 availability rules (Mon-Fri, 10:00-18:00 Kyiv)');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
