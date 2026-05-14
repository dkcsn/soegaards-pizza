import Link from "next/link";
import { formatPrice } from "@/app/lib/menu";

type OrderConfirmationPageProps = {
  searchParams: Promise<{
    order?: string;
    pickup?: string;
    pizzas?: string;
    total?: string;
  }>;
};

export const metadata = {
  title: "Order confirmation | Søgaard's Pizza",
};

export default async function OrderConfirmationPage({
  searchParams,
}: OrderConfirmationPageProps) {
  const params = await searchParams;
  const total = Number(params.total ?? 0);

  return (
    <main className="min-h-screen bg-stone-950 px-6 pb-20 pt-32 text-stone-100">
      <section className="mx-auto max-w-3xl border border-stone-800 p-8 md:p-10">
        <p className="text-sm uppercase tracking-[0.35em] text-stone-500">
          Ordre bekræftet
        </p>
        <h1 className="mt-5 text-4xl font-semibold text-stone-50 md:text-6xl">
          Vi fyrer op i ovnen.
        </h1>
        <p className="mt-6 max-w-2xl leading-7 text-stone-400">
          Dette er en fake betaling til MVP-test. Når Stripe kobles på senere,
          bliver dette erstattet af rigtig checkout.
        </p>

        <div className="mt-8 grid gap-4 border-t border-stone-800 pt-8 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
              Ordre
            </p>
            <p className="mt-2 font-mono text-stone-100">
              {params.order ?? "Test order"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
              Afhentning
            </p>
            <p className="mt-2 font-mono text-stone-100">
              {params.pickup ?? "Ikke valgt"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
              Pizzaer
            </p>
            <p className="mt-2 font-mono text-stone-100">
              {params.pizzas ?? "0"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-600">
              Total
            </p>
            <p className="mt-2 font-mono text-stone-100">
              {formatPrice(total)}
            </p>
          </div>
        </div>

        <Link
          href="/menu"
          className="mt-8 inline-flex border border-stone-700 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-stone-300 transition hover:border-stone-400 hover:text-stone-50"
        >
          Tilbage til menu
        </Link>
      </section>
    </main>
  );
}
