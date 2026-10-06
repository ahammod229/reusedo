import { useLang, useT } from "@/features/feed/i18n";
import { useAiDraft, usePublishPost } from "@/features/data/hooks";
import type { AiDraft } from "@/features/data/types";
import { compressImage } from "@/features/feed/image";
import { CATEGORIES, type PostKind } from "@/features/feed/types";
import { Button, Card, Input, Textarea, cn } from "@/shared/components/ui";
import { Camera, CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

const MAX_PHOTOS = 5;
type Stage = "pick" | "analyzing" | "edit" | "done";

export function QuickPost() {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const [kind, setKind] = useState<PostKind>("offer");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>("pick");
  const [draft, setDraft] = useState<AiDraft>({
    title: "",
    description: "",
    category: "other",
    condition: "good",
  });
  const [limitHit, setLimitHit] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const aiDraft = useAiDraft();
  const publish = usePublishPost();

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [files]);

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    const added = await Promise.all(Array.from(list).map(compressImage));
    setFiles((prev) => [...prev, ...added].slice(0, MAX_PHOTOS));
  };

  const analyze = async () => {
    setStage("analyzing");
    try {
      setDraft(await aiDraft.mutateAsync(files));
    } catch {
      setLimitHit(true);
    }
    setStage("edit");
  };

  if (stage === "done") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <CheckCircle2 className="h-16 w-16 text-primary" />
        <h1 className="text-xl font-semibold">{t("published")}</h1>
        <Button asChild>
          <Link to="/feed">{t("feed")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-4">
      <Helmet>
        <title>ReuseDo — {t("quickPost")}</title>
      </Helmet>
      <div>
        <h1 className="text-xl font-bold">{t("quickPost")}</h1>
        <p className="text-sm text-muted-foreground">{t("quickPostHint")}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        {(["offer", "need"] as const).map((k) => (
          <button
            type="button"
            key={k}
            onClick={() => setKind(k)}
            className={cn(
              "rounded-lg py-2 text-sm font-medium",
              kind === k ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            {k === "offer" ? `🎁 ${t("offer")}` : `🙏 ${t("needBadge")}`}
          </button>
        ))}
      </div>

      {kind === "offer" && stage === "pick" && (
        <Card className="space-y-4 p-4">
          <input
            ref={input}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            hidden
            onChange={(e) => addFiles(e.target.files)}
          />
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-lg border">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="remove"
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                  onClick={() => setFiles((f) => f.filter((_, j) => j !== i))}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {files.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground hover:bg-accent"
              >
                <Camera className="h-6 w-6" />
                <span className="px-1 text-center text-[11px]">{t("addPhotos")}</span>
              </button>
            )}
          </div>
          <Button className="w-full" disabled={files.length === 0} onClick={analyze}>
            <Sparkles className="mr-2 h-4 w-4" /> AI দিয়ে পোস্ট বানান
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground underline"
            onClick={() => setStage("edit")}
          >
            নিজে লিখব
          </button>
        </Card>
      )}

      {stage === "analyzing" && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("analyzing")}</p>
        </Card>
      )}

      {(stage === "edit" || (kind === "need" && stage === "pick")) && (
        <Card className="space-y-4 p-4">
          {kind === "offer" && !limitHit && files.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-sm">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <div className="font-medium">{t("aiDraft")}</div>
                <div className="text-muted-foreground">{t("aiHint")}</div>
              </div>
            </div>
          )}
          {limitHit && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {t("aiLimit")}
            </p>
          )}
          <div className="block space-y-1 text-sm font-medium">
            <label htmlFor="qp-title">{kind === "need" ? t("needFromVoice") : t("title")}</label>
            <Input
              id="qp-title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>
          <div className="block space-y-1 text-sm font-medium">
            <label htmlFor="qp-desc">{t("description")}</label>
            <Textarea
              id="qp-desc"
              rows={4}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
          <div className="space-y-1 text-sm font-medium">
            {t("category")}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setDraft({ ...draft, category: c.id })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-normal",
                    draft.category === c.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-accent",
                  )}
                >
                  {c.emoji} {lang === "bn" ? c.bn : c.en}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {kind === "offer" && (
              <Button
                variant="outline"
                onClick={() => {
                  setStage("pick");
                  setLimitHit(false);
                }}
              >
                {t("retake")}
              </Button>
            )}
            {publish.isError && (
              <p role="alert" className="basis-full text-sm font-medium text-destructive">
                {publish.error instanceof Error ? publish.error.message : "Publish failed"}
              </p>
            )}
            <Button
              className="flex-1"
              disabled={!draft.title.trim() || publish.isPending}
              onClick={() =>
                publish.mutate(
                  { ...draft, kind, photos: files },
                  { onSuccess: () => setStage("done") },
                )
              }
            >
              {t("publish")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
