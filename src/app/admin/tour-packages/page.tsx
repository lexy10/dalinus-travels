import { requireAdminUser } from "../_guard";
import { AdminShell, Card, PageHeader, StatusPill } from "@/ui/AdminShell";
import { FormField, FormSelect, FormTextarea } from "../destinations/page";
import { IconPlus } from "@/ui/icons";
import { destinationRepo, tourPackageRepo } from "@/infra/composition";
import { createTourPackageAction, deleteTourPackageAction } from "@/app/actions/admin";

export default async function AdminToursPage() {
  const user = await requireAdminUser();
  const travelD = await destinationRepo.listByKind("travel");
  const tours = (
    await Promise.all(travelD.map((d) => tourPackageRepo.listByDestination(d.id)))
  ).flat();

  return (
    <AdminShell userEmail={user.email} active="tour-packages">
      <PageHeader
        breadcrumb="Catalog"
        title="Tour Packages"
        subtitle={`${tours.length} tour packages across ${travelD.length} travel destinations.`}
      />

      <Card title="Create a tour package">
        <form
          action={createTourPackageAction}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <FormSelect
            name="destinationId"
            label="Destination"
            required
            options={travelD.map((d) => ({ value: d.id, label: d.name }))}
          />
          <FormField name="title" label="Title" required />
          <FormSelect
            name="status"
            label="Status"
            defaultValue="published"
            options={[
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
            ]}
          />
          <FormField name="durationDays" label="Duration (days)" type="number" required />
          <FormField name="priceUsd" label="Price (USD/person)" type="number" required />
          <FormField name="totalCapacity" label="Total capacity" type="number" required />
          <FormTextarea name="itinerary" label="Itinerary" />
          <FormTextarea
            name="inclusions"
            label="Inclusions (comma-separated)"
            defaultValue="Accommodation, Breakfast, Transfers"
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <IconPlus className="h-4 w-4" /> Create tour package
            </button>
          </div>
        </form>
      </Card>

      <div className="mt-6">
        <Card title="All tour packages" padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Availability</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tours.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{t.title}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{t.durationDays}d</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                      ${(t.priceMinor / 100).toFixed(0)}
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                      {t.availabilityCount} / {t.totalCapacity}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill
                        label={t.status}
                        tone={t.status === "published" ? "emerald" : "slate"}
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <form
                        action={async () => {
                          "use server";
                          await deleteTourPackageAction(t.id);
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
                {tours.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      No tour packages yet.
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
