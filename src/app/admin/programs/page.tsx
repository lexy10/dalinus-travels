import { requireAdminUser } from "../_guard";
import { AdminShell, Card, PageHeader, StatusPill } from "@/ui/AdminShell";
import { FormField, FormSelect, FormTextarea } from "../destinations/page";
import { IconPlus } from "@/ui/icons";
import { destinationRepo, partnerRepo, programRepo } from "@/infra/composition";
import { createProgramAction, deleteProgramAction } from "@/app/actions/admin";

export default async function AdminProgramsPage() {
  const user = await requireAdminUser();
  const [studyD, partners] = await Promise.all([
    destinationRepo.listByKind("study"),
    partnerRepo.list({ offset: 0, limit: 200 }),
  ]);
  const programs = (
    await Promise.all(partners.map((p) => programRepo.listByPartner(p.id)))
  ).flat();

  return (
    <AdminShell userEmail={user.email} active="programs">
      <PageHeader
        breadcrumb="Catalog"
        title="Programs"
        subtitle={`${programs.length} programs across ${partners.length} partner institutions.`}
      />

      <Card title="Create a program" description="Programs must be tied to a partner and a study destination.">
        <form action={createProgramAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormSelect
            name="partnerId"
            label="Partner"
            required
            options={partners.map((p) => ({ value: p.id, label: p.institutionName }))}
          />
          <FormSelect
            name="destinationId"
            label="Destination"
            required
            options={studyD.map((d) => ({ value: d.id, label: d.name }))}
          />
          <FormSelect
            name="studyLevel"
            label="Study level"
            required
            options={["Bachelor's", "Master's", "Doctorate", "Diploma"].map((v) => ({
              value: v,
              label: v,
            }))}
          />
          <FormField name="title" label="Program title" required />
          <FormField name="institutionName" label="Institution name" required />
          <FormField name="fieldOfStudy" label="Field of study" required />
          <FormField name="durationMonths" label="Duration (months)" type="number" required />
          <FormField name="tuitionUsd" label="Tuition (USD/year)" type="number" required />
          <FormField name="intakeDates" label="Intake dates (comma-separated YYYY-MM-DD)" />
          <FormField name="applicationDeadline" label="Application deadline" type="date" />
          <FormSelect
            name="deliveryMode"
            label="Delivery mode"
            defaultValue="on_campus"
            options={[
              { value: "on_campus", label: "On campus" },
              { value: "online", label: "Online" },
            ]}
          />
          <FormSelect
            name="status"
            label="Status"
            defaultValue="published"
            options={[
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
            ]}
          />
          <FormTextarea name="entryRequirements" label="Entry requirements" />
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <IconPlus className="h-4 w-4" /> Create program
            </button>
          </div>
        </form>
      </Card>

      <div className="mt-6">
        <Card title="All programs" padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Institution</th>
                  <th className="px-5 py-3">Field</th>
                  <th className="px-5 py-3">Level</th>
                  <th className="px-5 py-3">Tuition</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {programs.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{p.title}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{p.institutionName}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{p.fieldOfStudy}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{p.studyLevel}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                      ${(p.tuitionMinor / 100).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill
                        label={p.status}
                        tone={p.status === "published" ? "emerald" : "slate"}
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <form
                        action={async () => {
                          "use server";
                          await deleteProgramAction(p.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs font-medium text-rose-600 hover:text-rose-500"
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {programs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      No programs yet. Create a partner first, then add programs.
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
