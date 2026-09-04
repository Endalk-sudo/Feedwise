/**
 * Minimal dev seed: demo organization + sample feedbacks + insights.
 *
 * Prerequisites: a user must exist first (register via the UI, default
 * demo@example.com). The org is attached to the first user matching
 * SEED_USER_EMAIL as owner, with a Pro plan so AI chat is testable.
 *
 * Run: npm run prisma:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const seedEmail = process.env.SEED_USER_EMAIL ?? 'demo@example.com';

const SAMPLE_FEEDBACKS = [
  {
    text: 'The checkout flow is confusing, I almost gave up on my order.',
    category: 'User Experience',
    rating: 2,
    sentiment: 'Negative',
    urgency: 'High',
    keyPoints: ['Checkout flow confusing', 'Risk of abandoned orders'],
    keywords: ['checkout', 'order', 'confusing'],
  },
  {
    text: 'Customer support resolved my issue within minutes. Excellent service!',
    category: 'Customer Service',
    rating: 5,
    sentiment: 'Positive',
    urgency: 'Low',
    keyPoints: ['Fast support resolution'],
    keywords: ['support', 'service', 'fast'],
  },
  {
    text: 'Prices went up again. Considering switching to a competitor.',
    category: 'Pricing',
    rating: 2,
    sentiment: 'Negative',
    urgency: 'High',
    keyPoints: ['Price sensitivity', 'Churn risk'],
    keywords: ['pricing', 'competitor', 'expensive'],
  },
  {
    text: 'Love the new dashboard, much easier to track my stats now.',
    category: 'Features',
    rating: 4,
    sentiment: 'Positive',
    urgency: 'Low',
    keyPoints: ['Dashboard redesign well received'],
    keywords: ['dashboard', 'stats'],
  },
  {
    text: 'The mobile app crashes whenever I upload a photo.',
    category: 'Bugs/Issues',
    rating: 1,
    sentiment: 'Negative',
    urgency: 'High',
    keyPoints: ['Mobile crash on photo upload'],
    keywords: ['mobile', 'crash', 'upload', 'bug'],
  },
] as const;

async function main(): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: seedEmail } });
  if (!user) {
    console.error(
      `Seed user ${seedEmail} not found. Register via the UI first, then re-run the seed.`,
    );
    process.exit(1);
  }

  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-coffee' },
    update: {},
    create: {
      name: 'Demo Coffee Co.',
      slug: 'demo-coffee',
      businessType: 'Cafe',
      businessDescription: 'A neighborhood specialty coffee shop.',
      categories: [
        'Product Quality',
        'Customer Service',
        'Pricing',
        'User Experience',
        'Features',
        'Bugs/Issues',
      ],
      currentPlan: 'pro',
      subscriptionStatus: 'active',
      members: {
        create: { userId: user.id, role: 'owner' },
      },
    },
  });

  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: organization.id } },
    update: { role: 'owner' },
    create: { userId: user.id, organizationId: organization.id, role: 'owner' },
  });

  const existing = await prisma.feedback.count({ where: { organizationId: organization.id } });
  if (existing === 0) {
    await prisma.feedback.createMany({
      data: SAMPLE_FEEDBACKS.map((f) => ({
        organizationId: organization.id,
        text: f.text,
        category: f.category,
        rating: f.rating,
        sentiment: f.sentiment,
        urgency: f.urgency,
        keyPoints: [...f.keyPoints],
        keywords: [...f.keywords],
        confidence: 0.9,
      })),
    });
  }

  const insightCount = await prisma.insight.count({
    where: { organizationId: organization.id },
  });
  if (insightCount === 0) {
    await prisma.insight.create({
      data: {
        organizationId: organization.id,
        title: 'Fix mobile photo-upload crash',
        reason: 'Multiple high-urgency reports of crashes during photo upload.',
        action: 'Prioritize a hotfix for the mobile upload flow and add crash reporting.',
        priority: 9,
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
      },
    });
  }

  console.log(`Seeded org "${organization.slug}" for ${seedEmail}`);
}

await main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
