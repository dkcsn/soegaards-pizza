"use client";

import type { Pizza } from "@/app/lib/menu";

export type PizzaOverride = Partial<Omit<Pizza, "id">>;

const STORAGE_KEY = "soegaards-pizza.menu-overrides.v1";
const CUSTOM_STORAGE_KEY = "soegaards-pizza.custom-pizzas.v1";
const STORAGE_EVENT = "soegaards-pizza.menu-overrides.updated";
const EMPTY_OVERRIDES: Record<string, PizzaOverride> = {};
const EMPTY_CUSTOM_PIZZAS: Pizza[] = [];
let cachedStoredValue: string | null = null;
let cachedOverrides: Record<string, PizzaOverride> = EMPTY_OVERRIDES;
let cachedCustomStoredValue: string | null = null;
let cachedCustomPizzas: Pizza[] = EMPTY_CUSTOM_PIZZAS;

function canUseStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function parseOverrides(value: string | null) {
  try {
    if (!value) {
      return EMPTY_OVERRIDES;
    }

    const parsed = JSON.parse(value);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return EMPTY_OVERRIDES;
    }

    return parsed as Record<string, PizzaOverride>;
  } catch {
    return EMPTY_OVERRIDES;
  }
}

function isPizza(value: unknown): value is Pizza {
  if (!value || typeof value !== "object") {
    return false;
  }

  const pizza = value as Pizza;

  return (
    typeof pizza.id === "string" &&
    typeof pizza.name === "string" &&
    typeof pizza.price === "number" &&
    typeof pizza.description === "string" &&
    Array.isArray(pizza.ingredients) &&
    typeof pizza.active === "boolean"
  );
}

function parseCustomPizzas(value: string | null) {
  try {
    if (!value) {
      return EMPTY_CUSTOM_PIZZAS;
    }

    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return EMPTY_CUSTOM_PIZZAS;
    }

    return parsed.filter(isPizza);
  } catch {
    return EMPTY_CUSTOM_PIZZAS;
  }
}

export function getMenuOverridesSnapshot() {
  if (!canUseStorage()) {
    return EMPTY_OVERRIDES;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored === cachedStoredValue) {
    return cachedOverrides;
  }

  cachedStoredValue = stored;
  cachedOverrides = parseOverrides(stored);

  return cachedOverrides;
}

export function getMenuOverridesServerSnapshot() {
  return EMPTY_OVERRIDES;
}

export function getCustomPizzasSnapshot() {
  if (!canUseStorage()) {
    return EMPTY_CUSTOM_PIZZAS;
  }

  const stored = window.localStorage.getItem(CUSTOM_STORAGE_KEY);

  if (stored === cachedCustomStoredValue) {
    return cachedCustomPizzas;
  }

  cachedCustomStoredValue = stored;
  cachedCustomPizzas = parseCustomPizzas(stored);

  return cachedCustomPizzas;
}

export function getCustomPizzasServerSnapshot() {
  return EMPTY_CUSTOM_PIZZAS;
}

export function subscribeToMenuOverrides(callback: () => void) {
  if (!canUseStorage()) {
    return () => {};
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === CUSTOM_STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORAGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

export function mergeMenuWithOverrides(
  pizzas: Pizza[],
  overrides: Record<string, PizzaOverride>,
  customPizzas: Pizza[] = EMPTY_CUSTOM_PIZZAS,
) {
  const basePizzas = pizzas.map((pizza) => ({
    ...pizza,
    ...overrides[pizza.id],
  }));

  return [...basePizzas, ...customPizzas];
}

export function writeMenuOverrides(overrides: Record<string, PizzaOverride>) {
  if (!canUseStorage()) {
    return;
  }

  const nextValue = JSON.stringify(overrides);
  cachedStoredValue = nextValue;
  cachedOverrides = overrides;
  window.localStorage.setItem(STORAGE_KEY, nextValue);
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function updatePizzaOverride(pizzaId: string, update: PizzaOverride) {
  const current = getMenuOverridesSnapshot();

  writeMenuOverrides({
    ...current,
    [pizzaId]: {
      ...current[pizzaId],
      ...update,
    },
  });
}

export function writeCustomPizzas(pizzas: Pizza[]) {
  if (!canUseStorage()) {
    return;
  }

  const nextValue = JSON.stringify(pizzas);
  cachedCustomStoredValue = nextValue;
  cachedCustomPizzas = pizzas;
  window.localStorage.setItem(CUSTOM_STORAGE_KEY, nextValue);
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function addCustomPizza() {
  const customPizzas = getCustomPizzasSnapshot();
  const id = `custom-${Date.now().toString(36)}`;

  writeCustomPizzas([
    ...customPizzas,
    {
      id,
      name: "Ny pizza",
      price: 165,
      description: "Beskrivelse af pizzaen.",
      ingredients: ["ingrediens"],
      active: true,
      imageUrl: "",
    },
  ]);
}

export function updateCustomPizza(pizzaId: string, update: PizzaOverride) {
  writeCustomPizzas(
    getCustomPizzasSnapshot().map((pizza) =>
      pizza.id === pizzaId ? { ...pizza, ...update } : pizza,
    ),
  );
}

export function deleteCustomPizza(pizzaId: string) {
  writeCustomPizzas(
    getCustomPizzasSnapshot().filter((pizza) => pizza.id !== pizzaId),
  );
}

export function resetPizzaOverride(pizzaId: string) {
  const current = getMenuOverridesSnapshot();
  const { [pizzaId]: _removed, ...rest } = current;
  void _removed;

  writeMenuOverrides(rest);
}

export function listToInput(value: string[]) {
  return value.join(", ");
}

export function inputToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
