import { NextResponse } from "next/server";
import { assertCronAuthorized } from "../_authorize";
import { applicationService, notificationService } from "@/infra/composition";

const DEFAULT_WINDOW_DAYS = 14;

export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const windowDays = Math.max(
    0,
    Math.min(90, Number(url.searchParams.get("window") ?? DEFAULT_WINDOW_DAYS)),
  );

  const candidates = await applicationService.selectDeadlineReminders(windowDays, new Date());

  for (const c of candidates) {
    await notificationService.enqueue({
      userId: c.application.studentId,
      channel: "email",
      type: "application_deadline_reminder",
      payload: {
        applicationId: c.application.id,
        programId: c.program.id,
        programTitle: c.program.title,
        deadline: c.program.applicationDeadline?.toISOString() ?? null,
      },
      recipientEmail: "",
    });
  }

  return NextResponse.json({ ok: true, scheduled: candidates.length, windowDays });
}
