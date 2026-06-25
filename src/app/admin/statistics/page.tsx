import { requireAdminUser } from "../_guard";
import { AdminShell, Card, PageHeader } from "@/ui/AdminShell";
import { statisticRepo } from "@/infra/composition";
import { updateStatisticAction } from "@/app/actions/admin";
import { ALL_STATISTIC_KEYS, StatisticValueType } from "@/domain";

export default async function AdminStatisticsPage() {
  const user = await requireAdminUser();
  const existing = await statisticRepo.list();
  const byKey = new Map(existing.map((s) => [s.key, s]));

  return (
    <AdminShell userEmail={user.email} active="statistics">
      <PageHeader
        breadcrumb="Content"
        title="Statistics"
        subtitle="Counts are non-negative integers; rates are 0–100. Shown on the public home page."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_STATISTIC_KEYS.map((key) => {
          const stat = byKey.get(key);
          const valueType = stat?.valueType ?? StatisticValueType.COUNT;
          const isRate = valueType === "rate";
          return (
            <Card key={key} title={key} description={isRate ? "Rate (0–100)" : "Count (≥ 0)"}>
              <form
                action={async (formData) => {
                  "use server";
                  const newValue = Number(formData.get("value"));
                  await updateStatisticAction(key, newValue);
                }}
                className="space-y-3"
              >
                <div className="flex items-baseline gap-2">
                  <input
                    name="value"
                    type="number"
                    defaultValue={stat?.value ?? 0}
                    step={isRate ? "0.1" : "1"}
                    min={0}
                    max={isRate ? 100 : undefined}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-2xl font-semibold tabular-nums shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  {isRate && (
                    <span className="text-lg font-medium text-slate-500 dark:text-slate-400">
                      %
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  Save
                </button>
              </form>
            </Card>
          );
        })}
      </div>
    </AdminShell>
  );
}
