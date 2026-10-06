import { AdCard } from "./AdCard";
import { useTr } from "./i18n";

/** Right-hand column for wide screens (xl+): safety tips and one ad slot. */
export function FeedRail() {
  const tr = useTr();
  const tips = [
    tr("পাবলিক জায়গায় দেখা করুন", "Meet in a public place"),
    tr("ফোন নম্বর চ্যাটে দেবেন না", "Don't share your number in chat"),
    tr("জিনিস দেখে নিয়ে তারপর নিন", "Check the item before taking it"),
    tr("সন্দেহ হলে রিপোর্ট করুন", "Report anything suspicious"),
  ];
  return (
    <aside
      className="sticky top-20 hidden h-fit w-72 shrink-0 space-y-4 xl:block"
      aria-label={tr("সাইড প্যানেল", "Sidebar")}
    >
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="mb-2 font-bold">🛡️ {tr("নিরাপদে নিন-দিন", "Stay safe")}</h2>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {tips.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="text-primary">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </section>
      <AdCard index={0} />
    </aside>
  );
}
