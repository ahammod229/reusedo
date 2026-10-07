import { useLang, useTr } from "@/features/feed/i18n";
import { compressImage } from "@/features/feed/image";
import { useMe } from "@/features/feed/me";
import { PageHeading } from "@/features/feed/parts";
import { CATEGORIES, EDU_LEVELS } from "@/features/feed/types";
import { Button, Switch, cn } from "@/shared/components/ui";
import { Camera } from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";
import { Field } from "../auth/components/Field";

export function EditProfilePage() {
  const tr = useTr();
  const lang = useLang((s) => s.lang);
  const me = useMe();
  const [study, setStudy] = useState({
    level: me.level,
    institution: me.institution,
    showInstitution: me.showInstitution,
    interests: me.interests,
  });
  const [name, setName] = useState("রাকিব হাসান");
  const [bio, setBio] = useState("পড়ার বই আর খাতা দিয়ে দিতে ভালো লাগে।");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!photo) return setPreview(null);
    const u = URL.createObjectURL(photo);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [photo]);

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 px-4 py-5">
      <Helmet>
        <title>{tr("প্রোফাইল এডিট", "Edit profile")} — ReuseDo</title>
      </Helmet>
      <PageHeading title={tr("প্রোফাইল এডিট", "Edit profile")} />
      <form
        className="space-y-5 rounded-3xl border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          me.set(study);
          setSaved(true);
        }}
      >
        <div className="flex items-center gap-4">
          <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-3xl font-bold text-primary">
            {preview ? (
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              name.charAt(0)
            )}
          </span>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-semibold hover:bg-accent">
            <Camera className="h-4 w-4" />
            {tr("ছবি বদলান", "Change photo")}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setPhoto(await compressImage(f));
                setSaved(false);
              }}
            />
          </label>
        </div>
        <Field
          label={tr("পুরো নাম", "Full name")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
        />
        <div className="space-y-1.5">
          <label htmlFor="bio" className="text-sm font-semibold">
            {tr("সংক্ষিপ্ত পরিচয়", "Short bio")}
          </label>
          <textarea
            id="bio"
            rows={3}
            maxLength={200}
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              setSaved(false);
            }}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </div>
        <fieldset className="space-y-3 rounded-2xl border p-4">
          <legend className="px-1 text-sm font-bold">🎓 {tr("পড়াশোনা", "Studies")}</legend>
          <div className="flex flex-wrap gap-2">
            {[
              ...EDU_LEVELS.map((l) => [l.id, lang === "bn" ? l.bn : l.en] as const),
              ["none", tr("পড়ি না / অভিভাবক", "Not a student")] as const,
            ].map(([id, label]) => {
              const on = id === "none" ? !study.level : study.level === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setStudy((x) => ({
                      ...x,
                      level: id === "none" ? undefined : (id as typeof x.level),
                    }));
                    setSaved(false);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium",
                    on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <Field
            label={tr("স্কুল / কলেজ / বিশ্ববিদ্যালয়", "School / college / university")}
            value={study.institution}
            maxLength={80}
            onChange={(e) => {
              setStudy((x) => ({ ...x, institution: e.target.value }));
              setSaved(false);
            }}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">
              <span className="block font-semibold">
                {tr("প্রোফাইলে দেখাব", "Show on my profile")}
              </span>
              <span className="block text-xs text-muted-foreground">
                {tr("ডিফল্টে বন্ধ — শুধু আপনি দেখেন", "Off by default — only you see it")}
              </span>
            </span>
            <Switch
              checked={study.showInstitution}
              onCheckedChange={(v) => {
                setStudy((x) => ({ ...x, showInstitution: v }));
                setSaved(false);
              }}
              aria-label={tr("প্রোফাইলে দেখাব", "Show on my profile")}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">{tr("আগ্রহ", "Interests")}</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const on = study.interests.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setStudy((x) => ({
                        ...x,
                        interests: on
                          ? x.interests.filter((i) => i !== c.id)
                          : [...x.interests, c.id],
                      }));
                      setSaved(false);
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium",
                      on ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
                    )}
                  >
                    {c.emoji} {lang === "bn" ? c.bn : c.en}
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg">
            {tr("সংরক্ষণ", "Save")}
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link to="/profile">{tr("ফিরে যান", "Back")}</Link>
          </Button>
          {saved && (
            <output className="text-sm font-medium text-success">
              {tr("সংরক্ষিত ✓", "Saved ✓")}
            </output>
          )}
        </div>
      </form>
    </div>
  );
}
