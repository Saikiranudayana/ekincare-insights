import { PageShell } from "@/components/PageShell";
import { useSheetsData } from "@/hooks/useSheetsData";
import { useFilters } from "@/components/FiltersProvider";
import { applyFilters, groupCount } from "@/lib/utils-data";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function TopList({ title, rows }: { title: string; rows: { name: string; value: number }[] }) {
  const top = rows.slice(0, 10);
  const max = top[0]?.value || 1;
  return (
    <div className="panel p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="space-y-2">
        {top.length === 0 && (
          <p className="text-xs text-muted-foreground">No data</p>
        )}
        {top.map((r) => (
          <div key={r.name} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="truncate pr-2">{r.name}</span>
              <span className="font-semibold tabular-nums">{r.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-[image:var(--gradient-primary)]"
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IssueAnalysis() {
  const { data } = useSheetsData();
  const { filters } = useFilters();
  const reviews = useMemo(
    () => applyFilters(data?.reviews ?? [], filters, "review"),
    [data, filters]
  );

  const byCLM = useMemo(() => groupCount(reviews, (r) => r.clmCategory), [reviews]);
  const byIssue = useMemo(() => groupCount(reviews, (r) => r.issue), [reviews]);
  const bySub = useMemo(() => groupCount(reviews, (r) => r.subIssue), [reviews]);

  return (
    <PageShell title="Issue Analysis" subtitle="Top problem areas by category, issue and sub-issue">
      <div className="panel p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">CLM Categories — distribution</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={byCLM.slice(0, 12)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis dataKey="name" type="category" width={140} stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TopList title="Top Issues" rows={byIssue} />
        <TopList title="Top Sub-Issues" rows={bySub} />
      </div>
    </PageShell>
  );
}
