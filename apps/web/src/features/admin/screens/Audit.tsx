import { QueryState } from "@/features/data/QueryState";
import { useTr } from "@/features/feed/i18n";
import { Button } from "@/shared/components/ui";
import { Download } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAdminAudit } from "../data/hooks";
import { AdminPage, DataTable, SearchBox } from "../kit";

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

export function Audit() {
  const tr = useTr();
  const { data = [], isLoading, error, refetch } = useAdminAudit();
  const [q, setQ] = useState("");
  const rows = data.filter(
    (a) => !q || `${a.actor} ${a.action} ${a.target}`.toLowerCase().includes(q.toLowerCase()),
  );

  const exportCsv = () => {
    const csv = [
      "when,actor,action,target",
      ...rows.map((a) => [a.when, a.actor, a.action, a.target].map(csvCell).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "audit-log.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminPage
      title={tr("অডিট লগ", "Audit log")}
      desc={tr("কে কী করেছে — মুছে ফেলা যায় না", "Who did what — cannot be deleted")}
      actions={
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="mr-1.5 h-4 w-4" /> CSV
        </Button>
      }
    >
      <Helmet>
        <title>{tr("অডিট", "Audit")} — ReuseDo Admin</title>
      </Helmet>
      <SearchBox value={q} onChange={setQ} placeholder={tr("খুঁজুন…", "Search…")} />
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        <DataTable
          rows={rows}
          rowKey={(a) => a.id}
          cols={[
            {
              key: "action",
              header: tr("কাজ", "Action"),
              primary: true,
              cell: (a) => <span className="font-semibold">{a.action}</span>,
            },
            { key: "target", header: tr("কিসের ওপর", "Target"), cell: (a) => a.target },
            { key: "actor", header: tr("কে", "Who"), cell: (a) => a.actor },
            { key: "when", header: tr("কখন", "When"), cell: (a) => a.when },
          ]}
        />
      </QueryState>
    </AdminPage>
  );
}
