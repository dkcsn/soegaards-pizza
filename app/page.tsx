import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="mb-6 text-sm uppercase tracking-[0.35em] text-stone-500">
              Søgaard&apos;s Pizza
            </p>

            <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
              Napolitansk pizza bygget på gode råvarer og håndværk
            </h1>

            <p className="mt-10 max-w-2xl text-xl leading-9 text-stone-300">
              Søgaard&apos;s Pizza er et lille pizzaria med fokus på
              napolitansk pizza.
            </p>
          </div>

          <div className="border-l border-stone-800 pl-6">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-600">
              Fokus
            </p>
            <div className="mt-5 grid gap-4 text-sm uppercase tracking-[0.18em] text-stone-400">
              <p>Langtidshævet dej</p>
              <p>Fior di Latte</p>
              <p>San Marzano D.O.P.</p>
              <p>Høj temperatur</p>
              <p>Få pizzaer gjort ordentligt</p>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-10 border-t border-stone-900 pt-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="max-w-3xl space-y-6 text-lg leading-8 text-stone-400">
            <p>
              Vi holder menuen lille med 5-6 pizzaer ad gangen, så fokus kan
              blive på råvarer, dej og bagning.
            </p>
            <p>
              Nogle pizzaer vender tilbage fast, mens andre ændrer sig løbende
              efter sæson og råvarer.
            </p>
            <p>
              Langtidshævet dej med op til 96 timers fermentering, Caputo
              Saccorosso Tipo 00, Fior di Latte og San Marzano D.O.P. tomater
              fra Solania.
            </p>
            <p>
              Pizzaerne er sammensat som færdige opskrifter, hvor dej, fugt,
              råvarer og bagning passer sammen. Derfor laver vi ikke ændringer
              eller ekstra toppings.
            </p>
            <p>
              Vi holder kun åbent på udvalgte dage.
            </p>
          </div>

          <div className="lg:pt-2">
            <div className="border border-stone-800 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-600">
                Preorder
              </p>
              <p className="mt-4 text-2xl font-semibold leading-8 text-stone-50">
                Faste opskrifter. Valgt afhentningstid. Frisk fra ovnen.
              </p>
              <Link
                href="/menu"
                className="mt-8 inline-flex bg-stone-100 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-stone-950 transition hover:bg-stone-300"
              >
                Se menu
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
