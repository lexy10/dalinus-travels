import { requireAdminUser } from "../_guard";
import { AdminShell, Card, PageHeader, StatusPill } from "@/ui/AdminShell";
import { FormField } from "../destinations/page";
import { IconPlus } from "@/ui/icons";
import { partnerRepo } from "@/infra/composition";
import { createPartnerAction } from "@/app/actions/admin";

export default async function AdminPartnersPage() {
  const user = await requireAdminUser();
  const partners = await partnerRepo.list({ offset: 0, limit: 200 });

  return (
    <AdminShell userEmail={user.email} active="partners">
      <PageHeader
        breadcrumb="People"
        title="Partner Institutions"
        subtitle={`${partners.length} partner${partners.length === 1 ? "" : "s"}.`}
      />

      <Card
        title="Link an existing user as a partner"
        description="Create a user account first, then enter its id and the institution name below."
      >
        <form action={createPartnerAction} className="grid gap-4 sm:grid-cols-2">
          <FormField name="userId" label="User ID" required />
          <FormField name="institutionName" label="Institution name" required />
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <IconPlus className="h-4 w-4" /> Create partner
            </button>
          </div>
        </form>
      </Card>

      <div className="mt-6">
        <Card title="All partners" padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Institution</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {partners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                      {p.institutionName}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill
                        label={p.status}
                        tone={p.status === "active" ? "emerald" : "slate"}
                      />
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                      {p.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {partners.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      No partners yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
