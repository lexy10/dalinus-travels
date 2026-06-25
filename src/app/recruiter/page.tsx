import { redirect } from "next/navigation";
import { auth } from "@/infra/auth/auth";
import {
  recruiterRepo,
  recruiterService,
  userRepo,
} from "@/infra/composition";
import { AccountStatus, Role } from "@/domain";
import { logoutAction } from "@/app/actions/auth";
import Link from "next/link";

export default async function RecruiterDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/recruiter");

  const user = await userRepo.findById(session.user.id);
  if (!user) redirect("/login");

  const recruiter = await recruiterRepo.findByUserId(user.id);
  if (!recruiter) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-950">
        <div className="mx-auto max-w-xl rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            No recruiter account
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your user account isn&apos;t linked to a recruiter profile. Contact an administrator
            or apply through our team.
          </p>
        </div>
      </div>
    );
  }

  if (recruiter.status === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-950">
        <div className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900/40 dark:bg-amber-900/20">
          <h1 className="text-xl font-semibold text-amber-900 dark:text-amber-200">
            Account pending approval
          </h1>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
            We&apos;re reviewing your recruiter application. You&apos;ll get an email as soon as
            we make a decision.
          </p>
        </div>
      </div>
    );
  }

  const actor = {
    userId: user.id,
    roles: new Set([Role.RECRUITER]),
    accountStatus: AccountStatus.ACTIVE,
    profileComplete: true,
    locale: "en",
  };
  const scoped = await recruiterService.listScopedData(recruiter.id, actor);
  const subAgents = await recruiterRepo.listSubAgents(recruiter.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            Dalinus Travels
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Recruiter
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
          {recruiter.companyName}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Approved recruiter · {subAgents.length} sub-agent(s)
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Attributed leads" value={scoped.ok ? scoped.value.leads.length : 0} />
          <Stat label="Attributed applications" value={scoped.ok ? scoped.value.applications.length : 0} />
          <Stat label="Sub-agents" value={subAgents.length} />
        </div>

        {scoped.ok && (
          <>
            <h2 className="mt-10 text-lg font-semibold text-gray-900 dark:text-white">My Leads</h2>
            <table className="mt-3 w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-left text-sm dark:border-gray-800 dark:bg-gray-900">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600 dark:bg-gray-950 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {scoped.value.leads.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3">{l.name}</td>
                    <td className="px-4 py-3">{l.email}</td>
                    <td className="px-4 py-3">{l.status}</td>
                  </tr>
                ))}
                {scoped.value.leads.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">No leads attributed yet.</td></tr>
                )}
              </tbody>
            </table>

            <h2 className="mt-10 text-lg font-semibold text-gray-900 dark:text-white">My Applications</h2>
            <table className="mt-3 w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-left text-sm dark:border-gray-800 dark:bg-gray-900">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600 dark:bg-gray-950 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {scoped.value.applications.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-mono text-xs">{a.studentId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-mono text-xs">{a.programId.slice(0, 8)}…</td>
                    <td className="px-4 py-3">{a.status}</td>
                  </tr>
                ))}
                {scoped.value.applications.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">No applications attributed yet.</td></tr>
                )}
              </tbody>
            </table>
          </>
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
