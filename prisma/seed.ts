/**
 * Seed script — creates three demo users:
 *   1. admin@dalinus.travel          (ADMINISTRATOR)
 *   2. traveler@dalinus.travel       (STUDENT_TRAVELER — travel-focused demo data)
 *   3. student@dalinus.travel        (STUDENT_TRAVELER — education-focused demo data)
 *
 * Also seeds a handful of supporting catalog data (destinations, programs,
 * tour packages) so the dashboards have something to render.
 *
 * Run with: `npx tsx prisma/seed.ts` (or `npm run db:seed` once the script is wired).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Password123!";

async function ensureUser(opts: {
  email: string;
  password: string;
  roles: string[];
  profileComplete?: boolean;
}) {
  const passwordHash = await bcrypt.hash(opts.password, 12);
  const user = await prisma.user.upsert({
    where: { email: opts.email.toLowerCase() },
    update: { roles: opts.roles, profileComplete: opts.profileComplete ?? true },
    create: {
      email: opts.email.toLowerCase(),
      passwordHash,
      roles: opts.roles,
      accountStatus: "active",
      profileComplete: opts.profileComplete ?? true,
      emailVerifiedAt: new Date(),
    },
  });
  return user;
}

async function ensureDestination(opts: {
  kind: "study" | "travel";
  name: string;
  country: string;
  costOfLiving?: string | null;
  visaInfo?: string | null;
  destinationGuide?: string | null;
}) {
  // No natural unique constraint on (kind, name); use findFirst + create
  const existing = await prisma.destination.findFirst({
    where: { kind: opts.kind, name: opts.name },
  });
  if (existing) return existing;
  return prisma.destination.create({
    data: {
      kind: opts.kind,
      name: opts.name,
      country: opts.country,
      costOfLiving: opts.costOfLiving ?? null,
      visaInfo: opts.visaInfo ?? null,
      destinationGuide: opts.destinationGuide ?? null,
      publishedAt: new Date(),
    },
  });
}

async function main() {
  console.log("Seeding users…");
  const admin = await ensureUser({
    email: "admin@dalinus.travel",
    password: DEFAULT_PASSWORD,
    roles: ["ADMINISTRATOR", "STUDENT_TRAVELER"],
  });
  const traveler = await ensureUser({
    email: "traveler@dalinus.travel",
    password: DEFAULT_PASSWORD,
    roles: ["STUDENT_TRAVELER"],
  });
  const student = await ensureUser({
    email: "student@dalinus.travel",
    password: DEFAULT_PASSWORD,
    roles: ["STUDENT_TRAVELER"],
  });

  console.log("Seeding destinations…");
  const uk = await ensureDestination({
    kind: "study",
    name: "United Kingdom",
    country: "United Kingdom",
    costOfLiving: "$1,200 – $1,800 / month",
    visaInfo: "Student Visa (Tier 4); biometric residence permit issued on arrival.",
  });
  const canada = await ensureDestination({
    kind: "study",
    name: "Canada",
    country: "Canada",
    costOfLiving: "$1,000 – $1,500 / month",
    visaInfo: "Study Permit + Provincial Attestation Letter required.",
  });
  const italy = await ensureDestination({
    kind: "travel",
    name: "Italy",
    country: "Italy",
    destinationGuide: "Rome, Florence, Cinque Terre, Amalfi coast.",
  });
  const japan = await ensureDestination({
    kind: "travel",
    name: "Japan",
    country: "Japan",
    destinationGuide: "Tokyo, Kyoto, Osaka; best in cherry-blossom season.",
  });

  console.log("Seeding a partner + a program…");
  const partner = await prisma.partner.upsert({
    where: { userId: admin.id },
    update: { institutionName: "Demo University" },
    create: {
      userId: admin.id,
      institutionName: "Demo University",
      status: "active",
    },
  });
  const program = await prisma.program.findFirst({
    where: { partnerId: partner.id, title: "MSc Computer Science" },
  });
  if (!program) {
    await prisma.program.create({
      data: {
        partnerId: partner.id,
        destinationId: uk.id,
        title: "MSc Computer Science",
        institutionName: "University of Manchester",
        studyLevel: "Master's",
        fieldOfStudy: "Computer Science",
        durationMonths: 12,
        tuitionMinor: 28_000_00,
        tuitionCurrency: "USD",
        intakeDates: [new Date("2026-09-15")],
        entryRequirements: "Bachelor's degree in CS or related field.",
        applicationDeadline: new Date("2026-06-30"),
        deliveryMode: "on_campus",
        status: "published",
      },
    });
  }
  // Reference canada too so the seed exercises both destinations
  if (
    (await prisma.program.count({ where: { destinationId: canada.id } })) === 0
  ) {
    await prisma.program.create({
      data: {
        partnerId: partner.id,
        destinationId: canada.id,
        title: "MBA International Business",
        institutionName: "University of Toronto",
        studyLevel: "Master's",
        fieldOfStudy: "Business",
        durationMonths: 24,
        tuitionMinor: 45_000_00,
        tuitionCurrency: "USD",
        intakeDates: [new Date("2026-09-01")],
        entryRequirements: "Bachelor's degree + 3 years work experience.",
        applicationDeadline: new Date("2026-04-30"),
        deliveryMode: "on_campus",
        status: "published",
      },
    });
  }

  console.log("Seeding tour packages…");
  if (
    (await prisma.tourPackage.count({ where: { destinationId: italy.id } })) === 0
  ) {
    await prisma.tourPackage.create({
      data: {
        destinationId: italy.id,
        title: "Italian Coastal Drive",
        itinerary: "Rome → Florence → Cinque Terre → Amalfi (9 days)",
        durationDays: 9,
        inclusions: ["Accommodation", "Daily breakfast", "Rental car", "Wine tasting"],
        priceMinor: 2_750_00,
        priceCurrency: "USD",
        totalCapacity: 12,
        availabilityCount: 10,
        status: "published",
      },
    });
  }
  if (
    (await prisma.tourPackage.count({ where: { destinationId: japan.id } })) === 0
  ) {
    await prisma.tourPackage.create({
      data: {
        destinationId: japan.id,
        title: "Japan Cherry Blossom",
        itinerary: "Tokyo → Kyoto → Osaka (11 days)",
        durationDays: 11,
        inclusions: ["Accommodation", "JR Pass", "Tea ceremony", "Selected dinners"],
        priceMinor: 3_900_00,
        priceCurrency: "USD",
        totalCapacity: 8,
        availabilityCount: 6,
        status: "published",
      },
    });
  }

  console.log("Seeding statistics + a marketing page…");
  await prisma.statistic.upsert({
    where: { key: "program_count" },
    update: { value: 500 },
    create: { key: "program_count", valueType: "count", value: 500 },
  });
  await prisma.statistic.upsert({
    where: { key: "visa_success_rate" },
    update: { value: 98 },
    create: { key: "visa_success_rate", valueType: "rate", value: 98 },
  });
  await prisma.statistic.upsert({
    where: { key: "student_satisfaction_rate" },
    update: { value: 95 },
    create: { key: "student_satisfaction_rate", valueType: "rate", value: 95 },
  });
  await prisma.marketingPage.upsert({
    where: { key: "about" },
    update: {
      localizedContent: { en: "Dalinus Travels — international education and travel, in one place." },
    },
    create: {
      key: "about",
      localizedContent: { en: "Dalinus Travels — international education and travel, in one place." },
      status: "published",
    },
  });

  console.log("\nSeed complete. Demo credentials:");
  console.log(`  ADMIN     admin@dalinus.travel    / ${DEFAULT_PASSWORD}`);
  console.log(`  TRAVELER  traveler@dalinus.travel / ${DEFAULT_PASSWORD}`);
  console.log(`  STUDENT   student@dalinus.travel  / ${DEFAULT_PASSWORD}`);
  console.log(`  Users: ${admin.email}, ${traveler.email}, ${student.email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
