import { requireAdminUser } from "../_guard";
import { AdminShell, Card, PageHeader, StatusPill } from "@/ui/AdminShell";
import { leadRepo } from "@/infra/composition";

function tone(status: string): "emerald" | "indigo" | "amber" | "rose" | "slate" {
  if (status === "converted") return "emerald";
  if (status === "contacted") return "indigo";
  return "amber"; // new
}

export default async function AdminLeadsPage() {
  const user = await requireAdminUser();
  const leads = await leadRepo.list({ offset: 0, limit: 500 });

  return (
    <AdminShell userEmail={user.email} active="leads">
      <PageHeader breadcrumb="Activity" title="Leads" subtitle={`${leads.length} captured leads.`} />
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{l.name}</td>
                  <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{l.email}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{l.source}</td>
                  <td className="px-5 py-3">
                    <StatusPill label={l.status} tone={tone(l.status)} />
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                    {l.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No leads yet.
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
