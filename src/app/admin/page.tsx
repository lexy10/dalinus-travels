import Link from "next/link";
import { requireAdminUser } from "./_guard";
import {
  AdminShell,
  ButtonLink,
  Card,
  PageHeader,
  StatCard,
  StatusPill,
} from "@/ui/AdminShell";
import {
  IconAcademic,
  IconBriefcase,
  IconCalendar,
  IconChevronRight,
  IconClipboard,
  IconCompass,
  IconDocument,
  IconGlobe,
  IconLayers,
  IconPlus,
  IconUsers,
} from "@/ui/icons";
import {
  applicationRepo,
  bookingRepo,
  destinationRepo,
  leadRepo,
  programRepo,
  recruiterRepo,
  tourPackageRepo,
} from "@/infra/composition";

// Group an array of items by yyyy-mm-dd bucket and return last `days` buckets.
function bucketByDay(items: { createdAt: Date }[], days: number): { label: string; count: number }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const it of items) {
    const key = new Date(it.createdAt).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([key, count]) => ({
    label: key.slice(5), // MM-DD
    count,
  }));
}

interface MiniBarChartProps {
  readonly data: { label: string; count: number }[];
}

function MiniBarChart({ data }: MiniBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const width = 480;
  const height = 140;
  const padding = { top: 10, right: 4, bottom: 20, left: 4 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const barW = innerW / data.length;
  const barGap = 6;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full" role="img" aria-label="Applications per day, last 14 days">
      {data.map((d, i) => {
        const h = (d.count / max) * innerH;
        const x = padding.left + i * barW + barGap / 2;
        const y = padding.top + (innerH - h);
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barW - barGap}
              height={Math.max(2, h)}
              rx="3"
              className="fill-indigo-500/80"
            />
            {i % 2 === 0 && (
              <text
                x={x + (barW - barGap) / 2}
                y={height - 4}
                textAnchor="middle"
                className="fill-slate-400 text-[8px]"
              >
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function statusTone(status: string): "emerald" | "indigo" | "amber" | "rose" | "slate" {
  if (status === "Accepted" || status === "Confirmed" || status === "active") return "emerald";
  if (status === "Rejected" || status === "rejected") return "rose";
  if (status === "PendingPayment" || status === "pending") return "amber";
  if (status === "UnderReview" || status === "Submitted") return "indigo";
  return "slate";
}

export default async function AdminOverviewPage() {
  const user = await requireAdminUser();

  const [
    studyDestinations,
    travelDestinations,
    programs,
    tours,
    leads,
    apps,
    bookings,
    pendingRecruiters,
  ] = await Promise.all([
    destinationRepo.listByKind("study"),
    destinationRepo.listByKind("travel"),
    programRepo.listPublished({ offset: 0, limit: 1000 }),
    tourPackageRepo.listPublished({ offset: 0, limit: 1000 }),
    leadRepo.list({ offset: 0, limit: 1000 }),
    applicationRepo.list({ offset: 0, limit: 1000 }),
    bookingRepo.list({ offset: 0, limit: 1000 }),
    recruiterRepo.list({ status: "pending" }),
  ]);

  // Trends: this week vs previous week
  const now = Date.now();
  const oneWeekAgo = now - 7 * 86_400_000;
  const twoWeeksAgo = now - 14 * 86_400_000;
  const appsThisWeek = apps.filter((a) => a.createdAt.getTime() >= oneWeekAgo).length;
  const appsLastWeek = apps.filter(
    (a) => a.createdAt.getTime() >= twoWeeksAgo && a.createdAt.getTime() < oneWeekAgo,
  ).length;
  const trendDelta = appsThisWeek - appsLastWeek;

  const bookingsThisWeek = bookings.filter((b) => b.createdAt.getTime() >= oneWeekAgo).length;
  const leadsThisWeek = leads.filter((l) => l.createdAt.getTime() >= oneWeekAgo).length;

  const confirmedBookings = bookings.filter((b) => b.status === "Confirmed").length;
  const totalRevenueMinor = bookings
    .filter((b) => b.status === "Confirmed")
    .reduce((sum, b) => sum + b.amountMinor, 0);

  const recentApps = apps.slice(0, 5);
  const recentBookings = bookings.slice(0, 5);
  const recentLeads = leads.slice(0, 5);

  const chartData = bucketByDay(apps, 14);

  return (
    <AdminShell userEmail={user.email} active="overview">
      <PageHeader
        breadcrumb="Dashboard"
        title="Overview"
        subtitle="A snapshot of platform activity, catalog, and people."
        actions={
          <>
            <ButtonLink href="/admin/programs" variant="secondary">
              <IconAcademic className="h-4 w-4" /> Manage programs
            </ButtonLink>
            <ButtonLink href="/admin/destinations">
              <IconPlus className="h-4 w-4" /> Add destination
            </ButtonLink>
          </>
        }
      />

      {/* ===== KPI row ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Applications"
          value={apps.length}
          icon={IconDocument}
          tone="indigo"
          trend={{
            direction: trendDelta > 0 ? "up" : trendDelta < 0 ? "down" : "flat",
            text: `${trendDelta >= 0 ? "+" : ""}${trendDelta} vs prev week`,
          }}
          hint={`${appsThisWeek} new this week`}
        />
        <StatCard
          label="Confirmed bookings"
          value={confirmedBookings}
          icon={IconCalendar}
          tone="emerald"
          hint={`${bookingsThisWeek} new this week`}
        />
        <StatCard
          label="Total leads"
          value={leads.length}
          icon={IconClipboard}
          tone="amber"
          hint={`${leadsThisWeek} new this week`}
        />
        <StatCard
          label="Revenue (confirmed)"
          value={`$${(totalRevenueMinor / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={IconCompass}
          tone="rose"
          hint="USD, paid bookings only"
        />
      </div>

      {/* ===== Chart + secondary stats ===== */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card
            title="Applications — last 14 days"
            description="Daily new application submissions across all programs."
          >
            <MiniBarChart data={chartData} />
          </Card>
        </div>
        <div className="space-y-4">
          <StatCard label="Published programs" value={programs.length} icon={IconAcademic} tone="indigo" />
          <StatCard label="Tour packages" value={tours.length} icon={IconCompass} tone="emerald" />
          <StatCard
            label="Destinations"
            value={`${studyDestinations.length + travelDestinations.length}`}
            hint={`${studyDestinations.length} study · ${travelDestinations.length} travel`}
            icon={IconGlobe}
            tone="slate"
          />
        </div>
      </div>

      {/* ===== Recent activity ===== */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card
          title="Recent applications"
          actions={<RecentLink href="/admin/applications" />}
          padded={false}
        >
          {recentApps.length === 0 ? (
            <EmptyRow message="No applications yet." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentApps.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-white">
                      Student {a.studentId.slice(0, 6)}…
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {fmtDate(a.createdAt)}
                    </p>
                  </div>
                  <StatusPill label={a.status} tone={statusTone(a.status)} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Recent bookings"
          actions={<RecentLink href="/admin/bookings" />}
          padded={false}
        >
          {recentBookings.length === 0 ? (
            <EmptyRow message="No bookings yet." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-white">
                      {b.currency} {(b.amountMinor / 100).toFixed(0)} · {b.reservedPlaces} place(s)
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {fmtDate(b.createdAt)}
                    </p>
                  </div>
                  <StatusPill label={b.status} tone={statusTone(b.status)} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent leads" actions={<RecentLink href="/admin/leads" />} padded={false}>
          {recentLeads.length === 0 ? (
            <EmptyRow message="No leads yet." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentLeads.map((l) => (
                <li key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-white">{l.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{l.email}</p>
                  </div>
                  <StatusPill label={l.status} tone={statusTone(l.status)} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ===== Attention row ===== */}
      {pendingRecruiters.length > 0 && (
        <div className="mt-6">
          <Card
            title={`${pendingRecruiters.length} recruiter${pendingRecruiters.length === 1 ? "" : "s"} awaiting approval`}
            description="Review pending recruiter applications and approve or reject."
            actions={<ButtonLink href="/admin/recruiters">Review now</ButtonLink>}
          >
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingRecruiters.slice(0, 3).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                      <IconUsers className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {r.companyName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        applied {fmtDate(r.appliedAt)}
                      </p>
                    </div>
                  </div>
                  <StatusPill label="Pending" tone="amber" />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* ===== Quick actions ===== */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <QuickAction href="/admin/destinations" icon={IconGlobe} label="Destinations" />
          <QuickAction href="/admin/programs" icon={IconAcademic} label="Programs" />
          <QuickAction href="/admin/tour-packages" icon={IconCompass} label="Tour Packages" />
          <QuickAction href="/admin/partners" icon={IconBriefcase} label="Partners" />
          <QuickAction href="/admin/blog" icon={IconLayers} label="Blog" />
          <QuickAction href="/admin/statistics" icon={IconClipboard} label="Statistics" />
        </div>
      </div>
    </AdminShell>
  );
}

function RecentLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
    >
      View all <IconChevronRight className="h-3 w-3" />
    </Link>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <p className="px-5 py-6 text-center text-sm text-slate-500 dark:text-slate-400">{message}</p>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 hover:shadow dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:text-indigo-300"
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-indigo-500/10 dark:group-hover:text-indigo-400">
        <Icon className="h-5 w-5" />
      </span>
      <span>{label}</span>
    </Link>
  );
}
