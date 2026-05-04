import { PageShell } from "@/components/PageShell";
import { useSheetsData } from "@/hooks/useSheetsData";
import { useFilters } from "@/components/FiltersProvider";
import { applyFilters, groupCount, responseDelayHours } from "@/lib/utils-data";
import { useMemo } from "react";
import { KpiCard } from "@/components/KpiCard";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--success))", "hsl(var(--muted-foreground))"];

export default function SLATracking() {
  const { data } = useSheetsData();
  const { filters } = useFilters();
  const reviews = useMemo(
    () => applyFilters(data?.reviews ?? [], filters, "review"),
    [data, filters]
  );

  const delays = reviews.map(responseDelayHours).filter((d): d is number => d !== null && d >= 0);
  const avg = delays.length ? (delays.reduce((s, d) => s + d, 0) / delays.length).toFixed(1) : "—";
  const delayed = delays.filter((d) => d > 24).length;
  const onTime = delays.filter((d) => d <= 24).length;

  const statusBreak = useMemo(
    () => groupCount(reviews, (r) => r.finalStatus || r.status || "Unspecified"),
    [reviews]
  );

  return (
    <PageShell title="SLA & Response Tracking" subtitle="Response timeliness and status mix">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-5">
        <KpiCard
          label="Avg First Response"
          value={avg === "—" ? "—" : `${avg} h`}
          hint={`${delays.length} measurable responses`}
          icon={<Clock className="h-5 w-5" />}
        />
        <KpiCard
          label="Delayed (>24h)"
          value={delayed.toLocaleString()}
          tone="destructive"
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <KpiCard
          label="On-time (≤24h)"
          value={onTime.toLocaleString()}
          tone="success"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KpiCard
          label="Total Tracked"
          value={reviews.length.toLocaleString()}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h3 className="text-sm font-semibold mb-3">Final status breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusBreak}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label={(e: any) => `${e.name} (${e.value})`}
              >
                {statusBreak.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="panel p-4">
          <h3 className="text-sm font-semibold mb-3">Status counts</h3>
          <div className="space-y-2">
            {statusBreak.map((s) => (
              <div key={s.name} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                <span>{s.name}</span>
                <span className="font-semibold tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
