import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-14 text-foreground fade-in">

      <div className="mx-auto max-w-4xl">

        {/* TOP BAR */}

        <div className="flex items-center justify-between border-b border-legend-border pb-5">

          <p className="text-sm font-medium text-legend-ink">
            Local Legend
          </p>

          <p className="legend-label text-legend-muted">
            Field Journal
          </p>

        </div>

        {/* HEADER */}

        <header className="mx-auto max-w-2xl py-14 text-center">

          <p className="legend-label text-legend-earth">
            Local Legend
          </p>

          <h1 className="legend-title mt-5 text-5xl font-medium text-legend-ink sm:text-6xl">
            Mindful exploration.
          </h1>

          <div className="mx-auto mt-6 flex items-center justify-center gap-3">

            <span className="h-px w-14 bg-legend-border" />

            <span className="text-sm text-legend-green">
              ◆
            </span>

            <span className="h-px w-14 bg-legend-border" />

          </div>

          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-legend-muted">
            A quiet place to notice something worth
            remembering.
          </p>

        </header>

        {/* NAVIGATION */}

        <nav className="mx-auto grid w-full max-w-2xl gap-3 sm:grid-cols-3">

          <Link
            href="/"
            aria-current="page"
            className="flex min-h-12 items-center justify-center rounded-full bg-legend-green px-5 py-3 text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Home
          </Link>

          <Link
            href="/gallery"
            className="flex min-h-12 items-center justify-center rounded-full border border-legend-border bg-legend-surface px-5 py-3 text-sm text-legend-ink transition-all hover:border-legend-moss hover:bg-legend-paper active:scale-[0.98]"
          >
            Gallery
          </Link>

          <Link
            href="/record"
            className="flex min-h-12 items-center justify-center rounded-full border border-legend-border bg-legend-surface px-5 py-3 text-sm text-legend-ink transition-all hover:border-legend-moss hover:bg-legend-paper active:scale-[0.98]"
          >
            Record a Legend
          </Link>

        </nav>

        {/* CURRENT LEGEND */}

        <section className="mt-14">

          <div className="mb-6 flex items-end justify-between gap-6 border-b border-legend-border pb-4">

            <div>

              <p className="legend-label text-legend-green">
                Current Legend
              </p>

              <h2 className="legend-title mt-2 text-3xl text-legend-ink">
                Legend 00001
              </h2>

            </div>

            <p className="hidden text-xs uppercase tracking-[0.14em] text-legend-muted sm:block">
              Look closely
            </p>

          </div>

          <div className="legend-paper legend-shadow overflow-hidden rounded-3xl">

            <Image
              src="/legends/legend-00001.jpeg"
              alt="Legend number 00001"
              width={1200}
              height={800}
              priority
              className="h-auto w-full"
            />

            <div className="border-t border-legend-border px-7 py-6">

              <p className="text-sm leading-7 text-legend-muted">
                One image. One thing worth noticing.
              </p>

            </div>

          </div>

        </section>

        {/* BAILEY'S CHALLENGE */}

        <section className="mx-auto mt-12 max-w-2xl">

          <div className="rounded-3xl border border-dashed border-legend-border bg-legend-surface/70 px-8 py-8 text-center">

            <p className="legend-label text-legend-earth">
              Bailey&apos;s Challenge
            </p>

            <h2 className="legend-title mt-3 text-2xl text-legend-ink">
              Something to look for while you&apos;re out.
            </h2>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium text-legend-green">

              <span>
                Green
              </span>

              <span className="text-legend-border">
                ·
              </span>

              <span>
                Round
              </span>

              <span className="text-legend-border">
                ·
              </span>

              <span>
                Checkers
              </span>

            </div>

            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-legend-muted">
              Three prompts. Three photographs.
              See what catches your eye.
            </p>

            <Link
              href="/challenge"
              className="mt-6 inline-flex items-center justify-center text-sm font-medium text-legend-green transition-colors hover:text-legend-earth"
            >
              Take the challenge →
            </Link>

          </div>

        </section>

        {/* RECORD PROMPT */}

        <section className="mx-auto mt-12 max-w-xl text-center">

          <p className="legend-label text-legend-moss">
            Found something?
          </p>

          <h2 className="legend-title mt-3 text-2xl text-legend-ink">
            Record a Legend.
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-legend-muted">
            Keep the things that deserve more than
            a passing glance.
          </p>

          <Link
            href="/record"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-legend-green px-8 py-3 text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Record a Legend
          </Link>

        </section>

        {/* FOOTER */}

        <footer className="mt-16 border-t border-legend-border pt-8 text-center">

          <p className="text-sm text-legend-muted">
            Built with care by
            <br />
            <strong className="text-legend-ink">
              Studio Nebari
            </strong>
          </p>

          <p className="mt-3 text-xs italic text-legend-muted">
            Mostly it&apos;s a stick in a pot.
          </p>

          <p className="mt-6 text-xs text-legend-muted">
            Walk first. Technology serves observation.
          </p>

        </footer>

      </div>

    </main>
  );
}