import Link from "next/link";
import { pizzas } from "@/app/lib/menu";
import { AdminClient } from "@/app/admin/AdminClient";
import {
  LATE_START_TIME,
  MAX_PIZZAS_PER_SLOT,
  PIZZA_CAPACITY_MINUTES,
  RELEASE_CONTROL_ENABLED,
  SLOT_CAPACITY_MINUTES,
  SLOT_INTERVAL_MINUTES,
  canCreateDynamicSlot,
  getCapacityMinutes,
  getDynamicSlotCapacity,
  getRemainingSlotMinutes,
} from "@/app/lib/booking";

export const metadata = {
  title: "Admin | Søgaard's Pizza",
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-stone-950 px-6 py-10 text-stone-100">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 border-b border-stone-800 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-stone-500">
              Admin
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-50 md:text-6xl">
              Søgaard&apos;s Pizza
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-stone-400">
              Simpelt overblik til MVP. Menu og regler styres stadig i config,
              så deployment forbliver enkel på Vercel.
            </p>
          </div>

          <Link
            href="/"
            className="w-fit border border-stone-700 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-stone-300 transition hover:border-stone-400 hover:text-stone-50"
          >
            Forside
          </Link>
        </header>

        <section className="my-10 border border-stone-800 p-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
                Booking system
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-stone-50">
                Pickup capacity model
              </h2>
              <p className="mt-4 max-w-3xl leading-7 text-stone-400">
                Standardtider ligger hvert {SLOT_INTERVAL_MINUTES}. minut. Hvert
                slot har {SLOT_CAPACITY_MINUTES} minutters ovnkapacitet, og én
                pizza reserverer {PIZZA_CAPACITY_MINUTES} minutter. Hvis en
                ordre efterlader brugbar restkapacitet, kan systemet åbne et
                dynamisk ekstra pickup-valg i samme slot.
              </p>
            </div>

            <div className="border border-stone-800 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
                Release control
              </p>
              <p className="mt-3 font-mono text-2xl text-stone-50">
                {RELEASE_CONTROL_ENABLED ? "Enabled" : "Disabled"}
              </p>
              <p className="mt-2 text-sm text-stone-500">
                Late starts from {LATE_START_TIME}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((pizzaCount) => {
              const remainingMinutes = getRemainingSlotMinutes(pizzaCount);
              const dynamicCapacity = getDynamicSlotCapacity(pizzaCount);

              return (
                <div key={pizzaCount} className="border border-stone-800 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-600">
                    {pizzaCount} pizza{pizzaCount > 1 ? "er" : ""}
                  </p>
                  <p className="mt-3 font-mono text-2xl text-stone-50">
                    {getCapacityMinutes(pizzaCount)} min
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    {canCreateDynamicSlot(pizzaCount)
                      ? `${remainingMinutes} min tilbage · op til ${dynamicCapacity} pizzaer`
                      : "slot fyldt"}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-sm leading-6 text-stone-500">
            Eksempel: 2 pizzaer kl. 20:00 bruger 5 minutter. Der er 5 minutter
            tilbage, så systemet kan åbne 20:05 med kapacitet til op til 2
            pizzaer. Et standard-slot kan maksimalt rumme {MAX_PIZZAS_PER_SLOT}
            pizzaer.
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
                  Menu
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-stone-50">
                  Faste pizzaer
                </h2>
              </div>
              <p className="text-sm text-stone-500">
                Kilde: app/config/menu.json
              </p>
            </div>

            <AdminClient pizzas={pizzas} />
          </div>

          <aside className="border border-stone-800 p-6 lg:self-start">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              Næste skridt
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-stone-50">
              Ikke database endnu
            </h2>
            <p className="mt-4 leading-7 text-stone-400">
              Dagens kapacitet og pizzaer kan redigeres lokalt i browseren.
              Ordreoversigt og udsolgt status bør først kobles på, når Supabase
              eller en anden persistent storage er valgt.
            </p>
            <div className="mt-6 space-y-3 text-sm text-stone-500">
              <p>Senere: ordreoversigt</p>
              <p>Senere: pickup slots og udsolgt status</p>
              <p>Senere: rigtig billed-upload</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
