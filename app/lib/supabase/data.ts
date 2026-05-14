import {
  DAILY_PIZZA_CAPACITY,
  DEFAULT_MAX_ORDER_PIZZAS,
  RELEASE_CONTROL_ENABLED,
} from "@/app/lib/booking";
import type { FakeOrder, OrderItem } from "@/app/lib/fake-orders";
import type { Pizza } from "@/app/lib/menu";
import { createSupabaseClient } from "@/app/lib/supabase/client";

type PizzaRow = {
  id: string;
  name: string;
  price: number;
  description: string;
  ingredients: string[];
  active: boolean;
  image_url: string | null;
  sort_order: number;
};

type OrderRow = {
  id: string;
  slot_id: string;
  pickup_label: string;
  pickup_time: string;
  pizza_count: number;
  total: number;
  items: OrderItem[];
  status?: string;
  completed_at?: string | null;
  created_at: string;
};

function rowToPizza(row: PizzaRow): Pizza {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    description: row.description,
    ingredients: row.ingredients,
    active: row.active,
    imageUrl: row.image_url ?? "",
  };
}

function pizzaToRow(pizza: Pizza, sortOrder: number) {
  return {
    id: pizza.id,
    name: pizza.name,
    price: pizza.price,
    description: pizza.description,
    ingredients: pizza.ingredients,
    active: pizza.active,
    image_url: pizza.imageUrl || null,
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  };
}

function rowToOrder(row: OrderRow): FakeOrder {
  return {
    id: row.id,
    slotId: row.slot_id,
    pickupLabel: row.pickup_label,
    pickupTime: row.pickup_time,
    pizzaCount: row.pizza_count,
    total: row.total,
    items: row.items,
    createdAt: row.created_at,
  };
}

function orderToRow(order: FakeOrder) {
  return {
    id: order.id,
    slot_id: order.slotId,
    pickup_label: order.pickupLabel,
    pickup_time: order.pickupTime ?? new Date().toISOString(),
    pizza_count: order.pizzaCount,
    total: order.total,
    items: order.items ?? [],
    created_at: order.createdAt,
  };
}

export async function fetchSupabasePizzas() {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("pizzas")
    .select(
      "id, name, price, description, ingredients, active, image_url, sort_order",
    )
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return null;
  }

  return data.map((row) => rowToPizza(row as PizzaRow));
}

export async function upsertSupabasePizza(pizza: Pizza, sortOrder = 100) {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from("pizzas")
    .upsert(pizzaToRow(pizza, sortOrder), { onConflict: "id" });

  return !error;
}

export async function deleteSupabasePizza(pizzaId: string) {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("pizzas").delete().eq("id", pizzaId);

  return !error;
}

async function fetchNumberSetting(key: string, fallback: number) {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error || !data) {
    return null;
  }

  const value = data.value as { value?: unknown };

  return typeof value.value === "number" ? value.value : fallback;
}

async function updateNumberSetting(key: string, value: number) {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("settings").upsert(
    {
      key,
      value: { value },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  return !error;
}

async function fetchBooleanSetting(key: string, fallback: boolean) {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error || !data) {
    return null;
  }

  const value = data.value as { value?: unknown };

  return typeof value.value === "boolean" ? value.value : fallback;
}

async function updateBooleanSetting(key: string, value: boolean) {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("settings").upsert(
    {
      key,
      value: { value },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  return !error;
}

export async function fetchSupabaseDailyCapacity() {
  return fetchNumberSetting("daily_pizza_capacity", DAILY_PIZZA_CAPACITY);
}

export async function updateSupabaseDailyCapacity(value: number) {
  return updateNumberSetting("daily_pizza_capacity", value);
}

export async function fetchSupabaseMaxOrderPizzas() {
  return fetchNumberSetting("max_order_pizzas", DEFAULT_MAX_ORDER_PIZZAS);
}

export async function updateSupabaseMaxOrderPizzas(value: number) {
  return updateNumberSetting("max_order_pizzas", value);
}

export async function fetchSupabaseReleaseControlEnabled() {
  return fetchBooleanSetting("release_control_enabled", RELEASE_CONTROL_ENABLED);
}

export async function updateSupabaseReleaseControlEnabled(value: boolean) {
  return updateBooleanSetting("release_control_enabled", value);
}

export async function addSupabaseOrder(order: FakeOrder) {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from("orders")
    .insert(orderToRow(order));

  return !error;
}

export async function fetchSupabaseOrders() {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, slot_id, pickup_label, pickup_time, pizza_count, total, items, status, completed_at, created_at",
    )
    .eq("status", "pending")
    .order("pickup_time", { ascending: true });

  if (error || !data) {
    return null;
  }

  return data.map((row) => rowToOrder(row as OrderRow));
}

export async function completeSupabaseOrder(orderId: string) {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  return !error;
}

export async function clearSupabaseOrders() {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from("orders")
    .delete()
    .neq("id", "");

  return !error;
}
