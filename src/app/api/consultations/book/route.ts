import { NextResponse } from "next/server";
import { auth } from "@/infra/auth/auth";
import { consultationService } from "@/infra/composition";

export async function POST(request: Request) {
  const session = await auth();
  const formData = await request.formData();
  const slotId = String(formData.get("slotId") ?? "");
  const name = String(formData.get("name") ?? session?.user?.email ?? "");
  const contactMethod = String(formData.get("contactMethod") ?? session?.user?.email ?? "");

  const result = await consultationService.book({
    userId: session?.user?.id ?? null,
    name,
    contactMethod,
    slotId,
  });

  const next = new URL("/dashboard/consultations", request.url);
  next.searchParams.set("booked", result.ok ? "1" : "0");
  if (!result.ok) next.searchParams.set("error", result.error.message);
  return NextResponse.redirect(next, 303);
}
