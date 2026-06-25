import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthShell } from "@/ui/AuthShell";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  return (
    <AuthShell
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <p className="text-gray-600 dark:text-gray-400">
          {t("haveAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            {t("loginLink")}
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
