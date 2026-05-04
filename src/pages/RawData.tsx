import { PageShell } from "@/components/PageShell";
import { useSheetsData } from "@/hooks/useSheetsData";
import { useFilters } from "@/components/FiltersProvider";
import { applyFilters } from "@/lib/utils-data";
import { useMemo } from "react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Review } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export default function RawData() {
  const { data } = useSheetsData();
  const { filters } = useFilters();
  const rows = useMemo(
    () => applyFilters(data?.reviews ?? [], filters, "review"),
    [data, filters]
  );

  const columns: ColumnDef<Review>[] = [
    { accessorKey: "platform", header: "Platform", cell: (c) => <Badge variant="secondary">{c.getValue() as string}</Badge> },
    { accessorKey: "reviewDate", header: "Review Date" },
    { accessorKey: "reviewTime", header: "Time" },
    { accessorKey: "customer", header: "Customer" },
    { accessorKey: "mobile", header: "Mobile" },
    { accessorKey: "rating", header: "Rating" },
    { accessorKey: "clmCategory", header: "CLM Category" },
    { accessorKey: "issue", header: "Issue" },
    { accessorKey: "subIssue", header: "Sub-Issue" },
    { accessorKey: "service", header: "Service" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "finalStatus", header: "Final Status" },
    { accessorKey: "conversion", header: "Converted" },
    { accessorKey: "ownership", header: "Ownership" },
    { accessorKey: "errorType", header: "Error Type" },
    { accessorKey: "actionedDate", header: "Actioned Date" },
    { accessorKey: "firstResponseTime", header: "First Response" },
    {
      accessorKey: "comments",
      header: "Comment",
      cell: (c) => <span className="max-w-[320px] truncate inline-block" title={c.getValue() as string}>{c.getValue() as string}</span>,
    },
    { accessorKey: "orderId", header: "Order ID" },
  ];

  return (
    <PageShell title="Raw Data — Excel View" subtitle="Full reviews dataset with sort, filter, search, export">
      <DataTable
        data={rows}
        columns={columns as any}
        facets={[
          { columnId: "platform", label: "Platform" },
          { columnId: "clmCategory", label: "CLM Category" },
          { columnId: "issue", label: "Issue" },
          { columnId: "finalStatus", label: "Final Status" },
          { columnId: "conversion", label: "Converted" },
          { columnId: "ownership", label: "Ownership" },
        ]}
        exportName="reviews"
      />
    </PageShell>
  );
}
