"use client";

import { useSyncExternalStore } from "react";
import { formatPrice, type Pizza } from "@/app/lib/menu";
import {
  getAdminSettingsServerSnapshot,
  getAdminSettingsSnapshot,
  subscribeToAdminSettings,
  updateDailyPizzaCapacity,
} from "@/app/lib/admin-settings";
import {
  addCustomPizza,
  deleteCustomPizza,
  getCustomPizzasServerSnapshot,
  getCustomPizzasSnapshot,
  getMenuOverridesServerSnapshot,
  getMenuOverridesSnapshot,
  inputToList,
  listToInput,
  mergeMenuWithOverrides,
  resetPizzaOverride,
  subscribeToMenuOverrides,
  updateCustomPizza,
  updatePizzaOverride,
  type PizzaOverride,
} from "@/app/lib/menu-overrides";

type AdminClientProps = {
  pizzas: Pizza[];
};

export function AdminClient({ pizzas }: AdminClientProps) {
  const adminSettings = useSyncExternalStore(
    subscribeToAdminSettings,
    getAdminSettingsSnapshot,
    getAdminSettingsServerSnapshot,
  );
  const menuOverrides = useSyncExternalStore(
    subscribeToMenuOverrides,
    getMenuOverridesSnapshot,
    getMenuOverridesServerSnapshot,
  );
  const customPizzas = useSyncExternalStore(
    subscribeToMenuOverrides,
    getCustomPizzasSnapshot,
    getCustomPizzasServerSnapshot,
  );
  const editablePizzas = mergeMenuWithOverrides(
    pizzas,
    menuOverrides,
    customPizzas,
  );
  const basePizzaIds = new Set(pizzas.map((pizza) => pizza.id));
  const activePizzaCount = editablePizzas.filter((pizza) => pizza.active).length;

  function updatePizza(pizza: Pizza, update: PizzaOverride) {
    if (basePizzaIds.has(pizza.id)) {
      updatePizzaOverride(pizza.id, update);
      return;
    }

    updateCustomPizza(pizza.id, update);
  }

  function deletePizza(pizza: Pizza) {
    if (basePizzaIds.has(pizza.id)) {
      updatePizzaOverride(pizza.id, { active: false });
      return;
    }

    deleteCustomPizza(pizza.id);
  }

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="border border-stone-800 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
            Dagens kapacitet
          </p>
          <label className="mt-4 block">
            <input
              type="text"
              inputMode="numeric"
              value={adminSettings.dailyPizzaCapacity}
              onChange={(event) =>
                updateDailyPizzaCapacity(Number(event.target.value))
              }
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
            Tilføj pizza
          </p>
          <button
            type="button"
            onClick={addCustomPizza}
            className="mt-4 w-full border border-stone-700 px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-stone-300 transition hover:border-stone-400 hover:text-stone-50"
          >
            Ny pizza
          </button>
          <p className="mt-2 text-sm text-stone-500">
            Gemmes lokalt i browseren
          </p>
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

              <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => resetPizzaOverride(pizza.id)}
                  disabled={!basePizzaIds.has(pizza.id)}
                  className="border border-stone-800 px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-400 transition hover:border-stone-500 hover:text-stone-100 disabled:cursor-not-allowed disabled:text-stone-700"
                >
                  Reset pizza
                </button>
                <button
                  type="button"
                  onClick={() => deletePizza(pizza)}
                  className="border border-stone-800 px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-400 transition hover:border-stone-500 hover:text-stone-100"
                >
                  {basePizzaIds.has(pizza.id) ? "Skjul pizza" : "Slet pizza"}
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
