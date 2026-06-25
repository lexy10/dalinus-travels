import { requireAdminUser } from "../_guard";
import { AdminShell, Card, PageHeader, StatusPill } from "@/ui/AdminShell";
import { marketingPageRepo } from "@/infra/composition";
import { upsertMarketingPageAction } from "@/app/actions/admin";
import { ALL_MARKETING_PAGE_KEYS } from "@/domain";

export default async function AdminPagesPage() {
  const user = await requireAdminUser();
  const existing = await marketingPageRepo.list();
  const byKey = new Map(existing.map((p) => [p.key, p]));

  return (
    <AdminShell userEmail={user.email} active="pages">
      <PageHeader
        breadcrumb="Content"
        title="Marketing Pages"
        subtitle="Edit the body text for each public-facing marketing, guidance, and legal page. English only at this version — other locales fall back to English."
      />

      <div className="space-y-4">
        {ALL_MARKETING_PAGE_KEYS.map((key) => {
          const page = byKey.get(key);
          const body = page?.localizedContent["en"] ?? "";
          const isSet = Boolean(page);
          return (
            <Card
              key={key}
              title={key}
              description={
                isSet
                  ? `Last updated ${page!.updatedAt.toLocaleString()}`
                  : "No content set yet."
              }
              actions={<StatusPill label={isSet ? "set" : "empty"} tone={isSet ? "emerald" : "amber"} />}
            >
              <form action={upsertMarketingPageAction} className="space-y-3">
                <input type="hidden" name="key" value={key} />
                <textarea
                  name="body"
                  rows={6}
                  defaultValue={body}
                  placeholder="Enter the page body in plain text, Markdown, or HTML…"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
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
