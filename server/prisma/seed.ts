/**
 * Dev seed: demo user + Pro organization + rich feedbacks + insights.
 *
 * Self-contained: creates the user (Better-Auth credential account with a
 * known password) if missing, attaches/creates the `demo-coffee` org as
 * owner, forces a local Pro subscription (no Stripe calls), and tops up
 * ~30 feedbacks + 4 insights with full AI-field coverage.
 *
 * Env overrides: SEED_USER_EMAIL (default demo@example.com),
 * SEED_USER_PASSWORD (default Demo1234!), SEED_USER_NAME (default Demo Owner).
 * Idempotent: safe to re-run, never deletes or overwrites existing rows
 * (except forcing the org onto the Pro plan).
 *
 * Run: npm run prisma:seed
 */
import { PrismaClient } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';

const prisma = new PrismaClient();
const seedEmail = process.env.SEED_USER_EMAIL ?? 'demo@example.com';
const seedPassword = process.env.SEED_USER_PASSWORD ?? 'Demo1234!';
const seedName = process.env.SEED_USER_NAME ?? 'Demo Owner';

const CATEGORIES = [
  'Product Quality',
  'Customer Service',
  'Pricing',
  'User Experience',
  'Features',
  'Bugs/Issues',
];

interface SeedFeedback {
  text: string;
  category: string;
  rating: number;
  sentiment: string;
  urgency: string;
  satisfactionEstimate: number;
  fixableProblem: boolean;
  concreteIssue?: string;
  retentionRisk: string;
  keyPoints: string[];
  keywords: string[];
  themes: string[];
  status?: string;
  verified?: boolean;
  daysAgo: number;
  ownerReply?: string;
  internalNote?: string;
}

const SEED_FEEDBACKS: SeedFeedback[] = [
  {
    text: 'The oat milk latte was perfect today — great balance, not too sweet. Best coffee in the neighborhood!',
    category: 'Product Quality',
    rating: 5,
    sentiment: 'Positive',
    urgency: 'Low',
    satisfactionEstimate: 5,
    fixableProblem: false,
    retentionRisk: 'Low',
    keyPoints: ['Signature drink quality praised'],
    keywords: ['latte', 'oat milk', 'quality'],
    themes: ['drink quality'],
    daysAgo: 0,
    verified: true,
  },
  {
    text: 'Waited 25 minutes for a simple cappuccino during the morning rush. You need more staff at peak hours.',
    category: 'Customer Service',
    rating: 2,
    sentiment: 'Negative',
    urgency: 'High',
    satisfactionEstimate: 2,
    fixableProblem: true,
    concreteIssue: 'Long wait times during the morning rush',
    retentionRisk: 'High',
    keyPoints: ['Morning rush understaffed', 'Wait time complaint'],
    keywords: ['wait', 'rush', 'staff', 'cappuccino'],
    themes: ['wait time', 'staffing'],
    daysAgo: 0,
    verified: true,
  },
  {
    text: 'Love the new loyalty app! Earning points for every visit makes me come back more often.',
    category: 'Features',
    rating: 5,
    sentiment: 'Positive',
    urgency: 'Low',
    satisfactionEstimate: 5,
    fixableProblem: false,
    retentionRisk: 'Low',
    keyPoints: ['Loyalty app well received', 'Repeat-visit driver'],
    keywords: ['loyalty', 'app', 'points'],
    themes: ['loyalty program'],
    daysAgo: 1,
  },
  {
    text: 'The mobile order-ahead charged me twice and I am still waiting on a refund after a week.',
    category: 'Bugs/Issues',
    rating: 1,
    sentiment: 'Negative',
    urgency: 'High',
    satisfactionEstimate: 1,
    fixableProblem: true,
    concreteIssue: 'Double charge on mobile order-ahead with no refund',
    retentionRisk: 'High',
    keyPoints: ['Double charge bug', 'Refund delay'],
    keywords: ['mobile', 'charged twice', 'refund'],
    themes: ['payments', 'mobile ordering'],
    daysAgo: 1,
    verified: true,
  },
  {
    text: 'Croissants are always fresh and flaky. The almond one is my absolute favorite.',
    category: 'Product Quality',
    rating: 5,
    sentiment: 'Positive',
    urgency: 'Low',
    satisfactionEstimate: 5,
    fixableProblem: false,
    retentionRisk: 'Low',
    keyPoints: ['Pastry freshness praised'],
    keywords: ['croissant', 'fresh', 'pastry'],
    themes: ['food quality'],
    daysAgo: 2,
  },
  {
    text: 'Prices went up again — $6.50 for a latte is pushing it. Considering the place across the street.',
    category: 'Pricing',
    rating: 2,
    sentiment: 'Negative',
    urgency: 'High',
    satisfactionEstimate: 2,
    fixableProblem: true,
    concreteIssue: 'Latte price perceived as too high vs competitors',
    retentionRisk: 'High',
    keyPoints: ['Price sensitivity', 'Churn risk'],
    keywords: ['pricing', 'expensive', 'competitor'],
    themes: ['pricing'],
    daysAgo: 2,
  },
  {
    text: 'Barista remembered my name and my usual order. That personal touch keeps me coming back.',
    category: 'Customer Service',
    rating: 5,
    sentiment: 'Positive',
    urgency: 'Low',
    satisfactionEstimate: 5,
    fixableProblem: false,
    retentionRisk: 'Low',
    keyPoints: ['Personalized service praised'],
    keywords: ['barista', 'service', 'personal'],
    themes: ['service quality'],
    daysAgo: 3,
  },
  {
    text: 'WiFi kept dropping during my work session. Hard to use this as a remote-work spot like this.',
    category: 'User Experience',
    rating: 2,
    sentiment: 'Negative',
    urgency: 'Medium',
    satisfactionEstimate: 2,
    fixableProblem: true,
    concreteIssue: 'Unstable guest WiFi drops during work sessions',
    retentionRisk: 'Medium',
    keyPoints: ['WiFi instability', 'Remote-work use case at risk'],
    keywords: ['wifi', 'work', 'connection'],
    themes: ['wifi', 'ambiance'],
    daysAgo: 3,
  },
  {
    text: 'The seasonal pumpkin spice cold brew is amazing — please keep it year-round!',
    category: 'Product Quality',
    rating: 4,
    sentiment: 'Positive',
    urgency: 'Low',
    satisfactionEstimate: 4,
    fixableProblem: false,
    retentionRisk: 'Low',
    keyPoints: ['Seasonal drink hit'],
    keywords: ['cold brew', 'seasonal', 'pumpkin'],
    themes: ['seasonal menu'],
    daysAgo: 4,
  },
  {
    text: 'Ordered a decaf and got regular. It ruined my evening — I could taste the difference immediately.',
    category: 'Product Quality',
    rating: 1,
    sentiment: 'Negative',
    urgency: 'High',
    satisfactionEstimate: 1,
    fixableProblem: true,
    concreteIssue: 'Wrong drink served: regular instead of decaf',
    retentionRisk: 'High',
    keyPoints: ['Wrong order fulfilled', 'Drink accuracy problem'],
    keywords: ['decaf', 'wrong order', 'accuracy'],
    themes: ['order accuracy'],
    status: 'in_progress',
    internalNote: 'Check with evening shift lead; possible rush-hour mix-up.',
    daysAgo: 4,
    verified: true,
  },
  {
    text: 'Nice atmosphere and decent coffee, nothing extraordinary but solid for the price.',
    category: 'User Experience',
    rating: 3,
    sentiment: 'Neutral',
    urgency: 'Low',
    satisfactionEstimate: 3,
    fixableProblem: false,
    retentionRisk: 'Low',
    keyPoints: ['Average but satisfactory visit'],
    keywords: ['atmosphere', 'decent', 'price'],
    themes: ['ambiance'],
    daysAgo: 5,
  },
  {
    text: 'The app lets me customize sweetness and milk perfectly, and my order is ready when I arrive. Great system.',
    category: 'Features',
    rating: 5,
    sentiment: 'Positive',
    urgency: 'Low',
    satisfactionEstimate: 5,
    fixableProblem: false,
    retentionRisk: 'Low',
    keyPoints: ['Order-ahead customization praised'],
    keywords: ['app', 'customize', 'order-ahead'],
    themes: ['mobile ordering'],
    daysAgo: 5,
  },
  {
    text: 'Tables were sticky and the trash was overflowing at 10am. Cleanliness has slipped lately.',
    category: 'User Experience',
    rating: 2,
    sentiment: 'Negative',
    urgency: 'Medium',
    satisfactionEstimate: 2,
    fixableProblem: true,
    concreteIssue: 'Dining area not cleaned during service hours',
    retentionRisk: 'Medium',
    keyPoints: ['Cleanliness complaint'],
    keywords: ['clean', 'tables', 'trash'],
    themes: ['cleanliness'],
    daysAgo: 6,
  },
  {
    text: 'Espresso was bitter and lukewarm. Tastes like the machine needs calibration or the beans are stale.',
    category: 'Product Quality',
    rating: 2,
    sentiment: 'Negative',
    urgency: 'Medium',
    satisfactionEstimate: 2,
    fixableProblem: true,
    concreteIssue: 'Espresso quality inconsistent: bitter and lukewarm',
    retentionRisk: 'Medium',
    keyPoints: ['Espresso quality issue'],
    keywords: ['espresso', 'bitter', 'temperature'],
    themes: ['drink quality', 'equipment'],
    daysAgo: 7,
  },
  {
    text: 'Live acoustic night on Fridays is such a vibe. Great music, great coffee — my favorite evening spot now.',
    category: 'Features',
    rating: 5,
    sentiment: 'Positive',
    urgency: 'Low',
    satisfactionEstimate: 5,
    fixableProblem: false,
    retentionRisk: 'Low',
    keyPoints: ['Events drive evening traffic'],
    keywords: ['music', 'events', 'evening'],
    themes: ['events', 'ambiance'],
    daysAgo: 8,
  },
  {
    text: 'Paid for an extra shot and I am fairly sure it was not added. Felt rushed at the counter.',
    category: 'Pricing',
    rating: 2,
    sentiment: 'Mixed',
    urgency: 'Medium',
    satisfactionEstimate: 3,
    fixableProblem: true,
    concreteIssue: 'Paid add-on possibly not fulfilled',
    retentionRisk: 'Medium',
    keyPoints: ['Add-on fulfillment doubt', 'Felt rushed'],
    keywords: ['extra shot', 'counter', 'rushed'],
    themes: ['order accuracy', 'service quality'],
    daysAgo: 9,
  },
  {
    text: 'Wheelchair ramp access is good and staff helped me find a comfortable table. Thank you for the accessibility.',
    category: 'Customer Service',
    rating: 5,
    sentiment: 'Positive',
    urgency: 'Low',
    satisfactionEstimate: 5,
    fixableProblem: false,
    retentionRisk: 'Low',
    keyPoints: ['Accessibility praised'],
    keywords: ['accessibility', 'staff', 'helpful'],
    themes: ['accessibility', 'service quality'],
    daysAgo: 10,
  },
  {
    text: 'The QR feedback form itself was quick and easy — took 30 seconds. More places should do this.',
    category: 'User Experience',
    rating: 4,
    sentiment: 'Positive',
    urgency: 'Low',
    satisfactionEstimate: 4,
    fixableProblem: false,
    retentionRisk: 'Low',
    keyPoints: ['Feedback flow praised'],
    keywords: ['qr', 'feedback', 'easy'],
    themes: ['feedback experience'],
    daysAgo: 11,
    verified: true,
  },
  {
    text: 'Oat milk upcharge of $1 plus a price hike feels like being nickel-and-dimed. One or the other, please.',
    category: 'Pricing',
    rating: 2,
    sentiment: 'Negative',
    urgency: 'Medium',
    satisfactionEstimate: 2,
    fixableProblem: true,
    concreteIssue: 'Milk-alternative upcharge stacked on base price hike',
    retentionRisk: 'Medium',
    keyPoints: ['Upcharge frustration'],
    keywords: ['upcharge', 'oat milk', 'price'],
    themes: ['pricing'],
    daysAgo: 12,
  },
  {
    text: 'Cold brew was watery and weak today, totally different from last week. Consistency is off.',
    category: 'Product Quality',
    rating: 2,
    sentiment: 'Negative',
    urgency: 'Medium',
    satisfactionEstimate: 2,
    fixableProblem: true,
    concreteIssue: 'Cold brew strength inconsistent between batches',
    retentionRisk: 'Medium',
    keyPoints: ['Brew consistency issue'],
    keywords: ['cold brew', 'weak', 'consistency'],
    themes: ['drink quality'],
    daysAgo: 13,
  },
  {
    text: 'Shoutout to the morning crew — super friendly even at 6:30am rush. You can tell they like working here.',
    category: 'Customer Service',
    rating: 5,
    sentiment: 'Positive',
    urgency: 'Low',
    satisfactionEstimate: 5,
    fixableProblem: false,
    retentionRisk: 'Low',
    keyPoints: ['Morning crew friendliness praised'],
    keywords: ['friendly', 'morning', 'crew'],
    themes: ['service quality'],
    daysAgo: 14,
  },
  {
    text: 'Tried to redeem loyalty points but the cashier said the system was down. Second time this month.',
    category: 'Bugs/Issues',
    rating: 2,
    sentiment: 'Negative',
    urgency: 'High',
    satisfactionEstimate: 2,
    fixableProblem: true,
    concreteIssue: 'Loyalty redemption system repeatedly offline',
    retentionRisk: 'High',
    keyPoints: ['Loyalty system outage (repeat)'],
    keywords: ['loyalty', 'points', 'system down'],
    themes: ['loyalty program', 'reliability'],
    daysAgo: 15,
    verified: true,
  },
  {
    text: 'Decent espresso, slow WiFi, average seating. It is fine for a quick stop but not a work cafe.',
    category: 'User Experience',
    rating: 3,
    sentiment: 'Neutral',
    urgency: 'Low',
    satisfactionEstimate: 3,
    fixableProblem: false,
    retentionRisk: 'Low',
    keyPoints: ['Okay for quick stops'],
    keywords: ['espresso', 'wifi', 'seating'],
    themes: ['ambiance'],
    daysAgo: 16,
  },
  {
    text: 'The new matcha latte is delicious and not overly sweet. Finally a good non-coffee option!',
    category: 'Product Quality',
    rating: 4,
    sentiment: 'Positive',
    urgency: 'Low',
    satisfactionEstimate: 4,
    fixableProblem: false,
    retentionRisk: 'Low',
    keyPoints: ['Non-coffee menu praised'],
    keywords: ['matcha', 'non-coffee', 'menu'],
    themes: ['menu variety'],
    daysAgo: 17,
  },
  {
    text: 'My croissant had a hair in it. Staff apologized and replaced it quickly, so credit for the recovery.',
    category: 'Product Quality',
    rating: 3,
    sentiment: 'Mixed',
    urgency: 'Medium',
    satisfactionEstimate: 3,
    fixableProblem: true,
    concreteIssue: 'Foreign object in pastry; food-handling check needed',
    retentionRisk: 'Medium',
    keyPoints: ['Hygiene incident', 'Good service recovery'],
    keywords: ['hygiene', 'pastry', 'recovery'],
    themes: ['food safety', 'service quality'],
    status: 'resolved',
    ownerReply: 'Thank you for flagging this — we retrained the pastry station on handling and plating. Your next croissant is on us!',
    internalNote: 'Verified with pastry lead; new glove protocol in place.',
    daysAgo: 18,
  },
  {
    text: 'Parking is a nightmare at lunch. I circle the block and sometimes just give up and drive past.',
    category: 'User Experience',
    rating: 2,
    sentiment: 'Negative',
    urgency: 'Medium',
    satisfactionEstimate: 3,
    fixableProblem: true,
    concreteIssue: 'No convenient parking during lunch peak',
    retentionRisk: 'Medium',
    keyPoints: ['Parking access problem'],
    keywords: ['parking', 'lunch', 'access'],
    themes: ['location access'],
    daysAgo: 19,
  },
  {
    text: 'Subscription coffee plan is fantastic value — unlimited drip for a flat monthly price. Genius move.',
    category: 'Pricing',
    rating: 5,
    sentiment: 'Positive',
    urgency: 'Low',
    satisfactionEstimate: 5,
    fixableProblem: false,
    retentionRisk: 'Low',
    keyPoints: ['Subscription plan praised'],
    keywords: ['subscription', 'value', 'drip'],
    themes: ['pricing', 'loyalty program'],
    daysAgo: 20,
  },
  {
    text: 'App push notifications are excessive — three promos a day is spam. Let me opt down, not just out.',
    category: 'Features',
    rating: 2,
    sentiment: 'Negative',
    urgency: 'Low',
    satisfactionEstimate: 3,
    fixableProblem: true,
    concreteIssue: 'Too many promotional push notifications, no frequency control',
    retentionRisk: 'Medium',
    keyPoints: ['Notification fatigue'],
    keywords: ['app', 'notifications', 'spam'],
    themes: ['mobile app'],
    daysAgo: 21,
  },
  {
    text: 'Barista upsold me pastries I did not want and it felt pushy. Train staff to read the room.',
    category: 'Customer Service',
    rating: 2,
    sentiment: 'Negative',
    urgency: 'Low',
    satisfactionEstimate: 2,
    fixableProblem: true,
    concreteIssue: 'Pushy upselling at the counter',
    retentionRisk: 'Medium',
    keyPoints: ['Upsell pressure complaint'],
    keywords: ['upsell', 'pushy', 'counter'],
    themes: ['service quality'],
    daysAgo: 22,
  },
  {
    text: 'Everything was great — fast service, perfect flat white, cozy corner seat. This is my third visit this week!',
    category: 'User Experience',
    rating: 5,
    sentiment: 'Positive',
    urgency: 'Low',
    satisfactionEstimate: 5,
    fixableProblem: false,
    retentionRisk: 'Low',
    keyPoints: ['Repeat customer', 'All-round great visit'],
    keywords: ['flat white', 'fast', 'cozy'],
    themes: ['drink quality', 'ambiance'],
    daysAgo: 24,
    verified: true,
  },
];

const SEED_INSIGHTS = [
  {
    title: 'Cut morning-rush wait times',
    reason: 'Multiple high-urgency reports of 20+ minute waits during the morning rush, a top churn driver.',
    action: 'Add a second barista on the 7–10am shift and open a dedicated mobile-order pickup lane.',
    priority: 9,
  },
  {
    title: 'Fix mobile order double-charge bug',
    reason: 'Customers report duplicate charges on order-ahead with slow refunds — direct revenue-trust risk.',
    action: 'Hotfix the payment idempotency key in the order-ahead flow and proactively refund affected orders.',
    priority: 9,
  },
  {
    title: 'Review latte pricing vs competitors',
    reason: 'Recurring price-sensitivity and churn mentions after the latest hike, including oat-milk upcharge stacking.',
    action: 'Benchmark against the two nearest competitors and test bundling milk alternatives into base price.',
    priority: 7,
  },
  {
    title: 'Stabilize guest WiFi for remote workers',
    reason: 'Remote workers cite dropping WiFi as a reason to choose other cafes for long stays.',
    action: 'Upgrade the access point and add a separate guest SSID with per-client bandwidth limits.',
    priority: 6,
  },
];

async function main(): Promise<void> {
  // 1. User (create with Better-Auth credential account if missing).
  let user = await prisma.user.findUnique({ where: { email: seedEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: seedEmail,
        name: seedName,
        emailVerified: true,
        hasOrganization: true,
      },
    });
    console.log(`Created user ${seedEmail}`);
  }
  // Better-Auth 1.7 credential account: providerId "credential",
  // accountId = user.id, issuer "local:credential". Only add when the
  // user has no credential account yet — never overwrite an existing one.
  const existingAccount = await prisma.account.findFirst({
    where: { userId: user.id, providerId: 'credential' },
  });
  if (!existingAccount) {
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        issuer: 'local:credential',
        password: await hashPassword(seedPassword),
      },
    });
    console.log(`Set login password for ${seedEmail}`);
  }

  // 2. Organization (force Pro plan on update so re-runs upgrade).
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-coffee' },
    update: {
      currentPlan: 'pro',
      subscriptionStatus: 'active',
      stripeCustomerId: 'cus_seed_demo',
      stripeSubscriptionId: 'sub_seed_demo_pro',
      stripePriceId: 'price_seed_pro',
      stripeCurrentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
    create: {
      name: 'Demo Coffee Co.',
      slug: 'demo-coffee',
      businessType: 'Cafe',
      businessDescription: 'A neighborhood specialty coffee shop.',
      categories: CATEGORIES,
      currentPlan: 'pro',
      subscriptionStatus: 'active',
      stripeCustomerId: 'cus_seed_demo',
      stripeSubscriptionId: 'sub_seed_demo_pro',
      stripePriceId: 'price_seed_pro',
      stripeCurrentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
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

  // Keep the User plan-mirror fields in sync with the Pro org — parts of the
  // server (e.g. auth's requireMember payload) read these off the User row.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      hasOrganization: true,
      currentPlan: 'pro',
      subscriptionStatus: 'active',
    },
  });

  // 3. Local Pro subscription mirror (no Stripe calls).
  await prisma.subscription.upsert({
    where: { organizationId: organization.id },
    update: {
      stripeCustomerId: 'cus_seed_demo',
      stripeSubscriptionId: 'sub_seed_demo_pro',
      stripePriceId: 'price_seed_pro',
      stripeCurrentPeriodEnd: periodEnd,
      status: 'active',
      cancelAtPeriodEnd: false,
    },
    create: {
      organizationId: organization.id,
      stripeCustomerId: 'cus_seed_demo',
      stripeSubscriptionId: 'sub_seed_demo_pro',
      stripePriceId: 'price_seed_pro',
      stripeCurrentPeriodEnd: periodEnd,
      status: 'active',
      cancelAtPeriodEnd: false,
    },
  });

  // 4. Feedbacks (top up to full set; never duplicate by text).
  const existingTexts = new Set(
    (
      await prisma.feedback.findMany({
        where: { organizationId: organization.id },
        select: { text: true },
      })
    ).map((f) => f.text),
  );
  const missing = SEED_FEEDBACKS.filter((f) => !existingTexts.has(f.text));
  if (missing.length > 0) {
    await prisma.feedback.createMany({
      data: missing.map((f, i) => ({
        organizationId: organization.id,
        text: f.text,
        category: f.category,
        rating: f.rating,
        sentiment: f.sentiment,
        urgency: f.urgency,
        satisfactionEstimate: f.satisfactionEstimate,
        fixableProblem: f.fixableProblem,
        concreteIssue: f.concreteIssue ?? null,
        retentionRisk: f.retentionRisk,
        keyPoints: [...f.keyPoints],
        keywords: [...f.keywords],
        themes: [...f.themes],
        status: f.status ?? 'open',
        verified: f.verified ?? false,
        verificationSource: f.verified ? 'qr-pos' : null,
        ownerReply: f.ownerReply ?? null,
        internalNote: f.internalNote ?? null,
        resolvedAt: f.status === 'resolved' ? new Date() : null,
        confidence: 0.9,
        createdAt: new Date(Date.now() - f.daysAgo * 24 * 60 * 60 * 1000 - ((i * 37) % 12) * 60 * 60 * 1000),
      })),
    });
    console.log(`Added ${missing.length} feedbacks`);
  }

  // 5. Insights (top up by title).
  const existingTitles = new Set(
    (
      await prisma.insight.findMany({
        where: { organizationId: organization.id },
        select: { title: true },
      })
    ).map((ins) => ins.title),
  );
  const missingInsights = SEED_INSIGHTS.filter((ins) => !existingTitles.has(ins.title));
  for (const ins of missingInsights) {
    await prisma.insight.create({
      data: {
        organizationId: organization.id,
        title: ins.title,
        reason: ins.reason,
        action: ins.action,
        priority: ins.priority,
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
      },
    });
  }
  if (missingInsights.length > 0) console.log(`Added ${missingInsights.length} insights`);

  const [feedbackCount, insightCount] = await Promise.all([
    prisma.feedback.count({ where: { organizationId: organization.id } }),
    prisma.insight.count({ where: { organizationId: organization.id } }),
  ]);
  console.log(
    `Seeded org "demo-coffee" (plan=pro, status=active) for ${seedEmail} — ${feedbackCount} feedbacks, ${insightCount} insights.`,
  );
}

await main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
