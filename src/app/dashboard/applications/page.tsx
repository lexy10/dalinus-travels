import { redirect } from "next/navigation";
import { auth } from "@/infra/auth/auth";
import { DashboardShell } from "@/ui/DashboardShell";
import { applicationService } from "@/infra/composition";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const apps = await applicationService.listByStudent(session.user.id);

  return (
    <DashboardShell userEmail={session.user.email ?? ""} active="applications">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Applications</h1>
        <a
          href="/programs"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Browse programs →
        </a>
      </div>

      {apps.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-base font-medium text-gray-900 dark:text-white">
            No applications yet
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Browse our program catalog and submit your first application.
          </p>
          <a
            href="/programs"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Browse programs
          </a>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {apps.map(({ application, programDeadline }) => (
                <tr key={application.id}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                    {application.programId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {application.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {application.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {programDeadline ? programDeadline.toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
