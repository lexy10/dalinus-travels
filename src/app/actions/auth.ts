"use server";

/**
 * Auth server actions.
 *
 * Thin adapters over the framework-agnostic AuthService. Each action takes a
 * `FormData` (so it can be wired directly to a <form action={...}> in an RSC
 * page) and returns a serialisable result the page can render.
 */
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { authService } from "@/infra/composition";
import { signIn, signOut } from "@/infra/auth/auth";
import { isValidationError, DomainErrorKind } from "@/domain/kernel";

export interface FormState {
  readonly status: "idle" | "success" | "error";
  readonly message?: string;
  readonly fieldErrors?: Readonly<Record<string, string>>;
}

const idle: FormState = { status: "idle" };

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const result = await authService.register({ email, password });

  if (!result.ok) {
    if (isValidationError(result.error)) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.field] = issue.message;
      }
      return {
        status: "error",
        message: result.error.message,
        fieldErrors,
      };
    }
    if (result.error.kind === DomainErrorKind.Conflict) {
      return {
        status: "error",
        message: result.error.message,
        fieldErrors: { email: result.error.message },
      };
    }
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  return { status: "success", message: "Account created. Check your email to verify." };
}

// ---------------------------------------------------------------------------
// Login (via Auth.js Credentials)
// ---------------------------------------------------------------------------

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        status: "error",
        message: "Invalid email or password.",
      };
    }
    // Re-throw NEXT_REDIRECT so the redirect actually happens
    throw error;
  }
  // Unreachable — signIn throws a redirect on success
  return idle;
}

// ---------------------------------------------------------------------------
// Google login
// ---------------------------------------------------------------------------

export async function googleLoginAction(): Promise<never> {
  await signIn("google", { redirectTo: "/dashboard" });
  // Unreachable
  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

// ---------------------------------------------------------------------------
// Forgot password
// ---------------------------------------------------------------------------

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const result = await authService.requestPasswordReset(email);
  if (!result.ok) {
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }
  return { status: "success", message: result.value.message };
}
