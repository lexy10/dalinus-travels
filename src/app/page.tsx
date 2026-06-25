import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/ui/Navbar";
import { Footer } from "@/ui/Footer";

function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      {/* Dark overlay for legibility — keep this above the image but below content */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/60 to-black/80"
      />

      <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 sm:py-40 lg:px-8 lg:py-48">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("heroHeading")}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-gray-200 sm:text-xl">
            {t("heroSubheading")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/destinations"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-md transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-black/40"
            >
              {t("heroCta")}
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-base font-medium text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-black/40"
            >
              {t("heroSecondaryCta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const t = useTranslations("home");

  const stats = [
    { value: "500+", label: t("statPrograms") },
    { value: "98%", label: t("statVisaSuccess") },
    { value: "95%", label: t("statSatisfaction") },
    { value: "30+", label: t("statDestinations") },
  ];

  return (
    <section className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const t = useTranslations("home");

  const features = [
    { title: t("feature1Title"), description: t("feature1Description"), icon: "🎓" },
    { title: t("feature2Title"), description: t("feature2Description"), icon: "✈️" },
    { title: t("feature3Title"), description: t("feature3Description"), icon: "💬" },
    { title: t("feature4Title"), description: t("feature4Description"), icon: "📋" },
    { title: t("feature5Title"), description: t("feature5Description"), icon: "📄" },
    { title: t("feature6Title"), description: t("feature6Description"), icon: "🔒" },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            {t("featuresHeading")}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            {t("featuresSubheading")}
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <span className="text-3xl" role="img" aria-hidden="true">
                {feature.icon}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DestinationsSection() {
  const t = useTranslations("home");

  const destinations = [
    { name: t("destination1Name"), description: t("destination1Description"), flag: "🇬🇧" },
    { name: t("destination2Name"), description: t("destination2Description"), flag: "🇨🇦" },
    { name: t("destination3Name"), description: t("destination3Description"), flag: "🇦🇺" },
    { name: t("destination4Name"), description: t("destination4Description"), flag: "🇩🇪" },
  ];

  return (
    <section className="bg-gray-50 py-20 sm:py-28 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            {t("destinationsHeading")}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            {t("destinationsSubheading")}
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((dest) => (
            <Link
              key={dest.name}
              href="/destinations"
              className="group rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-950 dark:hover:border-indigo-700"
            >
              <span className="text-4xl" role="img" aria-hidden="true">
                {dest.flag}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                {dest.name}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{dest.description}</p>
            </Link>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/destinations"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            View all destinations →
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProgramsSection() {
  const t = useTranslations("home");

  const programs = [
    {
      title: t("program1Title"),
      institution: t("program1Institution"),
      field: t("program1Field"),
      duration: t("program1Duration"),
    },
    {
      title: t("program2Title"),
      institution: t("program2Institution"),
      field: t("program2Field"),
      duration: t("program2Duration"),
    },
    {
      title: t("program3Title"),
      institution: t("program3Institution"),
      field: t("program3Field"),
      duration: t("program3Duration"),
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            {t("programsHeading")}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            {t("programsSubheading")}
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <div
              key={program.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-3 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                {program.field}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {program.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {program.institution}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                <span aria-hidden="true">⏱</span>
                <span>{program.duration}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/programs"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Browse all programs →
          </Link>
        </div>
      </div>
    </section>
  );
}

function ToursSection() {
  const t = useTranslations("home");

  const tours = [
    { title: t("tour1Title"), duration: t("tour1Duration"), description: t("tour1Description") },
    { title: t("tour2Title"), duration: t("tour2Duration"), description: t("tour2Description") },
    { title: t("tour3Title"), duration: t("tour3Duration"), description: t("tour3Description") },
  ];

  return (
    <section className="bg-gray-50 py-20 sm:py-28 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            {t("toursHeading")}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            {t("toursSubheading")}
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <div
              key={tour.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
            >
              <div className="mb-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                {tour.duration}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tour.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {tour.description}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/tour-packages"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            See all tour packages →
          </Link>
        </div>
      </div>
    </section>
  );
}

function GuidanceSection() {
  const t = useTranslations("home");

  const guides = [
    { title: t("guidanceScholarship"), description: t("guidanceScholarshipDesc"), icon: "💰" },
    { title: t("guidanceCourse"), description: t("guidanceCourseDesc"), icon: "📚" },
    { title: t("guidanceVisa"), description: t("guidanceVisaDesc"), icon: "🛂" },
    { title: t("guidancePredeparture"), description: t("guidancePredepartureDesc"), icon: "🧳" },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            {t("guidanceHeading")}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            {t("guidanceSubheading")}
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {guides.map((guide) => (
            <Link
              key={guide.title}
              href="/guidance"
              className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <span className="text-3xl" role="img" aria-hidden="true">
                {guide.icon}
              </span>
              <h3 className="mt-4 text-base font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                {guide.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{guide.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  const t = useTranslations("home");

  return (
    <section className="bg-indigo-600 dark:bg-indigo-700">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t("ctaHeading")}
          </h2>
          <p className="mt-4 text-lg text-indigo-100">{t("ctaSubheading")}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-base font-medium text-indigo-600 shadow-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center rounded-lg border border-indigo-300 px-6 py-3 text-base font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <DestinationsSection />
        <ProgramsSection />
        <ToursSection />
        <GuidanceSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
