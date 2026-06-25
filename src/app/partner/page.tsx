import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/infra/auth/auth";
import {
  partnerRepo,
  partnerService,
  programRepo,
  userRepo,
} from "@/infra/composition";
import { AccountStatus, Role } from "@/domain";
import { logoutAction } from "@/app/actions/auth";

export default async function PartnerDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/partner");

  const user = await userRepo.findById(session.user.id);
  if (!user) redirect("/login");

  const partner = await partnerRepo.findByUserId(user.id);
  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-950">
        <div className="mx-auto max-w-xl rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            No partner account
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your user account isn&apos;t linked to a partner institution.
          </p>
        </div>
      </div>
    );
  }

  const actor = {
    userId: user.id,
    roles: new Set([Role.PARTNER]),
    accountStatus: AccountStatus.ACTIVE,
    profileComplete: true,
    locale: "en",
  };
  const [apps, report, programs] = await Promise.all([
    partnerService.listOwnApplications(partner.id, actor),
    partnerService.performanceReport(partner.id, actor),
    programRepo.listByPartner(partner.id),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            Dalinus Travels
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              Partner
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
            <form action={logoutAction}>
              <button type="submit" className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {partner.institutionName}
        </h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <Stat label="Programs" value={programs.length} />
          {report.ok && (
            <>
              <Stat label="Attributed leads" value={report.value.leadCount} />
              <Stat label="Applications" value={report.value.applicationCount} />
              <Stat label="Accepted" value={report.value.conversionCount} />
            </>
          )}
        </div>

        <h2 className="mt-10 text-lg font-semibold text-gray-900 dark:text-white">Programs</h2>
        <table className="mt-3 w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-left text-sm dark:border-gray-800 dark:bg-gray-900">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600 dark:bg-gray-950 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Field</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {programs.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.title}</td>
                <td className="px-4 py-3">{p.fieldOfStudy}</td>
                <td className="px-4 py-3">{p.status}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
            {programs.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">No programs yet. Contact an admin to add one.</td></tr>
            )}
          </tbody>
        </table>

        <h2 className="mt-10 text-lg font-semibold text-gray-900 dark:text-white">Applications</h2>
        {apps.ok ? (
          <table className="mt-3 w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-left text-sm dark:border-gray-800 dark:bg-gray-900">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600 dark:bg-gray-950 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {apps.value.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-mono text-xs">{a.studentId.slice(0, 8)}…</td>
                  <td className="px-4 py-3 font-mono text-xs">{a.programId.slice(0, 8)}…</td>
                  <td className="px-4 py-3">{a.status}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{a.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
              {apps.value.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">No applications yet.</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <p className="mt-3 text-sm text-red-600">{apps.error.message}</p>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{value}</p>
      <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
    </div>
  );
}
