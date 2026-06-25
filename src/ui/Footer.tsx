import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const common = useTranslations("common");

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Image src="/logo.png" alt={common("appName")} width={120} height={35} className="h-8 w-auto" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t("description")}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("quickLinks")}
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/destinations"
                  className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {nav("destinations")}
                </Link>
              </li>
              <li>
                <Link
                  href="/programs"
                  className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {nav("programs")}
                </Link>
              </li>
              <li>
                <Link
                  href="/tour-packages"
                  className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {nav("tourPackages")}
                </Link>
              </li>
              <li>
                <Link
                  href="/guidance"
                  className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {nav("guidance")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t("services")}</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/programs"
                  className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {t("studyAbroad")}
                </Link>
              </li>
              <li>
                <Link
                  href="/tour-packages"
                  className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {t("tourPackages")}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {t("consultation")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t("legal")}</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {t("termsOfService")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {t("privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-sm text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  {t("cookiePolicy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-800">
          <p className="text-center text-sm text-gray-500 dark:text-gray-500">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
