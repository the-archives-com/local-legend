import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16 fade-in">
      <div className="mx-auto max-w-3xl space-y-8 text-center">
        <header className="space-y-3">
          <h1 className="text-5xl font-light tracking-wide sm:text-6xl">
            Local Legend
          </h1>

          <p className="text-stone-600">
            Mindful exploration.
          </p>
        </header>


<nav className="mx-auto grid w-full max-w-2xl gap-3 sm:grid-cols-3">
  <Link
    href="/"
    aria-current="page"
    className="
      flex
      min-h-12
      items-center
      justify-center
      rounded-full
      bg-stone-800
      px-5
      py-3
      text-sm
      text-stone-50
      transition-all
      duration-300
      hover:scale-[1.02]
      hover:bg-stone-700
      active:scale-95
    "
  >
    Home
  </Link>

  <Link
    href="/gallery"
    className="
      flex
      min-h-12
      items-center
      justify-center
      rounded-full
      border
      border-stone-300
      bg-white
      px-5
      py-3
      text-sm
      text-stone-700
      transition-all
      duration-300
      hover:scale-[1.02]
      hover:border-stone-400
      hover:bg-stone-100
      active:scale-95
    "
  >
    Gallery
  </Link>

  <Link
    href="/record"
    className="
      flex
      min-h-12
      items-center
      justify-center
      rounded-full
      border
      border-stone-300
      bg-white
      px-5
      py-3
      text-sm
      text-stone-700
      transition-all
      duration-300
      hover:scale-[1.02]
      hover:border-stone-400
      hover:bg-stone-100
      active:scale-95
    "
  >
    Record a Legend
  </Link>
</nav>


        <section className="mx-auto w-full max-w-2xl">
          <Image
            src="/legends/legend-00001.jpeg"
            alt="Legend number 00001"
            width={1200}
            height={800}
            priority
            className="h-auto w-full rounded-3xl shadow-xl"
          />
        </section>

        <footer className="space-y-2 text-sm text-stone-500">
          <p>
            Built with care by
            <br />
            <strong>Studio Nebari</strong>
          </p>

          <p className="italic">
            Mostly it&apos;s a stick in a pot.
          </p>
        </footer>
      </div>
    </main>
  );
}