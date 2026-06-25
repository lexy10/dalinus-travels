import { requireAdminUser } from "../_guard";
import { AdminShell, ButtonLink, Card, PageHeader, StatusPill } from "@/ui/AdminShell";
import { IconPlus } from "@/ui/icons";
import { destinationRepo } from "@/infra/composition";
import { createDestinationAction, deleteDestinationAction } from "@/app/actions/admin";

export default async function AdminDestinationsPage() {
  const user = await requireAdminUser();
  const [studyD, travelD] = await Promise.all([
    destinationRepo.listByKind("study"),
    destinationRepo.listByKind("travel"),
  ]);
  const all = [...studyD, ...travelD];

  return (
    <AdminShell userEmail={user.email} active="destinations">
      <PageHeader
        breadcrumb="Catalog"
        title="Destinations"
        subtitle={`${studyD.length} study · ${travelD.length} travel destinations.`}
      />

      <Card title="Add destination" description="Create a new study or travel destination.">
        <form
          action={createDestinationAction}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <FormField name="name" label="Name" required />
          <FormField name="country" label="Country" required />
          <FormSelect
            name="kind"
            label="Kind"
            options={[
              { value: "study", label: "Study" },
              { value: "travel", label: "Travel" },
            ]}
            defaultValue="study"
          />
          <FormField name="costOfLiving" label="Cost of living" />
          <FormTextarea name="visaInfo" label="Visa info (study)" />
          <FormTextarea name="destinationGuide" label="Destination guide (travel)" />
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <IconPlus className="h-4 w-4" /> Create destination
            </button>
          </div>
        </form>
      </Card>

      <div className="mt-6">
        <Card title="All destinations" padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Country</th>
                  <th className="px-5 py-3">Kind</th>
                  <th className="px-5 py-3">Cost of living</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {all.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{d.name}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{d.country}</td>
                    <td className="px-5 py-3">
                      <StatusPill label={d.kind} tone={d.kind === "study" ? "indigo" : "emerald"} />
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                      {d.costOfLiving ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <form
                        action={async () => {
                          "use server";
                          await deleteDestinationAction(d.id);
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
                {all.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No destinations yet — add one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
        <ButtonLink href="/destinations" variant="secondary">
          View public destinations page →
        </ButtonLink>
      </p>
    </AdminShell>
  );
}

// ---------------------------------------------------------------------------
// Form primitives (kept inline; small enough that abstracting further isn't worth it)
// ---------------------------------------------------------------------------

export function FormField({
  name,
  label,
  required,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
    </div>
  );
}

export function FormTextarea({
  name,
  label,
  required,
  defaultValue,
  rows = 2,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <div className="sm:col-span-2">
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
    </div>
  );
}

export function FormSelect({
  name,
  label,
  options,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >
        {!defaultValue && (
          <option value="" disabled>
            Choose…
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
