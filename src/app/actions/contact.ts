"use server";

import { leadService } from "@/infra/composition";
import type { FormState } from "./auth";

export async function submitContactAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const message = String(formData.get("message") ?? "");

  const result = await leadService.submitContact({ name, email, message });
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
  return {
    status: "success",
    message: "Thanks! We received your message and will reply soon.",
  };
}
