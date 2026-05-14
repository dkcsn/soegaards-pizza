"use client";

import { useEffect, useMemo, useState } from "react";
import type { FakeOrder } from "@/app/lib/fake-orders";
import { fetchSupabaseOrders } from "@/app/lib/supabase/data";

function formatPickupTime(order: FakeOrder) {
  if (!order.pickupTime) {
    return order.pickupLabel;
  }

  return new Intl.DateTimeFormat("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(order.pickupTime));
}

function getOrderTime(order: FakeOrder) {
  return order.pickupTime
    ? new Date(order.pickupTime).getTime()
    : new Date(order.createdAt).getTime();
}

export function BakerClient() {
  const [orders, setOrders] = useState<FakeOrder[]>([]);
  const [status, setStatus] = useState("Indlæser bestillinger");

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      const loadedOrders = await fetchSupabaseOrders();

      if (cancelled) {
        return;
      }

      if (loadedOrders) {
        setOrders(loadedOrders);
        setStatus("Live fra Supabase");
      } else {
        setStatus("Ingen databaseforbindelse");
      }
    }

    void loadOrders();
    const intervalId = window.setInterval(loadOrders, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => getOrderTime(a) - getOrderTime(b)),
    [orders],
  );
  const nextOrder = sortedOrders[0];
  const laterOrders = sortedOrders.slice(1);

  return (
    <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-3xl gap-5">
      <header className="flex items-end justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
            Bager
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-50">
            Næste bestilling
          </h1>
        </div>
        <p className="text-right text-xs uppercase tracking-[0.18em] text-stone-500">
          {status}
        </p>
      </header>

      {nextOrder ? (
        <section className="border border-stone-700 bg-stone-900 p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                Færdig kl.
              </p>
              <p className="mt-3 font-mono text-7xl text-stone-50">
                {formatPickupTime(nextOrder)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xl text-stone-300">
                {nextOrder.id}
              </p>
              <p className="mt-2 text-sm text-stone-500">
                {nextOrder.pizzaCount} pizzaer
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            {(nextOrder.items ?? []).map((item) => (
              <article
                key={item.pizzaId}
                className="border-t border-stone-800 pt-5"
              >
                <div className="flex items-baseline justify-between gap-5">
                  <h2 className="text-3xl font-semibold text-stone-50">
                    {item.quantity} x {item.name}
                  </h2>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.ingredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="border border-stone-700 px-3 py-1 text-xs uppercase tracking-[0.14em] text-stone-400"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="grid place-items-center border border-stone-800 p-10 text-center">
          <div>
            <p className="text-3xl font-semibold text-stone-100">
              Ingen bestillinger endnu
            </p>
            <p className="mt-3 text-stone-500">
              Siden opdaterer automatisk hvert 15. sekund.
            </p>
          </div>
        </section>
      )}

      <section className="grid gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
          Senere
        </p>
        {laterOrders.map((order) => (
          <article
            key={order.id}
            className="grid grid-cols-[100px_minmax(0,1fr)_90px] items-center gap-4 border border-stone-800 px-4 py-4"
          >
            <p className="font-mono text-3xl text-stone-100">
              {formatPickupTime(order)}
            </p>
            <div className="truncate text-stone-300">
              {(order.items ?? [])
                .map((item) => `${item.quantity} x ${item.name}`)
                .join(", ")}
            </div>
            <p className="text-right text-sm text-stone-500">
              {order.pizzaCount} stk.
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
