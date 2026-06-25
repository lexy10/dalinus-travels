import Link from "next/link";
import { useTranslations } from "next-intl";
import { Navbar } from "@/ui/Navbar";
import { Footer } from "@/ui/Footer";
import { PageHero } from "@/ui/PageHero";

const SECTIONS = [
  {
    id: "scholarships",
    icon: "💰",
    titleKey: "scholarshipSection" as const,
    bodyKey: "scholarshipBody" as const,
    bullets: [
      "Chevening (UK) — fully-funded master's for global future leaders",
      "DAAD (Germany) — research and study scholarships for all levels",
      "Fulbright (USA) — graduate study and research grants",
      "Australia Awards — for select developing countries",
      "Institution-specific merit and need-based grants (we maintain a tracker)",
    ],
  },
  {
    id: "course-selection",
    icon: "📚",
    titleKey: "courseSection" as const,
    bodyKey: "courseBody" as const,
    bullets: [
      "Map your career goals to specific program outcomes",
      "Compare curricula side-by-side, not just rankings",
      "Check accreditation and graduate employment data",
      "Talk to current students before applying (we facilitate intros)",
    ],
  },
  {
    id: "visa",
    icon: "🛂",
    titleKey: "visaSection" as const,
    bodyKey: "visaBody" as const,
    bullets: [
      "Document checklist by destination, kept up to date",
      "Financial proof: blocked accounts, sponsor letters, fixed deposits",
      "Statement of Purpose templates for visa interviews",
      "Common rejection reasons and how to avoid them",
    ],
  },
  {
    id: "predeparture",
    icon: "🧳",
    titleKey: "predepartureSection" as const,
    bodyKey: "predepartureBody" as const,
    bullets: [
      "Packing checklist scaled to climate and trip length",
      "Opening a local bank account before / after arrival",
      "Accommodation: on-campus vs. private — pros and cons",
      "Health insurance: mandatory minimums by country",
      "Cultural adjustment: the first 90 days",
    ],
  },
];

export default function GuidancePage() {
  const p = useTranslations("pages.guidance");

  return (
    <>
      <Navbar />
      <main>
        <PageHero title={p("heroTitle")} subtitle={p("heroSubtitle")} />

        {/* Section nav */}
        <nav
          aria-label="Guidance sections"
          className="sticky top-16 z-30 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ul className="flex gap-6 overflow-x-auto py-3 text-sm">
              {SECTIONS.map((s) => (
                <li key={s.id} className="shrink-0">
                  <a
                    href={`#${s.id}`}
                    className="font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                  >
                    {p(s.titleKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="mx-auto max-w-4xl space-y-16 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-32">
              <div className="flex items-start gap-4">
                <span className="text-4xl" role="img" aria-hidden="true">
                  {s.icon}
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                    {p(s.titleKey)}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-400">
                    {p(s.bodyKey)}
                  </p>
                </div>
              </div>
              <ul className="mt-6 ml-14 list-disc space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="bg-indigo-600 dark:bg-indigo-700">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{p("ctaTitle")}</h2>
            <p className="mt-3 text-base text-indigo-100">{p("ctaBody")}</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-base font-medium text-indigo-600 shadow-md hover:bg-indigo-50"
              >
                Create a free account
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center rounded-lg border border-indigo-300 px-6 py-3 text-base font-medium text-white hover:bg-indigo-500"
              >
                Contact us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
