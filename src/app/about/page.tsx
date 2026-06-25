import Link from "next/link";
import { useTranslations } from "next-intl";
import { Navbar } from "@/ui/Navbar";
import { Footer } from "@/ui/Footer";
import { PageHero } from "@/ui/PageHero";

export default function AboutPage() {
  const p = useTranslations("pages.about");

  const values = [
    { title: p("value1Title"), body: p("value1Body") },
    { title: p("value2Title"), body: p("value2Body") },
    { title: p("value3Title"), body: p("value3Body") },
  ];

  return (
    <>
      <Navbar />
      <main>
        <PageHero title={p("heroTitle")} subtitle={p("heroSubtitle")} />

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
              {p("missionTitle")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400">
              {p("missionBody")}
            </p>

            <h2 className="mt-12 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
              {p("storyTitle")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400">
              {p("storyBody")}
            </p>
          </div>
        </section>

        <section className="bg-gray-50 py-16 sm:py-20 dark:bg-gray-900">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
              {p("valuesTitle")}
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{v.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {v.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
              {p("contactTitle")}
            </h2>
            <p className="mt-4 text-base text-gray-600 dark:text-gray-400">{p("contactBody")}</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="mailto:hello@dalinus.travel"
                className="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-md hover:bg-indigo-700"
              >
                Email hello@dalinus.travel
              </a>
              <Link
                href="/register"
                className="inline-flex items-center rounded-lg border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Create a free account
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
