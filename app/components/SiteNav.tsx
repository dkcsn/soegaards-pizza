import Link from "next/link";

export function SiteNav() {
  return (
    <header className="fixed left-0 right-0 top-0 z-20 border-b border-stone-900 bg-stone-950/90 px-6 py-4 text-stone-100 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-200 transition hover:text-stone-50"
        >
          Søgaard&apos;s Pizza
        </Link>
        <div className="flex items-center gap-5 text-sm text-stone-400">
          <Link href="/menu" className="transition hover:text-stone-50">
            Menu
          </Link>
          <Link href="/admin" className="transition hover:text-stone-50">
            Admin
          </Link>
        </div>
      </nav>
    </header>
  );
}
