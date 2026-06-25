import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/ui/ThemeToggle";

interface DashboardShellProps {
  readonly userEmail: string;
  readonly active?: "overview" | "applications" | "bookings" | "documents" | "consultations" | "profile";
  readonly children: React.ReactNode;
}

const NAV = [
  { key: "overview" as const, href: "/dashboard", label: "Overview" },
  { key: "applications" as const, href: "/dashboard/applications", label: "Applications" },
  { key: "bookings" as const, href: "/dashboard/bookings", label: "Bookings" },
  { key: "documents" as const, href: "/dashboard/documents", label: "Documents" },
  { key: "consultations" as const, href: "/dashboard/consultations", label: "Consultations" },
  { key: "profile" as const, href: "/dashboard/profile", label: "Profile" },
];

export function DashboardShell({ userEmail, active = "overview", children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            Dalinus Travels
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-gray-600 dark:text-gray-400">{userEmail}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm font-medium text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside>
            <nav className="space-y-1" aria-label="Dashboard">
              {NAV.map((item) => {
                const isActive = item.key === active;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      isActive
                        ? "block rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
                        : "block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
