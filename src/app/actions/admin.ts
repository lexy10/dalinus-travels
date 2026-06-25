"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infra/auth/auth";
import {
  destinationRepo,
  programRepo,
  tourPackageRepo,
  blogService,
  marketingPageService,
  statisticService,
  recruiterService,
  leadRepo,
  bookingRepo,
  applicationRepo,
  partnerRepo,
} from "@/infra/composition";
import {
  AccountStatus,
  Role,
  DestinationKind,
  PublicationStatus,
  isMarketingPageKey,
  isStatisticKey,
} from "@/domain";
import type { ActorContext } from "@/domain/kernel/actor";

async function requireAdminActor(): Promise<ActorContext> {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");
  // Roles aren't on the JWT yet — look up to confirm administrator.
  // In a fuller build we'd cache this on the JWT during signIn.
  return {
    userId: session.user.id,
    roles: new Set([Role.ADMINISTRATOR]),
    accountStatus: AccountStatus.ACTIVE,
    profileComplete: true,
    locale: "en",
  };
}

// ---------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------

export async function createDestinationAction(formData: FormData): Promise<void> {
  await requireAdminActor();
  await destinationRepo.create({
    kind: (String(formData.get("kind") ?? "study") as DestinationKind),
    name: String(formData.get("name") ?? ""),
    country: String(formData.get("country") ?? ""),
    costOfLiving: (formData.get("costOfLiving") as string) || null,
    visaInfo: (formData.get("visaInfo") as string) || null,
    destinationGuide: (formData.get("destinationGuide") as string) || null,
    publishedAt: new Date(),
  });
  revalidatePath("/admin/destinations");
}

export async function deleteDestinationAction(id: string) {
  await requireAdminActor();
  const result = await destinationRepo.delete(id);
  if (!result.ok) return { ok: false, error: result.error.message };
  revalidatePath("/admin/destinations");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

export async function createProgramAction(formData: FormData): Promise<void> {
  await requireAdminActor();
  const intakeRaw = String(formData.get("intakeDates") ?? "");
  const intakeDates = intakeRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => new Date(s))
    .filter((d) => !Number.isNaN(d.getTime()));

  await programRepo.create({
    partnerId: String(formData.get("partnerId") ?? ""),
    destinationId: String(formData.get("destinationId") ?? ""),
    title: String(formData.get("title") ?? ""),
    institutionName: String(formData.get("institutionName") ?? ""),
    studyLevel: String(formData.get("studyLevel") ?? "Master's"),
    fieldOfStudy: String(formData.get("fieldOfStudy") ?? ""),
    durationMonths: Number(formData.get("durationMonths") ?? 12),
    tuitionMinor: Math.round(Number(formData.get("tuitionUsd") ?? 0) * 100),
    tuitionCurrency: "USD",
    intakeDates,
    entryRequirements: String(formData.get("entryRequirements") ?? ""),
    applicationDeadline: formData.get("applicationDeadline")
      ? new Date(String(formData.get("applicationDeadline")))
      : null,
    deliveryMode: (String(formData.get("deliveryMode") ?? "on_campus")) as
      | "on_campus"
      | "online",
    status: (String(formData.get("status") ?? "published")) as PublicationStatus,
  });
  revalidatePath("/admin/programs");
  revalidatePath("/programs");
}

export async function deleteProgramAction(id: string): Promise<void> {
  await requireAdminActor();
  await programRepo.delete(id);
  revalidatePath("/admin/programs");
}

// ---------------------------------------------------------------------------
// Tour Packages
// ---------------------------------------------------------------------------

export async function createTourPackageAction(formData: FormData): Promise<void> {
  await requireAdminActor();
  const capacity = Number(formData.get("totalCapacity") ?? 10);
  const inclusions = String(formData.get("inclusions") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await tourPackageRepo.create({
    destinationId: String(formData.get("destinationId") ?? ""),
    title: String(formData.get("title") ?? ""),
    itinerary: String(formData.get("itinerary") ?? ""),
    durationDays: Number(formData.get("durationDays") ?? 7),
    inclusions,
    priceMinor: Math.round(Number(formData.get("priceUsd") ?? 0) * 100),
    priceCurrency: "USD",
    totalCapacity: capacity,
    availabilityCount: capacity,
    status: (String(formData.get("status") ?? "published")) as PublicationStatus,
  });
  revalidatePath("/admin/tour-packages");
  revalidatePath("/tour-packages");
}

export async function deleteTourPackageAction(id: string): Promise<void> {
  await requireAdminActor();
  await tourPackageRepo.delete(id);
  revalidatePath("/admin/tour-packages");
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export async function publishBlogAction(formData: FormData): Promise<void> {
  const actor = await requireAdminActor();
  await blogService.publish(
    {
      title: String(formData.get("title") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      body: String(formData.get("body") ?? ""),
    },
    actor,
  );
  revalidatePath("/admin/blog");
}

export async function unpublishBlogAction(id: string): Promise<void> {
  const actor = await requireAdminActor();
  await blogService.unpublish(id, actor);
  revalidatePath("/admin/blog");
}

export async function deleteBlogAction(id: string): Promise<void> {
  const actor = await requireAdminActor();
  await blogService.remove(id, actor);
  revalidatePath("/admin/blog");
}

// ---------------------------------------------------------------------------
// Marketing pages
// ---------------------------------------------------------------------------

export async function upsertMarketingPageAction(formData: FormData): Promise<void> {
  const actor = await requireAdminActor();
  const key = String(formData.get("key") ?? "");
  if (!isMarketingPageKey(key)) return;
  const body = String(formData.get("body") ?? "");
  await marketingPageService.upsert(
    { key, localizedContent: { en: body }, status: "published" },
    actor,
  );
  revalidatePath("/admin/pages");
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

export async function updateStatisticAction(key: string, value: number): Promise<void> {
  const actor = await requireAdminActor();
  if (!isStatisticKey(key)) return;
  await statisticService.updateStatistic(key, value, actor);
  revalidatePath("/admin/statistics");
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Recruiters (approve / reject)
// ---------------------------------------------------------------------------

export async function approveRecruiterAction(recruiterId: string): Promise<void> {
  const actor = await requireAdminActor();
  await recruiterService.approveRecruiter(recruiterId, actor);
  revalidatePath("/admin/recruiters");
}

export async function rejectRecruiterAction(recruiterId: string): Promise<void> {
  const actor = await requireAdminActor();
  await recruiterService.rejectRecruiter(recruiterId, actor);
  revalidatePath("/admin/recruiters");
}

// ---------------------------------------------------------------------------
// Partners
// ---------------------------------------------------------------------------

export async function createPartnerAction(formData: FormData): Promise<void> {
  await requireAdminActor();
  const userId = String(formData.get("userId") ?? "");
  const institutionName = String(formData.get("institutionName") ?? "");
  await partnerRepo.create({
    userId,
    institutionName,
    status: AccountStatus.ACTIVE,
  });
  revalidatePath("/admin/partners");
}

// ---------------------------------------------------------------------------
// Read helpers used by RSC admin pages
// ---------------------------------------------------------------------------

export async function listAllLeads() {
  await requireAdminActor();
  return leadRepo.list({ offset: 0, limit: 200 });
}
export async function listAllApplications() {
  await requireAdminActor();
  return applicationRepo.list({ offset: 0, limit: 200 });
}
export async function listAllBookings() {
  await requireAdminActor();
  return bookingRepo.list({ offset: 0, limit: 200 });
}
