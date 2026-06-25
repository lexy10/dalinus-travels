"use server";

import { auth } from "@/infra/auth/auth";
import { applicationService } from "@/infra/composition";
import { ApplicationStatus, isApplicationStatus } from "@/domain";
import type { FormState } from "./auth";

export async function submitApplicationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth();
  if (!session?.user) {
    return { status: "error", message: "You must be signed in to apply." };
  }

  const programId = String(formData.get("programId") ?? "");
  const fullName = String(formData.get("fullName") ?? "");
  const email = String(formData.get("email") ?? session.user.email ?? "");
  const phoneNumber = String(formData.get("phoneNumber") ?? "");

  const actor = {
    userId: session.user.id,
    roles: new Set(["STUDENT_TRAVELER" as const]),
    accountStatus: "active" as const,
    profileComplete: true,
    locale: "en",
  };

  const result = await applicationService.submit(
    {
      studentId: session.user.id,
      programId,
      fields: { fullName, email, phoneNumber },
    },
    actor,
  );

  if (!result.ok) {
    if (result.error.kind === "ValidationError") {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.field] = issue.message;
      }
      return { status: "error", message: result.error.message, fieldErrors };
    }
    return { status: "error", message: result.error.message };
  }
  return { status: "success", message: "Application submitted." };
}

export async function setApplicationStatusAction(
  applicationId: string,
  newStatus: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in required." };
  if (!isApplicationStatus(newStatus)) return { ok: false, error: "Invalid status." };

  const actor = {
    userId: session.user.id,
    roles: new Set(["ADMINISTRATOR" as const]),
    accountStatus: "active" as const,
    profileComplete: true,
    locale: "en",
  };

  const result = await applicationService.updateStatus(
    applicationId,
    newStatus as ApplicationStatus,
    actor,
  );
  return result.ok ? { ok: true } : { ok: false, error: result.error.message };
}
