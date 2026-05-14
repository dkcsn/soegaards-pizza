import { getActivePizzas } from "@/app/lib/menu";
import { MenuClient } from "@/app/menu/MenuClient";
import {
  FIRST_PICKUP_TIME,
  LAST_PICKUP_TIME,
  MAX_PIZZAS_PER_SLOT,
  PIZZA_CAPACITY_MINUTES,
  SLOT_INTERVAL_MINUTES,
} from "@/app/lib/booking";

export const metadata = {
  title: "Menu | Søgaard's Pizza",
};

export const dynamic = "force-dynamic";

export default function MenuPage() {
  const pizzas = getActivePizzas();
  const nowIso = new Date().toISOString();

  return (
    <main className="min-h-screen bg-stone-950 px-6 pb-20 pt-32 text-stone-100">
      <div className="mx-auto max-w-6xl">
        <header className="grid gap-8 border-b border-stone-800 pb-12 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-stone-500">
              Menu
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-stone-50 md:text-6xl">
              Få pizzaer, lavet som færdige opskrifter.
            </h1>
          </div>

          <div className="leading-7 text-stone-400">
            <p>
              Langtidshævet dej, Fior di Latte, San Marzano-tomat og bagning
              ved høj temperatur.
            </p>
            <p className="mt-4">
              Ingen ændringer. Ingen ekstra toppings. Begrænset antal pizzaer
              pr. aften.
            </p>
          </div>
        </header>

        <section className="py-10">
          <MenuClient pizzas={pizzas} nowIso={nowIso} />
        </section>

        <section className="grid gap-4 border-t border-stone-800 pt-10 md:grid-cols-4">
          <div className="border border-stone-800 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
              Afhentning
            </p>
            <p className="mt-3 font-mono text-2xl text-stone-50">
              {FIRST_PICKUP_TIME}-{LAST_PICKUP_TIME}
            </p>
          </div>
          <div className="border border-stone-800 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
              Slots
            </p>
            <p className="mt-3 font-mono text-2xl text-stone-50">
              {SLOT_INTERVAL_MINUTES} min
            </p>
          </div>
          <div className="border border-stone-800 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
              Ovnkapacitet
            </p>
            <p className="mt-3 font-mono text-2xl text-stone-50">
              {PIZZA_CAPACITY_MINUTES} min
            </p>
            <p className="mt-1 text-sm text-stone-500">pr. pizza</p>
          </div>
          <div className="border border-stone-800 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
              Max pr. slot
            </p>
            <p className="mt-3 font-mono text-2xl text-stone-50">
              {MAX_PIZZAS_PER_SLOT}
            </p>
            <p className="mt-1 text-sm text-stone-500">pizzaer</p>
          </div>
        </section>
      </div>
    </main>
  );
}
