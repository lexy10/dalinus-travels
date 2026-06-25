"use server";

import { auth } from "@/infra/auth/auth";
import { consultationService } from "@/infra/composition";
import type { FormState } from "./auth";

export async function bookConsultationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth();
  const name = String(formData.get("name") ?? "");
  const contactMethod = String(formData.get("contactMethod") ?? "");
  const slotId = String(formData.get("slotId") ?? "");

  const result = await consultationService.book({
    userId: session?.user?.id ?? null,
    name,
    contactMethod,
    slotId,
  });
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
  return { status: "success", message: "Consultation booked. We'll be in touch." };
}
