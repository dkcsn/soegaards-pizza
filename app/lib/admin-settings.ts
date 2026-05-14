"use client";

import { DAILY_PIZZA_CAPACITY } from "@/app/lib/booking";

export type AdminSettings = {
  dailyPizzaCapacity: number;
};

const STORAGE_KEY = "soegaards-pizza.admin-settings.v1";
const STORAGE_EVENT = "soegaards-pizza.admin-settings.updated";

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  dailyPizzaCapacity: DAILY_PIZZA_CAPACITY,
};

let cachedStoredValue: string | null = null;
let cachedSettings = DEFAULT_ADMIN_SETTINGS;

function canUseStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function normalizeCapacity(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DAILY_PIZZA_CAPACITY;
  }

  return Math.max(1, Math.min(Math.round(value), 120));
}

function parseSettings(value: string | null) {
  try {
    if (!value) {
      return DEFAULT_ADMIN_SETTINGS;
    }

    const parsed = JSON.parse(value);

    return {
      dailyPizzaCapacity: normalizeCapacity(parsed?.dailyPizzaCapacity),
    };
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

export function getAdminSettingsSnapshot() {
  if (!canUseStorage()) {
    return DEFAULT_ADMIN_SETTINGS;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored === cachedStoredValue) {
    return cachedSettings;
  }

  cachedStoredValue = stored;
  cachedSettings = parseSettings(stored);

  return cachedSettings;
}

export function getAdminSettingsServerSnapshot() {
  return DEFAULT_ADMIN_SETTINGS;
}

export function subscribeToAdminSettings(callback: () => void) {
  if (!canUseStorage()) {
    return () => {};
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) {
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

export function writeAdminSettings(settings: AdminSettings) {
  if (!canUseStorage()) {
    return;
  }

  const normalizedSettings = {
    dailyPizzaCapacity: normalizeCapacity(settings.dailyPizzaCapacity),
  };
  const nextValue = JSON.stringify(normalizedSettings);
  cachedStoredValue = nextValue;
  cachedSettings = normalizedSettings;
  window.localStorage.setItem(STORAGE_KEY, nextValue);
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function updateDailyPizzaCapacity(dailyPizzaCapacity: number) {
  writeAdminSettings({
    ...getAdminSettingsSnapshot(),
    dailyPizzaCapacity,
  });
}
