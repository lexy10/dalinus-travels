import Link from "next/link";
import { useTranslations } from "next-intl";
import { Navbar } from "@/ui/Navbar";
import { Footer } from "@/ui/Footer";
import { PageHero } from "@/ui/PageHero";

const STUDY_DESTINATIONS = [
  {
    flag: "🇬🇧",
    name: "United Kingdom",
    capital: "London",
    avgTuition: "$18,000 – $40,000",
    livingCost: "$1,200 – $1,800 / month",
    visa: "Student Visa (Tier 4) — biometric residence permit issued on arrival.",
    blurb:
      "Russell Group universities, one-year master's degrees, and a graduate work visa that lets you stay for two years after finishing.",
  },
  {
    flag: "🇨🇦",
    name: "Canada",
    capital: "Ottawa",
    avgTuition: "$15,000 – $35,000",
    livingCost: "$1,000 – $1,500 / month",
    visa: "Study Permit + Provincial Attestation Letter (PAL) required.",
    blurb:
      "Post-Graduation Work Permit up to three years, a clear PR pathway, and strong programs in tech, business, and healthcare.",
  },
  {
    flag: "🇦🇺",
    name: "Australia",
    capital: "Canberra",
    avgTuition: "$20,000 – $45,000",
    livingCost: "$1,400 – $2,000 / month",
    visa: "Subclass 500 Student Visa — must show Genuine Student requirement.",
    blurb:
      "Globally-ranked Group of Eight universities, strong research output, and post-study work rights from 2–4 years.",
  },
  {
    flag: "🇩🇪",
    name: "Germany",
    capital: "Berlin",
    avgTuition: "Free at public unis (admin fee ~$350/sem)",
    livingCost: "$900 – $1,300 / month",
    visa: "National Visa for Study Purposes — blocked account of ~€11,208/year required.",
    blurb:
      "Tuition-free public universities, strong engineering and CS programs, and an 18-month job-seeker visa after graduation.",
  },
  {
    flag: "🇺🇸",
    name: "United States",
    capital: "Washington, D.C.",
    avgTuition: "$25,000 – $60,000",
    livingCost: "$1,500 – $2,500 / month",
    visa: "F-1 Visa — SEVIS I-901 fee + visa interview at U.S. embassy.",
    blurb:
      "Largest selection of programs in the world, generous funding for graduate research, OPT/STEM-OPT work options after graduation.",
  },
  {
    flag: "🇮🇪",
    name: "Ireland",
    capital: "Dublin",
    avgTuition: "$12,000 – $30,000",
    livingCost: "$1,200 – $1,700 / month",
    visa: "Stamp 2 — IRP card on arrival; one-year stay-back permission post-study.",
    blurb:
      "English-speaking EU country with strong tech and pharma industries, and one of the most welcoming policies for international graduates.",
  },
];

const TRAVEL_DESTINATIONS = [
  {
    flag: "🇬🇧",
    name: "United Kingdom",
    bestFor: "Culture, history, theatre",
    season: "May – September",
  },
  {
    flag: "🇨🇦",
    name: "Canada",
    bestFor: "Rockies, lakes, wildlife",
    season: "June – September",
  },
  {
    flag: "🇦🇺",
    name: "Australia",
    bestFor: "Reef, beaches, road trips",
    season: "Oct – March (our summer)",
  },
  {
    flag: "🇮🇹",
    name: "Italy",
    bestFor: "Food, art, coastal towns",
    season: "April – June, Sept – Oct",
  },
  {
    flag: "🇯🇵",
    name: "Japan",
    bestFor: "Cherry blossom, temples, food",
    season: "March – May, Oct – Nov",
  },
  {
    flag: "🇦🇪",
    name: "United Arab Emirates",
    bestFor: "Desert, luxury, shopping",
    season: "Nov – March",
  },
];

export default function DestinationsPage() {
  const p = useTranslations("pages.destinations");

  return (
    <>
      <Navbar />
      <main>
        <PageHero title={p("heroTitle")} subtitle={p("heroSubtitle")} />

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                {p("studyTitle")}
              </h2>
              <p className="mt-3 text-base text-gray-600 dark:text-gray-400">{p("studyIntro")}</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {STUDY_DESTINATIONS.map((d) => (
                <article
                  key={d.name}
                  className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-4xl" role="img" aria-hidden="true">
                      {d.flag}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {d.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{d.capital}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {d.blurb}
                  </p>
                  <dl className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-xs dark:border-gray-800">
                    <div>
                      <dt className="font-medium text-gray-700 dark:text-gray-300">
                        Avg. Tuition
                      </dt>
                      <dd className="text-gray-600 dark:text-gray-400">{d.avgTuition}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700 dark:text-gray-300">Living Cost</dt>
                      <dd className="text-gray-600 dark:text-gray-400">{d.livingCost}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-700 dark:text-gray-300">Visa</dt>
                      <dd className="text-gray-600 dark:text-gray-400">{d.visa}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-16 sm:py-20 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                {p("travelTitle")}
              </h2>
              <p className="mt-3 text-base text-gray-600 dark:text-gray-400">{p("travelIntro")}</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {TRAVEL_DESTINATIONS.map((d) => (
                <article
                  key={d.name}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-4xl" role="img" aria-hidden="true">
                      {d.flag}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {d.name}
                    </h3>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">
                        Best for
                      </dt>
                      <dd className="text-gray-700 dark:text-gray-300">{d.bestFor}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">
                        Best season
                      </dt>
                      <dd className="text-gray-700 dark:text-gray-300">{d.season}</dd>
                    </div>
                  </dl>
                  <div className="mt-4">
                    <Link
                      href="/tour-packages"
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                    >
                      See tour packages →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-indigo-600 dark:bg-indigo-700">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{p("ctaTitle")}</h2>
            <p className="mt-3 text-base text-indigo-100">{p("ctaBody")}</p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center rounded-lg bg-white px-6 py-3 text-base font-medium text-indigo-600 shadow-md hover:bg-indigo-50"
            >
              {p("ctaButton")}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
