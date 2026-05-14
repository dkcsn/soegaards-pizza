"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  clearFakeOrders,
  getFakeOrdersServerSnapshot,
  getFakeOrdersSnapshot,
  subscribeToFakeOrders,
  type FakeOrder,
} from "@/app/lib/fake-orders";
import { formatPrice, type Pizza } from "@/app/lib/menu";
import { DEFAULT_ADMIN_SETTINGS } from "@/app/lib/admin-settings";
import {
  inputToList,
  listToInput,
  type PizzaOverride,
} from "@/app/lib/menu-overrides";
import {
  clearSupabaseOrders,
  deleteSupabasePizza,
  fetchSupabaseDailyCapacity,
  fetchSupabaseMaxOrderPizzas,
  fetchSupabaseOrders,
  fetchSupabasePizzas,
  updateSupabaseDailyCapacity,
  updateSupabaseMaxOrderPizzas,
  upsertSupabasePizza,
} from "@/app/lib/supabase/data";

type AdminClientProps = {
  pizzas: Pizza[];
};

export function AdminClient({ pizzas }: AdminClientProps) {
  const [dailyCapacity, setDailyCapacity] = useState(
    DEFAULT_ADMIN_SETTINGS.dailyPizzaCapacity,
  );
  const [maxOrderPizzas, setMaxOrderPizzas] = useState(
    DEFAULT_ADMIN_SETTINGS.maxOrderPizzas,
  );
  const [editablePizzas, setEditablePizzas] = useState(pizzas);
  const [status, setStatus] = useState("Config fallback");
  const [isConfirmingClearOrders, setIsConfirmingClearOrders] = useState(false);
  const [remoteOrders, setRemoteOrders] = useState<FakeOrder[] | null>(null);
  const orders = useSyncExternalStore(
    subscribeToFakeOrders,
    getFakeOrdersSnapshot,
    getFakeOrdersServerSnapshot,
  );
  const activePizzaCount = editablePizzas.filter((pizza) => pizza.active).length;
  const visibleOrders = remoteOrders ?? orders;
  const orderedPizzaCount = visibleOrders.reduce(
    (sum, order) => sum + order.pizzaCount,
    0,
  );
  const sortOrderByPizzaId = useMemo(
    () =>
      new Map(
        editablePizzas.map((pizza, index) => [pizza.id, (index + 1) * 10]),
      ),
    [editablePizzas],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSupabaseData() {
      const [
        remoteCapacity,
        remoteMaxOrderPizzas,
        remotePizzas,
        loadedOrders,
      ] =
        await Promise.all([
          fetchSupabaseDailyCapacity(),
          fetchSupabaseMaxOrderPizzas(),
          fetchSupabasePizzas(),
          fetchSupabaseOrders(),
        ]);

      if (cancelled) {
        return;
      }

      if (typeof remoteCapacity === "number") {
        setDailyCapacity(remoteCapacity);
      }

      if (typeof remoteMaxOrderPizzas === "number") {
        setMaxOrderPizzas(remoteMaxOrderPizzas);
      }

      if (remotePizzas && remotePizzas.length > 0) {
        setEditablePizzas(remotePizzas);
        setStatus("Supabase connected");
      } else {
        setStatus("Run Supabase schema");
      }

      if (loadedOrders) {
        setRemoteOrders(loadedOrders);
      }
    }

    void loadSupabaseData();

    return () => {
      cancelled = true;
    };
  }, []);

  function updatePizza(pizza: Pizza, update: PizzaOverride) {
    const nextPizza = { ...pizza, ...update };
    setEditablePizzas((current) =>
      current.map((candidate) =>
        candidate.id === pizza.id ? nextPizza : candidate,
      ),
    );

    void upsertSupabasePizza(
      nextPizza,
      sortOrderByPizzaId.get(pizza.id) ?? 100,
    );
  }

  function deletePizza(pizza: Pizza) {
    setEditablePizzas((current) =>
      current.filter((candidate) => candidate.id !== pizza.id),
    );
    void deleteSupabasePizza(pizza.id);
  }

  function addPizza() {
    const pizza: Pizza = {
      id: `custom-${Date.now().toString(36)}`,
      name: "Ny pizza",
      price: 165,
      description: "Beskrivelse af pizzaen.",
      ingredients: ["ingrediens"],
      active: false,
      imageUrl: "",
    };

    setEditablePizzas((current) => [...current, pizza]);
    void upsertSupabasePizza(pizza, (editablePizzas.length + 1) * 10);
  }

  function updateCapacity(value: number) {
    const nextValue = Math.max(1, Math.min(Math.round(value || 1), 120));
    setDailyCapacity(nextValue);
    void updateSupabaseDailyCapacity(nextValue);
  }

  function updateMaxOrder(value: number) {
    const nextValue = Math.max(1, Math.min(Math.round(value || 1), 30));
    setMaxOrderPizzas(nextValue);
    void updateSupabaseMaxOrderPizzas(nextValue);
  }

  function clearTestOrders() {
    clearFakeOrders();
    setRemoteOrders([]);
    void clearSupabaseOrders();
    setIsConfirmingClearOrders(false);
  }

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="border border-stone-800 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
            Dagens kapacitet
          </p>
          <label className="mt-4 block">
            <input
              type="text"
              inputMode="numeric"
              value={dailyCapacity}
              onChange={(event) => updateCapacity(Number(event.target.value))}
              className="w-full border border-stone-800 bg-stone-950 px-3 py-3 font-mono text-4xl text-stone-50 outline-none focus:border-stone-500"
            />
          </label>
          <p className="mt-2 text-sm text-stone-500">pizzaer pr. aften</p>
        </div>

        <div className="border border-stone-800 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
            Aktive pizzaer
          </p>
          <p className="mt-4 font-mono text-4xl text-stone-50">
            {activePizzaCount}
          </p>
          <p className="mt-2 text-sm text-stone-500">
            {editablePizzas.length - activePizzaCount} skjult
          </p>
        </div>

        <div className="border border-stone-800 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
            Max pr. ordre
          </p>
          <label className="mt-4 block">
            <input
              type="text"
              inputMode="numeric"
              value={maxOrderPizzas}
              onChange={(event) => updateMaxOrder(Number(event.target.value))}
              className="w-full border border-stone-800 bg-stone-950 px-3 py-3 font-mono text-4xl text-stone-50 outline-none focus:border-stone-500"
            />
          </label>
          <p className="mt-2 text-sm text-stone-500">pizzaer pr. bestilling</p>
        </div>

        <div className="border border-stone-800 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
            Tilføj pizza
          </p>
          <button
            type="button"
            onClick={addPizza}
            className="mt-4 w-full border border-stone-700 px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-stone-300 transition hover:border-stone-400 hover:text-stone-50"
          >
            Ny pizza
          </button>
          <p className="mt-2 text-sm text-stone-500">
            {status}
          </p>
        </div>
      </section>

      <section className="border border-stone-800 p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
              Testbestillinger
            </p>
            <p className="mt-3 text-2xl font-semibold text-stone-50">
              {orderedPizzaCount} pizzaer reserveret
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              Sletter fake betalinger og låste testtider i denne browser.
            </p>
          </div>

          {!isConfirmingClearOrders ? (
            <button
              type="button"
              disabled={visibleOrders.length === 0}
              onClick={() => setIsConfirmingClearOrders(true)}
              className="border border-stone-700 px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-300 transition hover:border-stone-400 hover:text-stone-50 disabled:cursor-not-allowed disabled:text-stone-700"
            >
              Slet testbestillinger
            </button>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsConfirmingClearOrders(false)}
                className="border border-stone-800 px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-400 transition hover:border-stone-500 hover:text-stone-100"
              >
                Annuller
              </button>
              <button
                type="button"
                onClick={clearTestOrders}
                className="border border-stone-200 bg-stone-100 px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-950 transition hover:bg-stone-300"
              >
                Bekræft sletning
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="border border-stone-800">
        {editablePizzas.map((pizza) => (
        <article
          key={pizza.id}
          className="border-b border-stone-800 p-5 last:border-b-0"
        >
          <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)_110px_100px]">
            <div className="aspect-square overflow-hidden border border-stone-800 bg-stone-900">
              {pizza.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pizza.imageUrl}
                  alt={pizza.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center px-3 text-center text-xs uppercase tracking-[0.14em] text-stone-700">
                  No image
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-semibold text-stone-50">
                  {pizza.name}
                </h3>
                <span className="border border-stone-800 px-2 py-1 text-xs uppercase tracking-[0.16em] text-stone-500">
                  {pizza.active ? "Active" : "Hidden"}
                </span>
              </div>
              <p className="mt-3 leading-7 text-stone-400">
                {pizza.description}
              </p>
            </div>
            <p className="font-mono text-stone-100 md:text-right">
              {formatPrice(pizza.price)}
            </p>
            <p className="text-sm uppercase tracking-[0.18em] text-stone-600 md:text-right">
              No mods
            </p>
          </div>

          <details className="mt-5 border border-stone-900">
            <summary className="cursor-pointer px-4 py-3 text-sm text-stone-400">
              Edit pizza
            </summary>

            <div className="grid gap-4 border-t border-stone-900 p-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.18em] text-stone-600">
                  Name
                </span>
                <input
                  value={pizza.name}
                  onChange={(event) =>
                    updatePizza(pizza, {
                      name: event.target.value,
                    })
                  }
                  className="mt-2 w-full border border-stone-800 bg-stone-950 px-3 py-3 text-stone-100 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.18em] text-stone-600">
                  Price
                </span>
                <input
                  type="number"
                  min="0"
                  value={pizza.price}
                  onChange={(event) =>
                    updatePizza(pizza, {
                      price: Number(event.target.value),
                    })
                  }
                  className="mt-2 w-full border border-stone-800 bg-stone-950 px-3 py-3 font-mono text-stone-100 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs uppercase tracking-[0.18em] text-stone-600">
                  Description
                </span>
                <textarea
                  value={pizza.description}
                  onChange={(event) =>
                    updatePizza(pizza, {
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  className="mt-2 w-full border border-stone-800 bg-stone-950 px-3 py-3 text-stone-100 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs uppercase tracking-[0.18em] text-stone-600">
                  Ingredients
                </span>
                <input
                  value={listToInput(pizza.ingredients)}
                  onChange={(event) =>
                    updatePizza(pizza, {
                      ingredients: inputToList(event.target.value),
                    })
                  }
                  className="mt-2 w-full border border-stone-800 bg-stone-950 px-3 py-3 text-stone-100 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs uppercase tracking-[0.18em] text-stone-600">
                  Image URL
                </span>
                <input
                  value={pizza.imageUrl ?? ""}
                  onChange={(event) =>
                    updatePizza(pizza, {
                      imageUrl: event.target.value,
                    })
                  }
                  placeholder="https://..."
                  className="mt-2 w-full border border-stone-800 bg-stone-950 px-3 py-3 text-stone-100 outline-none focus:border-stone-500"
                />
              </label>

              <label className="flex items-center justify-between gap-4 border border-stone-800 px-4 py-3 md:col-span-2">
                <span className="text-sm text-stone-300">
                  Show on customer menu
                </span>
                <input
                  type="checkbox"
                  checked={pizza.active}
                  onChange={(event) =>
                    updatePizza(pizza, {
                      active: event.target.checked,
                    })
                  }
                  className="h-5 w-5 accent-stone-100"
                />
              </label>

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => deletePizza(pizza)}
                  className="w-full border border-stone-800 px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-400 transition hover:border-stone-500 hover:text-stone-100"
                >
                  Slet pizza
                </button>
              </div>
            </div>
          </details>
        </article>
        ))}
      </div>
    </div>
  );
}
