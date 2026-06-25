import Link from "next/link";
import { useTranslations } from "next-intl";
import { Navbar } from "@/ui/Navbar";
import { Footer } from "@/ui/Footer";
import { PageHero } from "@/ui/PageHero";

const TOURS = [
  {
    title: "London Cultural Experience",
    destination: "🇬🇧 United Kingdom",
    duration: "7 days",
    price: 1850,
    availability: 8,
    blurb:
      "British Museum, Tower of London, Westminster, plus a day trip to Oxford. Boutique hotel near Covent Garden.",
    inclusions: ["Accommodation", "Daily breakfast", "Museum passes", "Airport transfers"],
  },
  {
    title: "Canadian Rockies Adventure",
    destination: "🇨🇦 Canada",
    duration: "10 days",
    price: 3200,
    availability: 4,
    blurb:
      "Banff, Lake Louise, Jasper, and the Icefields Parkway. Wildlife spotting and a glacier walk included.",
    inclusions: ["Accommodation", "All meals", "Park passes", "Guide"],
  },
  {
    title: "Australian East Coast",
    destination: "🇦🇺 Australia",
    duration: "14 days",
    price: 4500,
    availability: 6,
    blurb:
      "Sydney, Brisbane, Cairns, Great Barrier Reef. Includes a snorkeling day trip and Whitehaven Beach.",
    inclusions: ["Accommodation", "Internal flights", "Reef tour", "Half-board"],
  },
  {
    title: "Italian Coastal Drive",
    destination: "🇮🇹 Italy",
    duration: "9 days",
    price: 2750,
    availability: 10,
    blurb:
      "Rome, Florence, Cinque Terre, Amalfi. Wine tasting in Tuscany and a sunset boat ride in Positano.",
    inclusions: ["Accommodation", "Daily breakfast", "Wine tasting", "Rental car"],
  },
  {
    title: "Japan Cherry Blossom",
    destination: "🇯🇵 Japan",
    duration: "11 days",
    price: 3900,
    availability: 0,
    blurb:
      "Tokyo, Kyoto, Osaka during the spring sakura season. JR Pass, tea ceremony, and a stay in a traditional ryokan.",
    inclusions: ["Accommodation", "JR Pass", "Tea ceremony", "Selected dinners"],
  },
  {
    title: "Dubai Desert & City",
    destination: "🇦🇪 UAE",
    duration: "5 days",
    price: 1600,
    availability: 15,
    blurb:
      "Burj Khalifa, desert safari with overnight Bedouin camp, dhow cruise, and the Palm Jumeirah.",
    inclusions: ["Accommodation", "Desert safari", "Dhow cruise", "Airport transfers"],
  },
];

const DESTINATIONS = [
  "🇬🇧 United Kingdom",
  "🇨🇦 Canada",
  "🇦🇺 Australia",
  "🇮🇹 Italy",
  "🇯🇵 Japan",
  "🇦🇪 UAE",
];

export default function TourPackagesPage() {
  const p = useTranslations("pages.tourPackages");

  return (
    <>
      <Navbar />
      <main>
        <PageHero title={p("heroTitle")} subtitle={p("heroSubtitle")} />

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              <aside className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Filters</h2>

                <div className="mt-6">
                  <label
                    htmlFor="filter-destination"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {p("filterDestination")}
                  </label>
                  <select
                    id="filter-destination"
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    defaultValue=""
                  >
                    <option value="">All destinations</option>
                    {DESTINATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-6">
                  <label
                    htmlFor="filter-duration"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {p("filterDuration")}
                  </label>
                  <select
                    id="filter-duration"
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    defaultValue=""
                  >
                    <option value="">Any length</option>
                    <option value="1-7">1–7 days</option>
                    <option value="8-14">8–14 days</option>
                    <option value="15+">15+ days</option>
                  </select>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {p("filterPrice")}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      aria-label="Minimum price"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      aria-label="Maximum price"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </aside>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {p("resultsHeading")}
                </h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  {TOURS.map((tour) => {
                    const fullyBooked = tour.availability === 0;
                    return (
                      <article
                        key={tour.title}
                        className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                            {tour.destination}
                          </p>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {tour.duration}
                          </span>
                        </div>
                        <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                          {tour.title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {tour.blurb}
                        </p>
                        <ul className="mt-4 grid grid-cols-2 gap-1 text-xs text-gray-600 dark:text-gray-400">
                          {tour.inclusions.map((inc) => (
                            <li key={inc} className="flex items-center gap-1">
                              <span aria-hidden="true">✓</span> {inc}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-auto flex items-end justify-between pt-6">
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              ${tour.price.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {p("perPerson")}
                            </p>
                          </div>
                          {fullyBooked ? (
                            <span className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-500">
                              Fully booked
                            </span>
                          ) : (
                            <Link
                              href="/register"
                              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                              {p("bookNow")}
                            </Link>
                          )}
                        </div>
                        {!fullyBooked && (
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                            Only {tour.availability} place(s) left
                          </p>
                        )}
                      </article>
                    );
                  })}
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
