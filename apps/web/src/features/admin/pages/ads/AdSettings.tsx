import { useNum } from "@/features/feed/i18n";
import { Button, Card, Switch, cn } from "@/shared/components/ui";
import { useState } from "react";

// UI for the PRD's ad controls (ads_enabled / ads_frequency / ads_per_session_cap).
// Persist through the platform-settings / feature-flag API once connected.
export function AdSettings() {
  const num = useNum();
  const [enabled, setEnabled] = useState(true);
  const [every, setEvery] = useState(6);
  const [cap, setCap] = useState(8);
  const [newUserLight, setNewUserLight] = useState(true);
  const [saved, setSaved] = useState(false);
  const change =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setSaved(false);
    };

  // Rough impression estimate: ~30 posts scrolled per session / frequency, capped.
  const perSession = enabled ? Math.min(cap, Math.floor(30 / every)) : 0;
  const dim = cn(!enabled && "pointer-events-none opacity-50");

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">বিজ্ঞাপন সেটিংস</h1>
        <p className="text-sm text-muted-foreground">
          Google Ad Manager (AdX) — ফিডের মধ্যে native বিজ্ঞাপন
        </p>
      </div>

      <Card className="divide-y rounded-2xl">
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-semibold">বিজ্ঞাপন চালু</p>
            <p className="text-sm text-muted-foreground">বন্ধ করলে ফিডে কোনো বিজ্ঞাপন দেখাবে না</p>
          </div>
          <Switch checked={enabled} onCheckedChange={change(setEnabled)} aria-label="ads enabled" />
        </div>

        <div className={cn("space-y-2 p-4", dim)}>
          <label htmlFor="every" className="flex justify-between font-semibold">
            <span>প্রতি কয়টি পোস্টের পর ১টি বিজ্ঞাপন</span>
            <span className="text-primary">{num(every)}</span>
          </label>
          <input
            id="every"
            type="range"
            min={4}
            max={12}
            value={every}
            onChange={(e) => change(setEvery)(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <p className="text-xs text-muted-foreground">
            কম সংখ্যা = বেশি আয়, কিন্তু ইউজার বিরক্ত হতে পারে। প্রস্তাবিত: ৬–৮।
          </p>
        </div>

        <div className={cn("space-y-2 p-4", dim)}>
          <label htmlFor="cap" className="flex justify-between font-semibold">
            <span>প্রতি সেশনে সর্বোচ্চ বিজ্ঞাপন</span>
            <span className="text-primary">{num(cap)}</span>
          </label>
          <input
            id="cap"
            type="range"
            min={2}
            max={15}
            value={cap}
            onChange={(e) => change(setCap)(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div className={cn("flex items-center justify-between gap-4 p-4", dim)}>
          <div>
            <p className="font-semibold">নতুন ইউজারের প্রথম সেশনে কম বিজ্ঞাপন</p>
            <p className="text-sm text-muted-foreground">প্রথম অভিজ্ঞতা ভালো রাখতে</p>
          </div>
          <Switch
            checked={newUserLight}
            onCheckedChange={change(setNewUserLight)}
            aria-label="new user light"
          />
        </div>
      </Card>

      <Card className="rounded-2xl bg-muted/50 p-4 text-sm">
        <p className="font-semibold">অনুমান (৩০টি পোস্ট স্ক্রল করলে)</p>
        <p className="mt-1 text-muted-foreground">
          প্রায় {num(perSession)}টি বিজ্ঞাপন দেখাবে। চ্যাট, ভেরিফিকেশন ও ঠিকানা পেজে কখনো বিজ্ঞাপন নেই।
        </p>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={() => setSaved(true)}>সংরক্ষণ করুন</Button>
        {saved && <output className="text-sm font-medium text-success">সংরক্ষিত ✓</output>}
      </div>
    </div>
  );
}
