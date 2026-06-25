import { redirect } from "next/navigation";
import { auth } from "@/infra/auth/auth";
import { DashboardShell } from "@/ui/DashboardShell";
import { bookingRepo, tourPackageRepo } from "@/infra/composition";

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const bookings = await bookingRepo.listByTraveler(session.user.id);
  const packages = await Promise.all(bookings.map((b) => tourPackageRepo.findById(b.tourPackageId)));

  return (
    <DashboardShell userEmail={session.user.email ?? ""} active="bookings">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
        <a
          href="/tour-packages"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Browse tour packages →
        </a>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-base font-medium text-gray-900 dark:text-white">No bookings yet</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Pick a tour package and reserve your spot.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {bookings.map((b, i) => {
            const pkg = packages[i];
            return (
              <article
                key={b.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {pkg?.title ?? "Tour package"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {b.reservedPlaces} place(s) · {b.currency} {(b.amountMinor / 100).toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={
                      b.status === "Confirmed"
                        ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : b.status === "PendingPayment"
                          ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          : "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }
                  >
                    {b.status}
                  </span>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                  Booked {b.createdAt.toLocaleString()}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
