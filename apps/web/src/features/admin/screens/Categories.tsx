import { QueryState } from "@/features/data/QueryState";
import { useNum, useTr } from "@/features/feed/i18n";
import { Pill } from "@/features/feed/parts";
import { Field } from "@/pages/auth/components/Field";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Switch,
} from "@/shared/components/ui";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAdminCategories, useSaveCategory } from "../data/hooks";
import type { AdminCategory } from "../data/types";
import { AdminPage, DataTable } from "../kit";

const EMPTY: AdminCategory = { id: "", bn: "", en: "", emoji: "🎁", enabled: true, posts: 0 };

export function Categories() {
  const tr = useTr();
  const num = useNum();
  const { data = [], isLoading, error, refetch } = useAdminCategories();
  const save = useSaveCategory();
  const [edit, setEdit] = useState<AdminCategory | null>(null);
  const isNew = edit && !data.some((c) => c.id === edit.id);
  const valid =
    !!edit &&
    edit.bn.trim() &&
    edit.en.trim() &&
    edit.emoji.trim() &&
    (!isNew || /^[a-z][a-z0-9-]*$/.test(edit.id));

  return (
    <AdminPage
      title={tr("ক্যাটাগরি", "Categories")}
      desc={tr("ফিডে যে ক্যাটাগরি দেখায়", "The categories shown in the feed")}
      actions={
        <Button onClick={() => setEdit({ ...EMPTY })}>
          <Plus className="mr-1.5 h-4 w-4" /> {tr("নতুন", "New")}
        </Button>
      }
    >
      <Helmet>
        <title>{tr("ক্যাটাগরি", "Categories")} — ReuseDo Admin</title>
      </Helmet>
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <DataTable
          rows={data}
          rowKey={(c) => c.id}
          cols={[
            {
              key: "name",
              header: tr("নাম", "Name"),
              primary: true,
              cell: (c) => (
                <span className="text-base font-semibold">
                  {c.emoji} {c.bn}{" "}
                  <span className="font-normal text-muted-foreground">· {c.en}</span>
                </span>
              ),
            },
            { key: "id", header: "ID", cell: (c) => <code className="text-xs">{c.id}</code> },
            { key: "posts", header: tr("পোস্ট", "Posts"), cell: (c) => num(c.posts) },
            {
              key: "state",
              header: tr("অবস্থা", "State"),
              cell: (c) =>
                c.enabled ? (
                  <Pill tone="success">{tr("চালু", "On")}</Pill>
                ) : (
                  <Pill>{tr("বন্ধ", "Off")}</Pill>
                ),
            },
            {
              key: "actions",
              header: "",
              actions: true,
              cell: (c) => (
                <>
                  <Switch
                    checked={c.enabled}
                    onCheckedChange={(v) => save.mutate({ ...c, enabled: v })}
                    aria-label={`${c.bn} on/off`}
                  />
                  <Button size="sm" variant="outline" onClick={() => setEdit(c)}>
                    {tr("সম্পাদনা", "Edit")}
                  </Button>
                </>
              ),
            },
          ]}
        />
      </QueryState>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-md">
          {edit && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {isNew ? tr("নতুন ক্যাটাগরি", "New category") : tr("ক্যাটাগরি সম্পাদনা", "Edit category")}
                </DialogTitle>
                <DialogDescription>
                  {tr(
                    "বন্ধ করলে ফিড ও পোস্ট ফর্ম থেকে লুকিয়ে যায়; পুরোনো পোস্ট থাকে।",
                    "Turning it off hides it from the feed and post form; existing posts stay.",
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-[5rem_1fr] gap-3">
                  <Field
                    label="Emoji"
                    value={edit.emoji}
                    maxLength={4}
                    onChange={(e) => setEdit({ ...edit, emoji: e.target.value })}
                    className="text-center text-2xl"
                  />
                  <Field
                    label={tr("বাংলা নাম", "Bengali name")}
                    value={edit.bn}
                    onChange={(e) => setEdit({ ...edit, bn: e.target.value })}
                  />
                </div>
                <Field
                  label={tr("ইংরেজি নাম", "English name")}
                  value={edit.en}
                  onChange={(e) => setEdit({ ...edit, en: e.target.value })}
                />
                {isNew && (
                  <Field
                    label="ID (a-z, -)"
                    value={edit.id}
                    hint={tr("একবার দিলে বদলানো যায় না", "Can't be changed later")}
                    onChange={(e) => setEdit({ ...edit, id: e.target.value.toLowerCase() })}
                  />
                )}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!valid}
                  onClick={() => {
                    save.mutate(edit);
                    setEdit(null);
                  }}
                >
                  {tr("সংরক্ষণ", "Save")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
