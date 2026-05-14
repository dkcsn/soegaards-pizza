"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  DAILY_PIZZA_CAPACITY,
  DEFAULT_MAX_ORDER_PIZZAS,
  areLateSlotsReleasedForCapacity,
  canReservePickupSlot,
  generatePickupSlotsWithDynamicCapacity,
  generateStandardPickupSlots,
  getReservedPizzaCount,
  type PickupSlot,
} from "@/app/lib/booking";
import {
  addFakeOrder,
  getFakeOrdersServerSnapshot,
  getFakeOrdersSnapshot,
  subscribeToFakeOrders,
  type FakeOrder,
} from "@/app/lib/fake-orders";
import { formatPrice, type Pizza } from "@/app/lib/menu";
import {
  fetchSupabaseDailyCapacity,
  fetchSupabaseMaxOrderPizzas,
  fetchSupabasePizzas,
} from "@/app/lib/supabase/data";

type MenuClientProps = {
  pizzas: Pizza[];
  nowIso: string;
};

type CartItem = {
  pizza: Pizza;
  quantity: number;
};

function getSlotHour(slot: PickupSlot) {
  return slot.timeLabel.split(":")[0];
}

function buildOrderId() {
  return `SG-${Date.now().toString(36).toUpperCase()}`;
}

export function MenuClient({ pizzas, nowIso }: MenuClientProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [editablePizzas, setEditablePizzas] = useState(pizzas);
  const [dailyPizzaCapacity, setDailyPizzaCapacity] = useState(
    DAILY_PIZZA_CAPACITY,
  );
  const [maxOrderPizzas, setMaxOrderPizzas] = useState(
    DEFAULT_MAX_ORDER_PIZZAS,
  );
  const orders = useSyncExternalStore(
    subscribeToFakeOrders,
    getFakeOrdersSnapshot,
    getFakeOrdersServerSnapshot,
  );
  const now = useMemo(() => new Date(nowIso), [nowIso]);

  useEffect(() => {
    let cancelled = false;

    async function loadSupabaseData() {
      const [remoteCapacity, remoteMaxOrderPizzas, remotePizzas] =
        await Promise.all([
          fetchSupabaseDailyCapacity(),
          fetchSupabaseMaxOrderPizzas(),
          fetchSupabasePizzas(),
        ]);

      if (cancelled) {
        return;
      }

      if (typeof remoteCapacity === "number") {
        setDailyPizzaCapacity(remoteCapacity);
      }

      if (typeof remoteMaxOrderPizzas === "number") {
        setMaxOrderPizzas(remoteMaxOrderPizzas);
      }

      if (remotePizzas && remotePizzas.length > 0) {
        setEditablePizzas(remotePizzas);
      }
    }

    void loadSupabaseData();

    return () => {
      cancelled = true;
    };
  }, []);

  const activePizzas = editablePizzas.filter((pizza) => pizza.active);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce(
    (sum, item) => sum + item.pizza.price * item.quantity,
    0,
  );
  const standardSlots = useMemo(
    () => generateStandardPickupSlots(now),
    [now],
  );
  const pickupSlots = useMemo(
    () => generatePickupSlotsWithDynamicCapacity(standardSlots, orders, now),
    [now, orders, standardSlots],
  );
  const lateSlotsAreReleased = areLateSlotsReleasedForCapacity(
    orders,
    dailyPizzaCapacity,
  );
  const reservedPizzaCount = getReservedPizzaCount(orders);
  const remainingPizzaCount = Math.max(
    dailyPizzaCapacity - reservedPizzaCount,
    0,
  );
  const requestedPizzaCount = Math.max(itemCount, 1);
  const isSlotAvailable = (slot: PickupSlot) =>
    canReservePickupSlot(
      standardSlots,
      orders,
      slot,
      requestedPizzaCount,
      dailyPizzaCapacity,
    );
  const firstAvailableSlot = pickupSlots.find(isSlotAvailable);
  const hours = Array.from(new Set(pickupSlots.map(getSlotHour)));
  const effectiveHour =
    selectedHour &&
    pickupSlots.some((slot) => getSlotHour(slot) === selectedHour && isSlotAvailable(slot))
      ? selectedHour
      : firstAvailableSlot
        ? getSlotHour(firstAvailableSlot)
        : hours[0] ?? "";
  const visibleSlots = pickupSlots.filter((slot) => getSlotHour(slot) === effectiveHour);
  const effectiveSlotId =
    selectedSlotId &&
    pickupSlots.some((slot) => slot.id === selectedSlotId && isSlotAvailable(slot))
      ? selectedSlotId
      : visibleSlots.find(isSlotAvailable)?.id ?? firstAvailableSlot?.id ?? "";
  const selectedSlot = pickupSlots.find((slot) => slot.id === effectiveSlotId);
  const capacityProblem = itemCount > remainingPizzaCount;
  const orderLimitProblem = itemCount > maxOrderPizzas;
  const canPay =
    itemCount > 0 &&
    selectedSlot !== undefined &&
    !capacityProblem &&
    !orderLimitProblem &&
    canReservePickupSlot(
      standardSlots,
      orders,
      selectedSlot,
      itemCount,
      dailyPizzaCapacity,
    ) &&
    !isPaying;

  function setQuantity(pizza: Pizza, quantity: number) {
    setCart((current) => {
      const nextQuantity = Math.max(0, Math.min(quantity, maxOrderPizzas));
      const otherPizzaCount = current.reduce(
        (sum, item) => sum + (item.pizza.id === pizza.id ? 0 : item.quantity),
        0,
      );
      const allowedQuantity = Math.min(
        nextQuantity,
        Math.max(maxOrderPizzas - otherPizzaCount, 0),
      );
      const existing = current.find((item) => item.pizza.id === pizza.id);

      if (allowedQuantity === 0) {
        return current.filter((item) => item.pizza.id !== pizza.id);
      }

      if (existing) {
        return current.map((item) =>
          item.pizza.id === pizza.id
            ? { ...item, quantity: allowedQuantity }
            : item,
        );
      }

      return [...current, { pizza, quantity: allowedQuantity }];
    });
  }

  function getQuantity(pizzaId: string) {
    return cart.find((item) => item.pizza.id === pizzaId)?.quantity ?? 0;
  }

  function completeFakePayment() {
    if (!selectedSlot || !canPay) {
      return;
    }

    setIsPaying(true);

    const orderId = buildOrderId();
    const order: FakeOrder = {
      id: orderId,
      slotId: selectedSlot.id,
      pickupLabel: selectedSlot.label,
      pizzaCount: itemCount,
      total,
      createdAt: new Date().toISOString(),
    };

    addFakeOrder(order);

    const params = new URLSearchParams({
      order: order.id,
      pickup: order.pickupLabel,
      pizzas: String(order.pizzaCount),
      total: String(order.total),
    });

    window.setTimeout(() => {
      router.push(`/order-confirmation?${params.toString()}`);
    }, 450);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="grid gap-5">
        {activePizzas.map((pizza) => {
          const quantity = getQuantity(pizza.id);
          const canAddPizza = itemCount < maxOrderPizzas;

          return (
            <article
              key={pizza.id}
              className="border border-stone-800 bg-stone-950 p-6 md:p-7"
            >
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_160px]">
                <div>
                  {pizza.imageUrl ? (
                    <div className="mb-5 aspect-[5/3] overflow-hidden border border-stone-800 bg-stone-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pizza.imageUrl}
                        alt={pizza.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                    <h2 className="text-2xl font-semibold text-stone-50">
                      {pizza.name}
                    </h2>
                    <p className="font-mono text-sm text-stone-500">
                      {formatPrice(pizza.price)}
                    </p>
                  </div>
                  <p className="mt-4 max-w-2xl leading-7 text-stone-300">
                    {pizza.description}
                  </p>
                </div>

                <div className="grid h-12 grid-cols-[48px_1fr_48px] border border-stone-800">
                  <button
                    type="button"
                    disabled={quantity === 0}
                    onClick={() => setQuantity(pizza, quantity - 1)}
                    className="border-r border-stone-800 text-xl text-stone-400 transition hover:bg-stone-900 hover:text-stone-100 disabled:cursor-not-allowed disabled:text-stone-700"
                    aria-label={`Remove one ${pizza.name}`}
                  >
                    -
                  </button>
                  <span className="grid place-items-center font-mono text-sm text-stone-100">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={!canAddPizza}
                    onClick={() => setQuantity(pizza, quantity + 1)}
                    className="border-l border-stone-800 text-xl text-stone-300 transition hover:bg-stone-900 hover:text-stone-50 disabled:cursor-not-allowed disabled:text-stone-700"
                    aria-label={`Add one ${pizza.name}`}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                {pizza.ingredients.map((ingredient) => (
                  <span
                    key={ingredient}
                    className="border border-stone-800 px-3 py-1 text-xs uppercase tracking-[0.14em] text-stone-500"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>

              <p className="mt-6 text-xs uppercase tracking-[0.22em] text-stone-600">
                Fixed recipe. No modifications.
              </p>
            </article>
          );
        })}
      </section>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="border border-stone-800 bg-stone-950 p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Preorder
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-stone-50">
            Kurv
          </h2>

          <div className="mt-7 space-y-4">
            {cart.length === 0 ? (
              <p className="leading-7 text-stone-500">
                Vælg pizzaer fra den faste menu. Ordren betales først med fake
                betaling i denne MVP.
              </p>
            ) : (
              cart.map((item) => (
                <div
                  key={item.pizza.id}
                  className="flex items-start justify-between gap-4 text-sm"
                >
                  <div>
                    <p className="font-medium text-stone-100">
                      {item.quantity} x {item.pizza.name}
                    </p>
                    <p className="mt-1 text-stone-500">
                      {formatPrice(item.pizza.price)} stk.
                    </p>
                  </div>
                  <p className="font-mono text-stone-300">
                    {formatPrice(item.pizza.price * item.quantity)}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 border-t border-stone-800 pt-6">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
              Afhentningstid
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {hours.map((hour) => {
                const hourSlots = pickupSlots.filter((slot) => getSlotHour(slot) === hour);
                const openCount = hourSlots.filter(isSlotAvailable).length;
                const isSelected = hour === effectiveHour;

                return (
                  <button
                    key={hour}
                    type="button"
                    disabled={openCount === 0}
                    onClick={() => {
                      const firstOpenSlot = hourSlots.find(isSlotAvailable);
                      setSelectedHour(hour);
                      setSelectedSlotId(firstOpenSlot?.id ?? "");
                    }}
                    className={[
                      "border px-3 py-3 text-left transition",
                      isSelected
                        ? "border-stone-100 bg-stone-100 text-stone-950"
                        : "border-stone-800 text-stone-300 hover:border-stone-500 hover:bg-stone-900",
                      openCount === 0 ? "cursor-not-allowed text-stone-700" : "",
                    ].join(" ")}
                  >
                    <span className="block font-mono text-lg">{hour}</span>
                    <span className="mt-1 block text-xs uppercase tracking-[0.14em]">
                      {openCount > 0 ? `${openCount} open` : "locked"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {visibleSlots.map((slot) => {
                const isAvailable = isSlotAvailable(slot);
                const isSelected = slot.id === effectiveSlotId;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={[
                      "border px-3 py-3 font-mono text-sm transition",
                      isSelected
                        ? "border-stone-100 bg-stone-100 text-stone-950"
                        : "border-stone-800 text-stone-300 hover:border-stone-500 hover:bg-stone-900",
                      !isAvailable
                        ? "cursor-not-allowed border-stone-900 text-stone-700 line-through"
                        : "",
                    ].join(" ")}
                  >
                    {slot.timeLabel}
                  </button>
                );
              })}
            </div>

            {!lateSlotsAreReleased ? (
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Sene tider åbner, når tidligere kapacitet er tættere booket.
              </p>
            ) : null}
          </div>

          <div className="mt-8 border-t border-stone-800 pt-6">
            <div className="flex items-center justify-between gap-4">
              <span className="text-stone-400">Tilbage i aften</span>
              <span className="font-mono text-stone-100">
                {remainingPizzaCount}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="text-stone-400">Total</span>
              <span className="font-mono text-xl text-stone-50">
                {formatPrice(total)}
              </span>
            </div>

            {capacityProblem ? (
              <p className="mt-4 text-sm leading-6 text-stone-400">
                Der er kun {remainingPizzaCount} pizzaer tilbage i aften.
              </p>
            ) : null}
            {orderLimitProblem ? (
              <p className="mt-4 text-sm leading-6 text-stone-400">
                En bestilling kan højst have {maxOrderPizzas} pizzaer.
              </p>
            ) : null}

            <button
              type="button"
              disabled={!canPay}
              onClick={completeFakePayment}
              className="mt-6 w-full bg-stone-100 px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-stone-950 transition hover:bg-stone-300 disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-500"
            >
              {isPaying ? "Betaler" : "Fake betal ordre"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
