import { requireAdminUser } from "../_guard";
import { AdminShell, Card, PageHeader, StatusPill } from "@/ui/AdminShell";
import { bookingRepo } from "@/infra/composition";

function tone(status: string): "emerald" | "indigo" | "amber" | "rose" | "slate" {
  if (status === "Confirmed") return "emerald";
  if (status === "PendingPayment") return "amber";
  if (status === "Cancelled") return "rose";
  return "slate";
}

export default async function AdminBookingsPage() {
  const user = await requireAdminUser();
  const bookings = await bookingRepo.list({ offset: 0, limit: 500 });

  const confirmed = bookings.filter((b) => b.status === "Confirmed").length;
  const pending = bookings.filter((b) => b.status === "PendingPayment").length;
  const revenue = bookings
    .filter((b) => b.status === "Confirmed")
    .reduce((s, b) => s + b.amountMinor, 0);

  return (
    <AdminShell userEmail={user.email} active="bookings">
      <PageHeader
        breadcrumb="Activity"
        title="All Bookings"
        subtitle={`${bookings.length} total · ${confirmed} confirmed · ${pending} pending · $${(revenue / 100).toLocaleString()} revenue`}
      />
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Traveler</th>
                <th className="px-5 py-3">Tour package</th>
                <th className="px-5 py-3">Places</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {b.travelerId.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {b.tourPackageId.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{b.reservedPlaces}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    {b.currency} {(b.amountMinor / 100).toFixed(2)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill label={b.status} tone={tone(b.status)} />
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                    {b.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminShell>
  );
}
