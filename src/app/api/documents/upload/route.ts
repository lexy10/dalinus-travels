import { NextResponse } from "next/server";
import { auth } from "@/infra/auth/auth";
import { documentService } from "@/infra/composition";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const actor = {
    userId: session.user.id,
    roles: new Set(["STUDENT_TRAVELER" as const]),
    accountStatus: "active" as const,
    profileComplete: true,
    locale: "en",
  };

  const result = await documentService.upload(
    {
      ownerId: session.user.id,
      filename: file.name,
      bytes,
    },
    actor,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  // Redirect back to the documents page after a successful POST
  const url = new URL(request.url);
  url.pathname = "/dashboard/documents";
  return NextResponse.redirect(url, 303);
}
