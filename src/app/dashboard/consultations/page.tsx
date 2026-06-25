import { redirect } from "next/navigation";
import { auth } from "@/infra/auth/auth";
import { DashboardShell } from "@/ui/DashboardShell";
import { consultationService } from "@/infra/composition";

export default async function ConsultationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const slots = await consultationService.listAvailableSlots();

  return (
    <DashboardShell userEmail={session.user.email ?? ""} active="consultations">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Consultations</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Pick an available time slot to chat with one of our counsellors.
      </p>

      {slots.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          No open slots right now. Please check back tomorrow.
        </p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {slots.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {s.startsAt.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Ends {s.endsAt.toLocaleTimeString()}
              </p>
              <form action="/api/consultations/book" method="post" className="mt-3">
                <input type="hidden" name="slotId" value={s.id} />
                <input type="hidden" name="name" value={session.user.email ?? ""} />
                <input
                  type="hidden"
                  name="contactMethod"
                  value={session.user.email ?? ""}
                />
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  Book this slot
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
