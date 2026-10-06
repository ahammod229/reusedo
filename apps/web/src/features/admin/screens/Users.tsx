import { QueryState } from "@/features/data/QueryState";
import { useNum, useTr } from "@/features/feed/i18n";
import { Initial, Pill } from "@/features/feed/parts";
import { Button } from "@/shared/components/ui";
import { BadgeCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAdminUsers, useSetUserStatus } from "../data/hooks";
import type { AdminUser } from "../data/types";
import { AdminPage, ConfirmDialog, DataTable, FilterTabs, SearchBox } from "../kit";

type F = "all" | "verified" | "unverified" | "suspended";

export function Users() {
  const tr = useTr();
  const num = useNum();
  const { data = [], isLoading, error, refetch } = useAdminUsers();
  const setStatus = useSetUserStatus();
  const [f, setF] = useState<F>("all");
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<AdminUser | null>(null);

  const rows = useMemo(
    () =>
      data
        .filter((u) =>
          f === "all"
            ? true
            : f === "verified"
              ? u.verified
              : f === "unverified"
                ? !u.verified
                : u.status === "suspended",
        )
        .filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())),
    [data, f, q],
  );
  const count = (fn: (u: AdminUser) => boolean) => data.filter(fn).length;
  const roleLabel = (r: AdminUser["role"]) =>
    ({
      user: tr("সদস্য", "Member"),
      moderator: tr("মডারেটর", "Moderator"),
      admin: "Admin",
      super_admin: "Super admin",
    })[r];

  return (
    <AdminPage
      title={tr("ইউজার", "Users")}
      desc={tr("সদস্য খুঁজুন, সাসপেন্ড বা সচল করুন", "Find members, suspend or restore")}
    >
      <Helmet>
        <title>{tr("ইউজার", "Users")} — ReuseDo Admin</title>
      </Helmet>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs<F>
          value={f}
          onChange={setF}
          options={[
            { value: "all", label: tr("সব", "All"), count: data.length },
            { value: "verified", label: tr("যাচাইকৃত", "Verified"), count: count((u) => u.verified) },
            {
              value: "unverified",
              label: tr("যাচাই বাকি", "Unverified"),
              count: count((u) => !u.verified),
            },
            {
              value: "suspended",
              label: tr("সাসপেন্ড", "Suspended"),
              count: count((u) => u.status === "suspended"),
            },
          ]}
        />
        <SearchBox value={q} onChange={setQ} placeholder={tr("নাম বা ইমেইল…", "Name or email…")} />
      </div>
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <DataTable
          rows={rows}
          rowKey={(u) => u.id}
          cols={[
            {
              key: "name",
              header: tr("ইউজার", "User"),
              primary: true,
              cell: (u) => (
                <span className="flex items-center gap-3">
                  <Initial name={u.name} className="h-9 w-9 text-sm" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 font-semibold">
                      {u.name}
                      {u.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {u.email}
                    </span>
                  </span>
                </span>
              ),
            },
            { key: "district", header: tr("জেলা", "District"), cell: (u) => u.district },
            { key: "posts", header: tr("পোস্ট", "Posts"), cell: (u) => num(u.posts) },
            { key: "trust", header: tr("ট্রাস্ট", "Trust"), cell: (u) => num(u.trust) },
            { key: "role", header: tr("ভূমিকা", "Role"), cell: (u) => roleLabel(u.role) },
            {
              key: "status",
              header: tr("অবস্থা", "Status"),
              cell: (u) =>
                u.status === "active" ? (
                  <Pill tone="success">{tr("সচল", "Active")}</Pill>
                ) : (
                  <Pill tone="danger">{tr("সাসপেন্ড", "Suspended")}</Pill>
                ),
            },
            {
              key: "actions",
              header: "",
              actions: true,
              cell: (u) =>
                u.role === "user" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      u.status === "active"
                        ? setTarget(u)
                        : setStatus.mutate({ id: u.id, status: "active" })
                    }
                  >
                    {u.status === "active" ? tr("সাসপেন্ড", "Suspend") : tr("সচল করুন", "Restore")}
                  </Button>
                ) : null,
            },
          ]}
        />
      </QueryState>
      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        danger
        title={tr("ইউজার সাসপেন্ড করবেন?", "Suspend this user?")}
        desc={tr(
          `${target?.name ?? ""} আর পোস্ট, চ্যাট বা রিকোয়েস্ট করতে পারবেন না। যেকোনো সময় সচল করা যাবে।`,
          `${target?.name ?? ""} won't be able to post, chat or request. You can restore at any time.`,
        )}
        confirmLabel={tr("সাসপেন্ড করুন", "Suspend")}
        onConfirm={() => target && setStatus.mutate({ id: target.id, status: "suspended" })}
      />
    </AdminPage>
  );
}
