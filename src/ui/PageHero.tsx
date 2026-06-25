interface PageHeroProps {
  readonly title: string;
  readonly subtitle?: string;
}

/** Compact dark-overlay hero used on subpages so they sit beneath the navbar
 *  without dominating the page like the landing-page hero does. */
export function PageHero({ title, subtitle }: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-gray-900">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-900 via-gray-900 to-gray-950"
      />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-base leading-relaxed text-gray-300 sm:text-lg">{subtitle}</p>
          )}
        </div>
      </div>
    </section>
  );
}
