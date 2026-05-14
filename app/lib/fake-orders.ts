export type FakeOrder = {
  id: string;
  slotId: string;
  pickupLabel: string;
  pizzaCount: number;
  total: number;
  createdAt: string;
};

const STORAGE_KEY = "soegaards-pizza.fake-orders.v1";
const STORAGE_EVENT = "soegaards-pizza.fake-orders.updated";
const EMPTY_ORDERS: FakeOrder[] = [];
let cachedStoredValue: string | null = null;
let cachedOrders: FakeOrder[] = EMPTY_ORDERS;

function canUseStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function parseOrders(value: string | null): FakeOrder[] {
  try {
    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((order): order is FakeOrder => {
      return (
        typeof order.id === "string" &&
        typeof order.slotId === "string" &&
        typeof order.pickupLabel === "string" &&
        typeof order.pizzaCount === "number" &&
        typeof order.total === "number" &&
        typeof order.createdAt === "string"
      );
    });
  } catch {
    return [];
  }
}

export function readFakeOrders() {
  if (!canUseStorage()) {
    return EMPTY_ORDERS;
  }

  return parseOrders(window.localStorage.getItem(STORAGE_KEY));
}

export function getFakeOrdersSnapshot() {
  if (!canUseStorage()) {
    return EMPTY_ORDERS;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored === cachedStoredValue) {
    return cachedOrders;
  }

  cachedStoredValue = stored;
  cachedOrders = parseOrders(stored);

  return cachedOrders;
}

export function getFakeOrdersServerSnapshot() {
  return EMPTY_ORDERS;
}

export function subscribeToFakeOrders(callback: () => void) {
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

export function writeFakeOrders(orders: FakeOrder[]) {
  if (!canUseStorage()) {
    return;
  }

  const nextValue = JSON.stringify(orders);
  cachedStoredValue = nextValue;
  cachedOrders = orders;
  window.localStorage.setItem(STORAGE_KEY, nextValue);
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function addFakeOrder(order: FakeOrder) {
  writeFakeOrders([...readFakeOrders(), order]);
}

export function clearFakeOrders() {
  writeFakeOrders([]);
}
