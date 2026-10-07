import { useAiDraft, useFeed, usePublishPost } from "@/features/data/hooks";
import type { AiDraft } from "@/features/data/types";
import { useShare } from "@/features/feed/PostBits";
import { PostCard } from "@/features/feed/PostCard";
import { useLang, useTr } from "@/features/feed/i18n";
import { compressImage } from "@/features/feed/image";
import { useMe } from "@/features/feed/me";
import {
  CATEGORIES,
  type CategoryId,
  type Delivery,
  EDU_LEVELS,
  type EduLevel,
  type FeedPost,
  type PostKind,
  type Urgency,
} from "@/features/feed/types";
import { Button, Card, Input, Textarea, cn } from "@/shared/components/ui";
import {
  Camera,
  CheckCircle2,
  Loader2,
  PackageCheck,
  PartyPopper,
  Share2,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router";

const MAX_PHOTOS = 5;
type Stage = "pick" | "analyzing" | "edit" | "done";

interface Form extends AiDraft {
  level?: EduLevel;
  detail: string;
  delivery: Delivery[];
  urgency: Urgency;
  qty: string;
}

/** Quick starts for the things students ask for most. */
const NEED_TEMPLATES: { emoji: string; bn: string; en: string; cat: CategoryId; edu?: boolean }[] =
  [
    { emoji: "📚", bn: "পাঠ্যবই", en: "Textbooks", cat: "books", edu: true },
    { emoji: "📝", bn: "গাইড / প্রশ্নব্যাংক", en: "Guide / question bank", cat: "books", edu: true },
    { emoji: "📓", bn: "খাতা-কলম", en: "Notebooks & pens", cat: "stationery" },
    { emoji: "🧮", bn: "ক্যালকুলেটর", en: "Calculator", cat: "electronics", edu: true },
    { emoji: "🎒", bn: "স্কুল ব্যাগ", en: "School bag", cat: "stationery" },
    { emoji: "👔", bn: "ইউনিফর্ম", en: "Uniform", cat: "clothes" },
    { emoji: "💻", bn: "ল্যাপটপ / ট্যাব", en: "Laptop / tablet", cat: "electronics", edu: true },
    { emoji: "🪑", bn: "পড়ার টেবিল", en: "Study table", cat: "furniture" },
  ];

export function QuickPost() {
  const tr = useTr();
  const lang = useLang((s) => s.lang);
  const myLevel = useMe((s) => s.level);
  const [params] = useSearchParams();
  const [kind, setKind] = useState<PostKind>(params.get("kind") === "need" ? "need" : "offer");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>(params.get("kind") === "need" ? "edit" : "pick");
  const [f, setF] = useState<Form>({
    title: "",
    description: "",
    category: "books",
    condition: "good",
    level: undefined,
    detail: "",
    delivery: ["pickup"],
    urgency: "soon",
    qty: "",
  });
  const [limitHit, setLimitHit] = useState(false);
  const [published, setPublished] = useState<FeedPost | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const aiDraft = useAiDraft();
  const publish = usePublishPost();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((c) => ({ ...c, [k]: v }));

  useEffect(() => {
    const urls = files.map((x) => URL.createObjectURL(x));
    setPreviews(urls);
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [files]);

  const switchKind = (k: PostKind) => {
    setKind(k);
    setStage(k === "need" ? "edit" : files.length ? "edit" : "pick");
  };

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    const added = await Promise.all(Array.from(list).map(compressImage));
    setFiles((prev) => [...prev, ...added].slice(0, MAX_PHOTOS));
  };

  const analyze = async () => {
    setStage("analyzing");
    try {
      const d = await aiDraft.mutateAsync(files);
      setF((c) => ({ ...c, ...d }));
    } catch {
      setLimitHit(true);
    }
    setStage("edit");
  };

  const errors = {
    title: f.title.trim().length < 5,
    delivery: f.delivery.length === 0,
  };
  const valid = !errors.title && !errors.delivery;
  const qty = Number.parseInt(f.qty, 10);

  const preview: FeedPost = {
    id: "preview",
    kind,
    title: f.title || tr("শিরোনাম", "Title"),
    description: f.description,
    category: f.category,
    condition: f.condition,
    area: "মিরপুর ১০",
    district: "ঢাকা",
    distanceKm: 0,
    author: { name: tr("আপনি", "You"), username: "me", verified: true, trust: 90 },
    images: previews,
    postedAt: tr("এইমাত্র", "just now"),
    hoursAgo: 0,
    requests: 0,
    edu: f.level ? { level: f.level, detail: f.detail.trim() || undefined } : undefined,
    delivery: f.delivery,
    urgency: kind === "need" ? f.urgency : undefined,
    qty: qty > 1 ? qty : undefined,
    status: "available",
  };

  const submit = () =>
    publish.mutate(
      {
        kind,
        title: f.title.trim(),
        description: f.description.trim(),
        category: f.category,
        condition: f.condition,
        photos: files,
        edu: preview.edu,
        delivery: f.delivery,
        urgency: kind === "need" ? f.urgency : undefined,
        qty: preview.qty,
      },
      {
        onSuccess: (p) => {
          setPublished(p);
          setStage("done");
          window.scrollTo({ top: 0 });
        },
      },
    );

  if (stage === "done" && published) return <Published post={published} />;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4">
      <Helmet>
        <title>ReuseDo — {tr("পোস্ট করুন", "New post")}</title>
      </Helmet>
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold">{tr("পোস্ট করুন", "New post")}</h1>
        <p className="text-sm text-muted-foreground">
          {kind === "offer"
            ? tr(
                "ছবি তুলুন — বাকিটা AI লিখে দেবে। আপনি শুধু দেখে নিন।",
                "Snap a photo — AI writes the rest. You just check it.",
              )
            : tr(
                "চাওয়ায় লজ্জার কিছু নেই — অনেকেই দিতে চান, শুধু জানেন না কার দরকার।",
                "There's no shame in asking — many people want to give, they just don't know who needs it.",
              )}
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1" role="tablist">
            {(["offer", "need"] as const).map((k) => (
              <button
                type="button"
                role="tab"
                aria-selected={kind === k}
                key={k}
                onClick={() => switchKind(k)}
                className={cn(
                  "rounded-xl py-2.5 text-sm font-bold transition-all",
                  kind === k
                    ? k === "offer"
                      ? "bg-background text-offer shadow-sm"
                      : "bg-background text-need shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {k === "offer"
                  ? `🎁 ${tr("আমি দিতে চাই", "I want to give")}`
                  : `🙏 ${tr("আমার দরকার", "I need something")}`}
              </button>
            ))}
          </div>

          {kind === "offer" && stage === "pick" && (
            <Card className="space-y-4 rounded-2xl p-4">
              <input
                ref={input}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                hidden
                onChange={(e) => addFiles(e.target.files)}
              />
              <PhotoGrid
                previews={previews}
                canAdd={files.length < MAX_PHOTOS}
                onAdd={() => input.current?.click()}
                onRemove={(i) => setFiles((x) => x.filter((_, j) => j !== i))}
                addLabel={tr("ছবি যোগ করুন", "Add photos")}
              />
              <Button className="w-full" size="lg" disabled={files.length === 0} onClick={analyze}>
                <Sparkles className="mr-2 h-4 w-4" /> {tr("AI দিয়ে পোস্ট বানান", "Write it with AI")}
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm font-medium text-muted-foreground underline"
                onClick={() => setStage("edit")}
              >
                {tr("নিজে লিখব", "I'll write it myself")}
              </button>
            </Card>
          )}

          {stage === "analyzing" && (
            <Card className="flex flex-col items-center gap-3 rounded-2xl p-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {tr("ছবি দেখে লিখছে… কয়েক সেকেন্ড", "Reading your photo… a few seconds")}
              </p>
            </Card>
          )}

          {stage === "edit" && (
            <Card className="space-y-5 rounded-2xl p-4">
              {kind === "offer" && files.length > 0 && !limitHit && (
                <p className="flex items-start gap-2 rounded-xl bg-primary/10 p-3 text-sm">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {tr(
                    "AI খসড়া লিখেছে — ভুল থাকলে ঠিক করে নিন।",
                    "AI wrote a draft — fix anything that's off.",
                  )}
                </p>
              )}
              {limitHit && (
                <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                  {tr(
                    "আজকের AI সীমা শেষ — নিজে লিখে দিন।",
                    "Today's AI limit is used up — please write it yourself.",
                  )}
                </p>
              )}

              {kind === "need" && (
                <Section title={tr("দ্রুত শুরু", "Quick start")}>
                  <div className="flex flex-wrap gap-2">
                    {NEED_TEMPLATES.map((t) => (
                      <button
                        key={t.bn}
                        type="button"
                        onClick={() =>
                          setF((c) => ({
                            ...c,
                            title: `${tr(t.bn, t.en)} ${tr("দরকার", "needed")}`,
                            category: t.cat,
                            level: t.edu ? (c.level ?? myLevel) : c.level,
                          }))
                        }
                        className="rounded-full border bg-card px-3 py-1.5 text-sm font-medium hover:border-need/50 hover:bg-need-soft"
                      >
                        {t.emoji} {tr(t.bn, t.en)}
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              <div className="space-y-1.5">
                <label htmlFor="qp-title" className="text-sm font-semibold">
                  {kind === "need" ? tr("কী দরকার?", "What do you need?") : tr("শিরোনাম", "Title")}
                </label>
                <Input
                  id="qp-title"
                  value={f.title}
                  maxLength={80}
                  placeholder={
                    kind === "need"
                      ? tr("যেমন: ক্লাস ৯-এর বিজ্ঞান বই", "e.g. Class 9 science books")
                      : tr("যেমন: ক্লাস ৮-এর সব বই (সেট)", "e.g. Full set of class 8 books")
                  }
                  onChange={(e) => set("title", e.target.value)}
                  aria-invalid={f.title.length > 0 && errors.title}
                  className="h-12 rounded-xl text-base"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="qp-desc" className="text-sm font-semibold">
                  {kind === "need"
                    ? tr("কেন দরকার? (ঐচ্ছিক)", "Why? (optional)")
                    : tr("বিবরণ", "Description")}
                </label>
                <Textarea
                  id="qp-desc"
                  rows={3}
                  maxLength={500}
                  value={f.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder={
                    kind === "need"
                      ? tr(
                          "দুই লাইনে বলুন কীভাবে কাজে লাগবে। দাতারা পড়তে পছন্দ করেন।",
                          "Two lines on how it will help. Givers like to know.",
                        )
                      : tr("অবস্থা, কী কী আছে, কোনো দাগ/ত্রুটি", "Condition, what's included, any marks")
                  }
                  className="rounded-xl text-base"
                />
                <p className="text-xs text-muted-foreground">
                  🔒{" "}
                  {tr(
                    "ফোন নম্বর বা পুরো ঠিকানা লিখবেন না — চ্যাটেই দেবেন।",
                    "Don't write your phone or full address — share it in chat.",
                  )}
                </p>
              </div>

              <Section title={tr("ক্যাটাগরি", "Category")}>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <Chip key={c.id} on={f.category === c.id} onClick={() => set("category", c.id)}>
                      {c.emoji} {lang === "bn" ? c.bn : c.en}
                    </Chip>
                  ))}
                </div>
              </Section>

              <Section
                title={tr("পড়াশোনার স্তর", "Study level")}
                hint={tr(
                  "পড়াশোনার জিনিস হলে দিন — ঠিক মানুষ খুঁজে পাবে",
                  "For study items — helps the right students find it",
                )}
              >
                <div className="flex flex-wrap gap-2">
                  {EDU_LEVELS.map((l) => (
                    <Chip
                      key={l.id}
                      on={f.level === l.id}
                      onClick={() => set("level", f.level === l.id ? undefined : l.id)}
                    >
                      {lang === "bn" ? l.bn : l.en}
                    </Chip>
                  ))}
                </div>
                {f.level && (
                  <Input
                    value={f.detail}
                    maxLength={60}
                    onChange={(e) => set("detail", e.target.value)}
                    placeholder={tr(
                      "ক্লাস / বিষয় / ভার্সন — যেমন: ক্লাস ৯ · বিজ্ঞান · বাংলা ভার্সন",
                      "Class / subject / version",
                    )}
                    aria-label={tr("ক্লাস / বিষয়", "Class / subject")}
                    className="mt-2 h-11 rounded-xl"
                  />
                )}
              </Section>

              <div className="grid gap-5 sm:grid-cols-2">
                {kind === "offer" ? (
                  <Section title={tr("অবস্থা", "Condition")}>
                    <Seg
                      value={f.condition}
                      onChange={(v) => set("condition", v)}
                      options={[
                        ["new", tr("নতুন", "New")],
                        ["good", tr("ভালো", "Good")],
                        ["used", tr("ব্যবহৃত", "Used")],
                      ]}
                    />
                  </Section>
                ) : (
                  <Section title={tr("কবে দরকার?", "When do you need it?")}>
                    <Seg
                      value={f.urgency}
                      onChange={(v) => set("urgency", v)}
                      options={[
                        ["urgent", tr("জরুরি", "Urgent")],
                        ["soon", tr("এই মাসে", "This month")],
                        ["anytime", tr("যেকোনো সময়", "Anytime")],
                      ]}
                    />
                  </Section>
                )}
                <Section title={tr("কয়টি (ঐচ্ছিক)", "How many (optional)")}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={500}
                    value={f.qty}
                    onChange={(e) => set("qty", e.target.value)}
                    aria-label={tr("কয়টি", "Quantity")}
                    className="h-11 rounded-xl"
                  />
                </Section>
              </div>

              <Section
                title={
                  kind === "offer"
                    ? tr("কীভাবে দেবেন?", "How can they get it?")
                    : tr("কীভাবে নিতে পারবেন?", "How can you receive it?")
                }
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      [
                        "pickup",
                        PackageCheck,
                        tr("নিজে এসে নেওয়া", "Pickup in person"),
                        tr("সময় ঠিক করে, পাবলিক জায়গায়", "Agree a time, meet in public"),
                      ],
                      [
                        "courier",
                        Truck,
                        tr("কুরিয়ারে", "By courier"),
                        tr("চার্জ গ্রহীতা দেন", "Receiver pays the fee"),
                      ],
                    ] as const
                  ).map(([v, Icon, label, hint]) => {
                    const on = f.delivery.includes(v);
                    return (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          set(
                            "delivery",
                            on ? f.delivery.filter((d) => d !== v) : [...f.delivery, v],
                          )
                        }
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                          on ? "border-primary bg-primary/5" : "hover:bg-accent",
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0 text-primary" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{label}</span>
                          <span className="block text-xs text-muted-foreground">{hint}</span>
                        </span>
                        {on && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
                {errors.delivery && (
                  <p className="mt-1 text-xs font-medium text-destructive">
                    {tr("অন্তত একটি বাছুন", "Pick at least one")}
                  </p>
                )}
              </Section>

              {publish.isError && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {tr("প্রকাশ করা যায়নি, আবার চেষ্টা করুন।", "Couldn't publish — please try again.")}
                </p>
              )}
              <div className="flex gap-2">
                {kind === "offer" && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setStage("pick");
                      setLimitHit(false);
                    }}
                  >
                    {tr("ছবি", "Photos")}
                  </Button>
                )}
                <Button
                  size="lg"
                  className={cn("flex-1", kind === "need" && "bg-need text-white hover:bg-need/90")}
                  disabled={!valid || publish.isPending}
                  onClick={submit}
                >
                  {publish.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {tr("প্রকাশ করুন", "Publish")}
                </Button>
              </div>
              {errors.title && f.title.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {tr(
                    "শিরোনাম আরেকটু লিখুন (কমপক্ষে ৫ অক্ষর)",
                    "Make the title a bit longer (5+ characters)",
                  )}
                </p>
              )}
            </Card>
          )}
        </div>

        {stage === "edit" && (
          <aside
            className="space-y-2 lg:sticky lg:top-20 lg:self-start"
            aria-label={tr("প্রিভিউ", "Preview")}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {tr("ফিডে এভাবে দেখাবে", "How it will look")}
            </p>
            <div inert className="pointer-events-none select-none">
              <PostCard post={preview} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function Published({ post }: { post: FeedPost }) {
  const tr = useTr();
  const { share, copied } = useShare();
  const isNeed = post.kind === "need";
  // A need shows offers that could fill it; an offer shows people who need that kind of thing.
  const { data = [] } = useFeed({
    kind: isNeed ? "offer" : "need",
    category: post.category,
    scope: "country",
  });
  // Same category; same study level first (an exact-level-only match is often empty).
  const lvl = post.edu?.level;
  const matches = data
    .filter((p) => p.id !== post.id)
    .sort((a, b) => Number(b.edu?.level === lvl) - Number(a.edu?.level === lvl))
    .slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <Helmet>
        <title>ReuseDo — {tr("প্রকাশিত", "Published")}</title>
      </Helmet>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <PartyPopper className="h-8 w-8 text-primary" />
        </span>
        <h1 className="text-2xl font-extrabold">
          {isNeed
            ? tr("আপনার চাওয়া এখন সবাই দেখছে", "Your request is live")
            : tr("দারুণ! পোস্ট লাইভ হয়েছে", "Great — your post is live")}
        </h1>
        <p className="max-w-md text-muted-foreground">
          {isNeed
            ? tr(
                "কেউ সাহায্য করতে চাইলে মেসেজ ও ইমেইলে জানাব। পরিচিতদের সাথে শেয়ার করলে দ্রুত পাবেন।",
                "We'll message and email you when someone offers. Sharing it gets help faster.",
              )
            : tr(
                "কেউ চাইলে আপনাকে জানাব। আপনি ঠিক করবেন কাকে দেবেন।",
                "We'll let you know when someone asks. You choose who gets it.",
              )}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => share(post.title, `/post/${post.id}`)}>
            <Share2 className="mr-2 h-4 w-4" />
            {copied ? tr("লিংক কপি হয়েছে ✓", "Link copied ✓") : tr("শেয়ার করুন", "Share")}
          </Button>
          <Button asChild variant="outline">
            <Link to={`/post/${post.id}`}>{tr("পোস্ট দেখুন", "View post")}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/home">{tr("হোমে যান", "Go home")}</Link>
          </Button>
        </div>
      </div>

      {matches.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">
            {isNeed
              ? `✨ ${tr("এগুলো হয়তো কাজে লাগবে", "These might be what you need")}`
              : `💚 ${tr("এরা এমন জিনিস খুঁজছেন", "These people are looking for this")}`}
          </h2>
          <div className="space-y-4">
            {matches.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PhotoGrid({
  previews,
  canAdd,
  onAdd,
  onRemove,
  addLabel,
}: {
  previews: string[];
  canAdd: boolean;
  onAdd: () => void;
  onRemove: (i: number) => void;
  addLabel: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {previews.map((src, i) => (
        <div key={src} className="relative aspect-square overflow-hidden rounded-xl border">
          <img src={src} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label="remove"
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
            onClick={() => onRemove(i)}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {canAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-muted-foreground hover:bg-accent"
        >
          <Camera className="h-6 w-6" />
          <span className="px-1 text-center text-xs">{addLabel}</span>
        </button>
      )}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Chip({
  on,
  onClick,
  children,
}: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function Seg<V extends string>({
  value,
  onChange,
  options,
}: {
  value: V;
  onChange: (v: V) => void;
  options: [V, string][];
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "rounded-lg px-1 py-2 text-sm font-semibold",
            value === v ? "bg-background shadow-sm" : "text-muted-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
