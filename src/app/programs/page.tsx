import Link from "next/link";
import { useTranslations } from "next-intl";
import { Navbar } from "@/ui/Navbar";
import { Footer } from "@/ui/Footer";
import { PageHero } from "@/ui/PageHero";

const PROGRAMS = [
  {
    title: "MSc Computer Science",
    institution: "University of Manchester",
    country: "🇬🇧 UK",
    level: "Master's",
    field: "Computer Science",
    duration: "12 months",
    tuition: "$28,000 / year",
    intake: "Sept 2026",
    mode: "On-campus",
  },
  {
    title: "MBA International Business",
    institution: "University of Toronto",
    country: "🇨🇦 Canada",
    level: "Master's",
    field: "Business",
    duration: "24 months",
    tuition: "$45,000 / year",
    intake: "Sept 2026",
    mode: "On-campus",
  },
  {
    title: "BSc Mechanical Engineering",
    institution: "Technical University of Munich",
    country: "🇩🇪 Germany",
    level: "Bachelor's",
    field: "Engineering",
    duration: "36 months",
    tuition: "Tuition-free + $350 admin",
    intake: "Oct 2026",
    mode: "On-campus",
  },
  {
    title: "MSc Data Science",
    institution: "University of Edinburgh",
    country: "🇬🇧 UK",
    level: "Master's",
    field: "Data Science",
    duration: "12 months",
    tuition: "$32,000 / year",
    intake: "Sept 2026",
    mode: "On-campus",
  },
  {
    title: "PhD Biomedical Sciences",
    institution: "University of Melbourne",
    country: "🇦🇺 Australia",
    level: "Doctorate",
    field: "Health Sciences",
    duration: "36–48 months",
    tuition: "Funded (scholarship)",
    intake: "Feb 2027",
    mode: "On-campus",
  },
  {
    title: "BSc Computer Science (Online)",
    institution: "University of London",
    country: "🇬🇧 UK",
    level: "Bachelor's",
    field: "Computer Science",
    duration: "36–72 months",
    tuition: "$6,000 / year",
    intake: "Rolling",
    mode: "Online",
  },
];

const STUDY_LEVELS = ["Bachelor's", "Master's", "Doctorate", "Diploma"];
const FIELDS = [
  "Computer Science",
  "Business",
  "Engineering",
  "Health Sciences",
  "Data Science",
  "Arts & Humanities",
];
const INTAKES = ["Sept 2026", "Jan 2027", "May 2027", "Sept 2027"];

export default function ProgramsPage() {
  const p = useTranslations("pages.programs");

  return (
    <>
      <Navbar />
      <main>
        <PageHero title={p("heroTitle")} subtitle={p("heroSubtitle")} />

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              {/* Filters sidebar */}
              <aside className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {p("filtersTitle")}
                </h2>

                <fieldset className="mt-6">
                  <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {p("filterLevel")}
                  </legend>
                  <div className="mt-3 space-y-2">
                    {STUDY_LEVELS.map((lvl) => (
                      <label key={lvl} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="level"
                          value={lvl}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{lvl}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="mt-6">
                  <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {p("filterField")}
                  </legend>
                  <div className="mt-3 space-y-2">
                    {FIELDS.map((f) => (
                      <label key={f} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="field"
                          value={f}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{f}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="mt-6">
                  <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {p("filterBudget")}
                  </legend>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      aria-label="Minimum tuition"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      aria-label="Maximum tuition"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </fieldset>

                <fieldset className="mt-6">
                  <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {p("filterIntake")}
                  </legend>
                  <select
                    className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    defaultValue=""
                  >
                    <option value="">Any intake</option>
                    {INTAKES.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </fieldset>

                <button
                  type="button"
                  className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  {p("applyFiltersLabel")}
                </button>
              </aside>

              {/* Results */}
              <div>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {p("resultsHeading")}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {PROGRAMS.length} programs
                  </p>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{p("resultsHelper")}</p>

                <div className="mt-6 space-y-4">
                  {PROGRAMS.map((prog) => (
                    <article
                      key={prog.title + prog.institution}
                      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                            {prog.field} · {prog.level}
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                            {prog.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {prog.institution} · {prog.country}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {prog.mode}
                        </span>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm sm:grid-cols-3 dark:border-gray-800">
                        <div>
                          <dt className="text-xs text-gray-500 dark:text-gray-500">Duration</dt>
                          <dd className="text-gray-700 dark:text-gray-300">{prog.duration}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-gray-500 dark:text-gray-500">Tuition</dt>
                          <dd className="text-gray-700 dark:text-gray-300">{prog.tuition}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-gray-500 dark:text-gray-500">Intake</dt>
                          <dd className="text-gray-700 dark:text-gray-300">{prog.intake}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href="/register"
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          Apply Now
                        </Link>
                        <button
                          type="button"
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          Save for later
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
