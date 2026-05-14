import { DAILY_PIZZA_CAPACITY } from "@/app/lib/booking";
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

export async function fetchSupabaseDailyCapacity() {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "daily_pizza_capacity")
    .single();

  if (error || !data) {
    return null;
  }

  const value = data.value as { value?: unknown };

  return typeof value.value === "number" ? value.value : DAILY_PIZZA_CAPACITY;
}

export async function updateSupabaseDailyCapacity(value: number) {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("settings").upsert(
    {
      key: "daily_pizza_capacity",
      value: { value },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  return !error;
}
