import { requireAdminUser } from "../_guard";
import { AdminShell, Card, PageHeader, StatusPill } from "@/ui/AdminShell";
import { recruiterRepo } from "@/infra/composition";
import { approveRecruiterAction, rejectRecruiterAction } from "@/app/actions/admin";

function tone(status: string): "emerald" | "amber" | "rose" | "slate" {
  if (status === "active") return "emerald";
  if (status === "pending") return "amber";
  if (status === "rejected") return "rose";
  return "slate";
}

export default async function AdminRecruitersPage() {
  const user = await requireAdminUser();
  const recruiters = await recruiterRepo.list();
  const pending = recruiters.filter((r) => r.status === "pending").length;

  return (
    <AdminShell userEmail={user.email} active="recruiters">
      <PageHeader
        breadcrumb="People"
        title="Recruiters"
        subtitle={`${recruiters.length} recruiters · ${pending} pending approval.`}
      />
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Applied</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recruiters.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    {r.companyName}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill label={r.status} tone={tone(r.status)} />
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                    {r.managerRecruiterId ? "Sub-agent" : "Primary"}
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                    {r.appliedAt.toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {r.status === "pending" && (
                      <div className="flex justify-end gap-3">
                        <form
                          action={async () => {
                            "use server";
                            await approveRecruiterAction(r.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-xs font-medium text-emerald-600 hover:text-emerald-500"
                          >
                            Approve
                          </button>
                        </form>
                        <form
                          action={async () => {
                            "use server";
                            await rejectRecruiterAction(r.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-xs font-medium text-rose-600 hover:text-rose-500"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {recruiters.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No recruiter applications yet.
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
