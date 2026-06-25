import { requireAdminUser } from "../_guard";
import { AdminShell, Card, PageHeader, StatusPill } from "@/ui/AdminShell";
import { FormField, FormTextarea } from "../destinations/page";
import { IconPlus } from "@/ui/icons";
import { blogRepo } from "@/infra/composition";
import { deleteBlogAction, publishBlogAction, unpublishBlogAction } from "@/app/actions/admin";

export default async function AdminBlogPage() {
  const user = await requireAdminUser();
  const articles = await blogRepo.list({ offset: 0, limit: 200 });
  const published = articles.filter((a) => a.status === "published").length;

  return (
    <AdminShell userEmail={user.email} active="blog">
      <PageHeader
        breadcrumb="Content"
        title="Blog"
        subtitle={`${articles.length} article${articles.length === 1 ? "" : "s"} · ${published} published.`}
      />

      <Card title="New article">
        <form action={publishBlogAction} className="grid gap-4">
          <FormField name="title" label="Title" required />
          <FormField name="slug" label="Slug (URL segment, lowercase + hyphens)" required />
          <FormTextarea name="body" label="Body (Markdown or HTML)" required rows={8} />
          <div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <IconPlus className="h-4 w-4" /> Publish article
            </button>
          </div>
        </form>
      </Card>

      <div className="mt-6">
        <Card title="All articles" padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Updated</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {articles.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{a.title}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {a.slug}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill
                        label={a.status}
                        tone={a.status === "published" ? "emerald" : "slate"}
                      />
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                      {a.updatedAt.toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        {a.status === "published" && (
                          <form
                            action={async () => {
                              "use server";
                              await unpublishBlogAction(a.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="text-xs font-medium text-amber-600 hover:text-amber-500"
                            >
                              Unpublish
                            </button>
                          </form>
                        )}
                        <form
                          action={async () => {
                            "use server";
                            await deleteBlogAction(a.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-xs font-medium text-rose-600 hover:text-rose-500"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {articles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      No articles yet.
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
