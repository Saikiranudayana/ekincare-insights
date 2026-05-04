import { PageShell } from "@/components/PageShell";
import { useSheetsData } from "@/hooks/useSheetsData";
import { useFilters } from "@/components/FiltersProvider";
import { applyFilters, responseDelayHours } from "@/lib/utils-data";
import { useMemo } from "react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Review } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface Row extends Review {
  delayHours: number | null;
}

export default function LiveActionCenter() {
  const { data } = useSheetsData();
  const { filters } = useFilters();
  const reviews = useMemo(
    () => applyFilters(data?.reviews ?? [], filters, "review"),
    [data, filters]
  );

  const rows: Row[] = useMemo(
    () =>
      reviews
        .filter((r) => r.rating > 0 && r.rating <= 2)
        .filter((r) => !/resolved/i.test(r.finalStatus))
        .map((r) => ({ ...r, delayHours: responseDelayHours(r) })),
    [reviews]
  );

  const columns: ColumnDef<Row>[] = [
    { accessorKey: "customer", header: "Customer", cell: (c) => c.getValue() || "—" },
    {
      accessorKey: "issue",
      header: "Issue",
      cell: (c) => <span className="max-w-[260px] truncate inline-block">{(c.getValue() as string) || "—"}</span>,
    },
    {
      accessorKey: "platform",
      header: "Platform",
      cell: (c) => <Badge variant="secondary">{c.getValue() as string}</Badge>,
    },
    { accessorKey: "rating", header: "Rating" },
    {
      accessorKey: "finalStatus",
      header: "Status",
      cell: (c) => {
        const v = (c.getValue() as string) || "Pending";
        const tone =
          /pending|follow/i.test(v) ? "destructive" : /progress/i.test(v) ? "default" : "secondary";
        return <Badge variant={tone as any}>{v}</Badge>;
      },
    },
    {
      accessorKey: "delayHours",
      header: "Time Delay",
      cell: (c) => {
        const v = c.getValue() as number | null;
        if (v == null) return <span className="text-muted-foreground">—</span>;
        const over = v > 24;
        return (
          <span className={over ? "text-destructive font-semibold" : ""}>
            {v.toFixed(1)} h
          </span>
        );
      },
    },
    { accessorKey: "reviewDate", header: "Review Date" },
  ];

  return (
    <PageShell
      title="Live Action Center"
      subtitle={`${rows.length} unresolved low-rating reviews require attention`}
    >
      <DataTable
        data={rows}
        columns={columns as any}
        facets={[
          { columnId: "platform", label: "Platform" },
          { columnId: "finalStatus", label: "Status" },
        ]}
        exportName="action-center"
      />
    </PageShell>
  );
}
