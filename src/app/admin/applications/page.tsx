import { requireAdminUser } from "../_guard";
import { AdminShell, Card, PageHeader, StatusPill } from "@/ui/AdminShell";
import { applicationRepo } from "@/infra/composition";

function tone(status: string): "emerald" | "indigo" | "amber" | "rose" | "slate" {
  if (status === "Accepted") return "emerald";
  if (status === "Rejected" || status === "Withdrawn") return "rose";
  if (status === "Submitted") return "indigo";
  if (status === "UnderReview") return "amber";
  return "slate";
}

export default async function AdminApplicationsPage() {
  const user = await requireAdminUser();
  const apps = await applicationRepo.list({ offset: 0, limit: 500 });

  return (
    <AdminShell userEmail={user.email} active="applications">
      <PageHeader
        breadcrumb="Activity"
        title="All Applications"
        subtitle={`${apps.length} application${apps.length === 1 ? "" : "s"} across all students and programs.`}
      />
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Program</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {apps.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {a.studentId.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {a.programId.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill label={a.status} tone={tone(a.status)} />
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                    {a.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                    {a.statusUpdatedAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No applications yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminShell>
  );
}
