import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";

interface Props<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  searchable?: boolean;
  facets?: { columnId: string; label: string }[];
  exportName?: string;
}

export function DataTable<T>({ data, columns, searchable = true, facets = [], exportName }: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<{ id: string; value: any }[]>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters as any,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const facetOptions = useMemo(() => {
    const out: Record<string, string[]> = {};
    facets.forEach((f) => {
      const set = new Set<string>();
      data.forEach((d: any) => {
        const v = (d[f.columnId] ?? "").toString().trim();
        if (v) set.add(v);
      });
      out[f.columnId] = Array.from(set).sort();
    });
    return out;
  }, [data, facets]);

  const exportCsv = () => {
    const visibleCols = table.getAllLeafColumns().filter((c) => c.getIsVisible());
    const header = visibleCols.map((c) => (c.columnDef.header as string) ?? c.id).join(",");
    const rows = table.getFilteredRowModel().rows.map((r) =>
      visibleCols
        .map((c) => {
          const v = (r.getValue(c.id) ?? "").toString().replace(/"/g, '""');
          return `"${v}"`;
        })
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFilter = (id: string) => (columnFilters.find((c) => c.id === id)?.value as string[]) ?? [];
  const setFilter = (id: string, vals: string[]) => {
    setColumnFilters((prev) => {
      const others = prev.filter((c) => c.id !== id);
      return vals.length ? [...others, { id, value: vals }] : others;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {searchable && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search all columns…"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        )}
        {facets.map((f) => {
          const sel = getFilter(f.columnId);
          return (
            <DropdownMenu key={f.columnId}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  {f.label}
                  {sel.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {sel.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
                {(facetOptions[f.columnId] || []).map((v) => (
                  <DropdownMenuCheckboxItem
                    key={v}
                    checked={sel.includes(v)}
                    onCheckedChange={() =>
                      setFilter(
                        f.columnId,
                        sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v]
                      )
                    }
                  >
                    {v}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} rows
          </span>
          <Button variant="outline" size="sm" className="h-9" onClick={exportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="whitespace-nowrap">
                    {h.isPlaceholder ? null : (
                      <button
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getCanSort() && <ArrowUpDown className="h-3 w-3 opacity-50" />}
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
