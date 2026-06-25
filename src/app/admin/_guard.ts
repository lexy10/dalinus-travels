import { redirect } from "next/navigation";
import { auth } from "@/infra/auth/auth";
import { userRepo } from "@/infra/composition";
import { Role } from "@/domain";

/**
 * Server-side guard for /admin pages. Redirects:
 *   - to /login if not signed in
 *   - to /dashboard with ?reason=forbidden if signed in but not an admin
 *
 * Returns the resolved user when authorised.
 */
export async function requireAdminUser() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin");

  const user = await userRepo.findById(session.user.id);
  if (!user || !user.roles.includes(Role.ADMINISTRATOR)) {
    redirect("/dashboard?reason=forbidden");
  }
  return user;
}
