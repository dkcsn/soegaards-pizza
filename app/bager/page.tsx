import { SiteNav } from "@/app/components/SiteNav";
import { BakerClient } from "@/app/bager/BakerClient";

export default function BakerPage() {
  return (
    <main className="min-h-screen bg-stone-950 px-5 pb-10 pt-24 text-stone-100">
      <SiteNav />
      <BakerClient />
    </main>
  );
}
