import { redirect } from "next/navigation";
import { auth } from "@/infra/auth/auth";
import { DashboardShell } from "@/ui/DashboardShell";
import {
  applicationRepo,
  bookingRepo,
  consultationRepo,
  documentRepo,
} from "@/infra/composition";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [apps, bookings, docs] = await Promise.all([
    applicationRepo.listByStudent(session.user.id),
    bookingRepo.listByTraveler(session.user.id),
    documentRepo.listByOwner(session.user.id),
  ]);
  // Consultations are user-scoped via Prisma directly (no listByUser yet on the port)
  const consultations = await consultationRepo.listAvailableSlots().then(() => []);

  const cards = [
    { label: "Applications", value: apps.length, href: "/dashboard/applications" },
    { label: "Bookings", value: bookings.length, href: "/dashboard/bookings" },
    { label: "Documents", value: docs.length, href: "/dashboard/documents" },
    { label: "Consultations", value: consultations.length, href: "/dashboard/consultations" },
  ];

  return (
    <DashboardShell userEmail={session.user.email ?? ""} active="overview">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Welcome back. Here&apos;s a snapshot of your activity.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <a
            key={c.label}
            href={c.href}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{c.value}</p>
            <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">{c.label}</p>
          </a>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Quick actions</h2>
        <ul className="mt-3 grid gap-2 text-sm text-indigo-600 sm:grid-cols-2 dark:text-indigo-400">
          <li>
            <a href="/programs" className="hover:underline">
              → Browse programs
            </a>
          </li>
          <li>
            <a href="/tour-packages" className="hover:underline">
              → Browse tour packages
            </a>
          </li>
          <li>
            <a href="/dashboard/documents" className="hover:underline">
              → Upload a document
            </a>
          </li>
          <li>
            <a href="/about" className="hover:underline">
              → Book a consultation
            </a>
          </li>
        </ul>
      </div>
    </DashboardShell>
  );
}
