import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthShell } from "@/ui/AuthShell";
import { ForgotForm } from "./ForgotForm";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgot");
  return (
    <AuthShell
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          ← {t("back")}
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
