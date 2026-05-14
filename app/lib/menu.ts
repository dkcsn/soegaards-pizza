import menu from "@/app/config/menu.json";

export type Pizza = {
  id: string;
  name: string;
  price: number;
  description: string;
  ingredients: string[];
  active: boolean;
  imageUrl?: string;
};

export const pizzas = menu satisfies Pizza[];

export function getActivePizzas() {
  return pizzas.filter((pizza) => pizza.active);
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(price);
}
