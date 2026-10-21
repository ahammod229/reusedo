import { Router } from "express";
import { z } from "zod";
import { getSupabaseClient } from "../database/client";
import { ah, must } from "../lib/http";
import { flagOn, getSetting } from "../lib/settings";
import type { PaymentSettings } from "./courier.routes";

const router = Router();

export interface AdNetworkSettings {
  adsEnabled: boolean;
  adxEnabled: boolean;
  networkCode: string;
  units: Record<"feed" | "sidebar" | "post_detail", string>;
  every: number;
  sessionCap: number;
  newUserLight: boolean;
  priority: "direct_first" | "adx_first" | "mix";
}

const adQuery = z.object({
  placement: z.enum(["feed", "sidebar", "post_detail"]),
  district: z.string().max(40).optional(),
  category: z.string().max(40).optional(),
});

interface AdRow {
  id: string;
  advertiser: string;
  headline: string;
  body: string;
  cta: string;
  url: string;
  image: string | null;
  weight: number;
}

// GET /api/ads?placement=&district=&category= — eligible direct ads, already filtered and
// rotated by weight. The browser gets only what it renders: no stats, no targeting rules.
router.get(
  "/ads",
  ah(async (req, res) => {
    const q = adQuery.parse(req.query);
    const st = await getSetting<AdNetworkSettings>("ad_network");
    const enabled = st.adsEnabled && (await flagOn("ads_enabled"));
    let ads: AdRow[] = [];
    if (enabled) {
      const today = new Date().toISOString().slice(0, 10);
      let query = getSupabaseClient()
        .from("ad_campaigns")
        .select("id, advertiser, headline, body, cta, url, image, weight")
        .eq("paused", false)
        .lte("start_date", today)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .contains("placements", [q.placement]);
      if (q.district)
        query = query.or(`districts.eq.{},districts.cs.{${JSON.stringify(q.district)}}`);
      if (q.category)
        query = query.or(`categories.eq.{},categories.cs.{${JSON.stringify(q.category)}}`);
      ads = must(await query) as AdRow[];
      // Weighted shuffle: heavier ads come first more often.
      ads = ads
        .map((a) => ({ a, k: Math.random() ** (1 / a.weight) }))
        .sort((x, y) => y.k - x.k)
        .map((x) => x.a)
        .filter((a) => /^https?:\/\/[^\s]+\.[^\s]+/i.test(a.url));
    }
    res.set("Cache-Control", "private, max-age=60");
    res.json({
      success: true,
      data: {
        enabled,
        every: st.every,
        sessionCap: st.sessionCap,
        adx:
          enabled && st.adxEnabled && st.networkCode
            ? { networkCode: st.networkCode, unit: st.units[q.placement] }
            : null,
        priority: st.priority,
        ads: ads.map(({ weight: _w, image, ...a }) => ({ ...a, image: image ?? undefined })),
      },
    });
  }),
);

const BOT = /bot|crawl|spider|slurp|headless|preview/i;

// POST /api/ads/:id/events { type, session } — counted once per session; bots ignored.
router.post(
  "/ads/:id/events",
  ah(async (req, res) => {
    const { type, session } = z
      .object({ type: z.enum(["impression", "click"]), session: z.string().min(8).max(64) })
      .parse(req.body);
    const id = z.string().uuid().safeParse(req.params.id);
    if (id.success && !BOT.test(req.get("user-agent") ?? "")) {
      await getSupabaseClient().rpc("track_ad", {
        p_ad: id.data,
        p_type: type,
        p_session: session,
      });
    }
    res.status(204).end();
  }),
);

// GET /api/payments/config — which ways to pay the courier charge, and where to send it.
router.get(
  "/payments/config",
  ah(async (_req, res) => {
    const p = await getSetting<PaymentSettings>("payments");
    res.json({
      success: true,
      data: { methods: p.methods, bkashNumber: p.bkashNumber, nagadNumber: p.nagadNumber },
    });
  }),
);

export const adsRouter = router;
