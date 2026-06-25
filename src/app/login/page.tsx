import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthShell } from "@/ui/AuthShell";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  return (
    <AuthShell
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <p className="text-gray-600 dark:text-gray-400">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            {t("registerLink")}
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
