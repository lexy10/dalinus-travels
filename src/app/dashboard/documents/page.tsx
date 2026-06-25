import { redirect } from "next/navigation";
import { auth } from "@/infra/auth/auth";
import { DashboardShell } from "@/ui/DashboardShell";
import { documentRepo } from "@/infra/composition";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const docs = await documentRepo.listByOwner(session.user.id);

  return (
    <DashboardShell userEmail={session.user.email ?? ""} active="documents">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Upload PDFs, JPEGs, or PNGs up to 10 MB. Attach them to your applications later.
      </p>

      <form
        action="/api/documents/upload"
        method="post"
        encType="multipart/form-data"
        className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
      >
        <label
          htmlFor="file"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Choose a file
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          required
          className="mt-2 block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700 dark:text-gray-300"
        />
        <button
          type="submit"
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Upload
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Your documents ({docs.length})
        </h2>
        {docs.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-500">No documents uploaded yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{d.originalFilename}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {d.contentType} · {(d.sizeBytes / 1024).toFixed(0)} KB ·{" "}
                    {d.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Stored
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
