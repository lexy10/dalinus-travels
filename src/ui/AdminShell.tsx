import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/ui/ThemeToggle";
import {
  IconAcademic,
  IconBell,
  IconBriefcase,
  IconCalendar,
  IconChart,
  IconClipboard,
  IconCompass,
  IconDocument,
  IconExternal,
  IconGlobe,
  IconHome,
  IconLayers,
  IconLogout,
  IconNews,
  IconSearch,
  IconTag,
  IconUsers,
} from "./icons";

interface AdminShellProps {
  readonly userEmail: string;
  readonly active?: AdminSection;
  readonly children: React.ReactNode;
}

export type AdminSection =
  | "overview"
  | "destinations"
  | "programs"
  | "tour-packages"
  | "applications"
  | "bookings"
  | "leads"
  | "recruiters"
  | "partners"
  | "blog"
  | "pages"
  | "statistics";

type IconType = (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;

interface NavItem {
  key: AdminSection;
  href: string;
  label: string;
  icon: IconType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: "",
    items: [{ key: "overview", href: "/admin", label: "Overview", icon: IconHome }],
  },
  {
    label: "Catalog",
    items: [
      { key: "destinations", href: "/admin/destinations", label: "Destinations", icon: IconGlobe },
      { key: "programs", href: "/admin/programs", label: "Programs", icon: IconAcademic },
      { key: "tour-packages", href: "/admin/tour-packages", label: "Tour Packages", icon: IconCompass },
    ],
  },
  {
    label: "Activity",
    items: [
      { key: "applications", href: "/admin/applications", label: "Applications", icon: IconDocument },
      { key: "bookings", href: "/admin/bookings", label: "Bookings", icon: IconCalendar },
      { key: "leads", href: "/admin/leads", label: "Leads", icon: IconClipboard },
    ],
  },
  {
    label: "People",
    items: [
      { key: "recruiters", href: "/admin/recruiters", label: "Recruiters", icon: IconUsers },
      { key: "partners", href: "/admin/partners", label: "Partners", icon: IconBriefcase },
    ],
  },
  {
    label: "Content",
    items: [
      { key: "blog", href: "/admin/blog", label: "Blog", icon: IconNews },
      { key: "pages", href: "/admin/pages", label: "Marketing Pages", icon: IconLayers },
      { key: "statistics", href: "/admin/statistics", label: "Statistics", icon: IconChart },
    ],
  },
];

function avatarInitials(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || (local[0] ?? "?").toUpperCase();
}

export function AdminShell({ userEmail, active = "overview", children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex min-h-screen">
        {/* ===== Sidebar ===== */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-900 lg:flex">
          <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
              D
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Dalinus Travels</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Admin Console</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
            {GROUPS.map((group) => (
              <div key={group.label} className="mb-6">
                {group.label && (
                  <h3 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {group.label}
                  </h3>
                )}
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = item.key === active;
                    const Icon = item.icon;
                    return (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          aria-current={isActive ? "page" : undefined}
                          className={[
                            "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                            isActive
                              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/30"
                              : "text-slate-300 hover:bg-white/5 hover:text-white",
                          ].join(" ")}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <IconExternal className="h-4 w-4" />
              View public site
            </Link>
          </div>
        </aside>

        {/* ===== Main column ===== */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900">
            <div className="relative flex-1 max-w-md">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <IconSearch className="h-4 w-4" />
              </span>
              <input
                type="search"
                placeholder="Search…"
                aria-label="Search"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="button"
              aria-label="Notifications"
              className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <IconBell />
              <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                3
              </span>
            </button>
            <ThemeToggle />
            <div className="hidden h-9 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Admin</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{userEmail}</p>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white">
                {avatarInitials(userEmail)}
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  aria-label="Sign out"
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <IconLogout />
                </button>
              </form>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared dashboard primitives used by admin pages
// ---------------------------------------------------------------------------

interface PageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly breadcrumb?: string;
  readonly actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {breadcrumb && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {breadcrumb}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

interface StatCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly hint?: string;
  readonly trend?: { readonly direction: "up" | "down" | "flat"; readonly text: string };
  readonly icon?: IconType;
  readonly tone?: "indigo" | "emerald" | "amber" | "rose" | "slate";
}

const TONE_BG: Record<NonNullable<StatCardProps["tone"]>, string> = {
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export function StatCard({ label, value, hint, trend, icon: Icon, tone = "indigo" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
        {Icon && (
          <div className={`grid h-10 w-10 place-items-center rounded-lg ${TONE_BG[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {trend && (
        <p
          className={[
            "mt-3 inline-flex items-center gap-1 text-xs font-medium",
            trend.direction === "up"
              ? "text-emerald-600 dark:text-emerald-400"
              : trend.direction === "down"
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-500 dark:text-slate-400",
          ].join(" ")}
        >
          <span aria-hidden="true">
            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}
          </span>
          {trend.text}
        </p>
      )}
    </div>
  );
}

export function StatusPill({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: "emerald" | "indigo" | "amber" | "rose" | "slate";
}) {
  const toneMap = {
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 ring-emerald-200/60 dark:ring-emerald-500/30",
    indigo:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 ring-indigo-200/60 dark:ring-indigo-500/30",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 ring-amber-200/60 dark:ring-amber-500/30",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 ring-rose-200/60 dark:ring-rose-500/30",
    slate:
      "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 ring-slate-200/60 dark:ring-slate-500/30",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${toneMap[tone]}`}
    >
      {label}
    </span>
  );
}

interface CardProps {
  readonly title?: string;
  readonly description?: string;
  readonly actions?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly padded?: boolean;
}

export function Card({ title, description, actions, children, padded = true }: CardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {(title || actions) && (
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const cls =
    variant === "primary"
      ? "inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      : "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
