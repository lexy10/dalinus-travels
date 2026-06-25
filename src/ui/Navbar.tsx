import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/ui/ThemeToggle";

const NAV_LINKS = [
  { href: "/destinations", key: "destinations" as const },
  { href: "/programs", key: "programs" as const },
  { href: "/tour-packages", key: "tourPackages" as const },
  { href: "/guidance", key: "guidance" as const },
  { href: "/about", key: "about" as const },
];

export function Navbar() {
  const t = useTranslations("nav");
  const common = useTranslations("common");

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt={common("appName")} width={140} height={41} className="h-10 w-auto" priority />
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
            >
              {t(link.key)}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
          >
            {t("login")}
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {t("register")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
