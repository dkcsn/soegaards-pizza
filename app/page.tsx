export default function Home() {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20">
        <p className="mb-6 text-sm uppercase tracking-[0.35em] text-stone-500">
          Søgaard&apos;s Pizza
        </p>

        <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
          Napolitansk pizza.
          <br />
          Få pizzaer.
          <br />
          Lavet ordentligt.
        </h1>

        <p className="mt-10 max-w-2xl text-lg leading-8 text-stone-300">
          Langtidshævet dej, Fior di Latte, San Marzano-tomat og bagning ved
          høj temperatur.
        </p>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-400">
          Vi laver kun 5-6 faste pizzaer. Ingen ændringer. Ingen ekstra
          toppings.
        </p>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-400">
          Pizzaerne er sammensat som færdige opskrifter, hvor dej, fugt,
          råvarer og bagning passer sammen.
        </p>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-400">
          Pizzaerne bestilles på forhånd og afhentes på et valgt tidspunkt,
          mens de stadig er varme fra ovnen.
        </p>

        <div className="mt-12">
          <button className="rounded-full bg-stone-100 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-stone-950 transition hover:bg-stone-300">
            Se menu
          </button>
        </div>
      </section>
    </main>
  );
}