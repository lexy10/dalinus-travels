import { redirect } from "next/navigation";
import { auth } from "@/infra/auth/auth";
import { DashboardShell } from "@/ui/DashboardShell";
import { userRepo } from "@/infra/composition";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await userRepo.findById(session.user.id);

  return (
    <DashboardShell userEmail={session.user.email ?? ""} active="profile">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email" value={user?.email ?? "—"} />
        <Field
          label="Email verified"
          value={user?.emailVerifiedAt ? user.emailVerifiedAt.toLocaleString() : "Not verified"}
        />
        <Field label="Roles" value={user?.roles.join(", ") ?? "—"} />
        <Field label="Account status" value={user?.accountStatus ?? "—"} />
        <Field
          label="Profile complete"
          value={user?.profileComplete ? "Yes" : "No"}
        />
        <Field
          label="In-app notifications"
          value={user?.inAppNotificationsEnabled ? "Enabled" : "Disabled"}
        />
        <Field
          label="Member since"
          value={user?.createdAt ? user.createdAt.toLocaleDateString() : "—"}
        />
      </dl>

      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
        Profile editing UI coming soon. Email
        <a href="mailto:hello@dalinus.travel" className="ml-1 underline">
          hello@dalinus.travel
        </a>{" "}
        to update your details for now.
      </div>
    </DashboardShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{value}</dd>
    </div>
  );
}
