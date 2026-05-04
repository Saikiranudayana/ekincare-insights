import { PageShell } from "@/components/PageShell";
import { KpiCard } from "@/components/KpiCard";
import { useSheetsData } from "@/hooks/useSheetsData";
import { useFilters } from "@/components/FiltersProvider";
import { applyFilters, parseDate } from "@/lib/utils-data";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MessageSquare, AlertOctagon, TrendingUp, Star } from "lucide-react";
import { useMemo } from "react";

export default function Dashboard() {
  const { data } = useSheetsData();
  const { filters } = useFilters();

  const reviews = useMemo(
    () => applyFilters(data?.reviews ?? [], filters, "review"),
    [data, filters]
  );
  const daywise = useMemo(
    () => applyFilters(data?.daywise ?? [], filters, "daywise"),
    [data, filters]
  );

  const total = reviews.length;
  const negative = reviews.filter((r) => r.rating > 0 && r.rating <= 2).length;
  const conv = reviews.filter((r) => /^y/i.test(r.conversion)).length;
  const convRate = negative ? ((conv / negative) * 100).toFixed(1) + "%" : "—";
  const ratingsArr = reviews.filter((r) => r.rating > 0);
  const avg = ratingsArr.length
    ? (ratingsArr.reduce((s, r) => s + r.rating, 0) / ratingsArr.length).toFixed(2)
    : "—";

  // Trend by date
  const trend = useMemo(() => {
    const map = new Map<string, { date: string; positive: number; negative: number; sortKey: number }>();
    daywise.forEach((d) => {
      const dt = parseDate(d.date);
      const key = dt ? dt.toISOString().slice(0, 10) : d.date;
      const sortKey = dt ? dt.getTime() : 0;
      const cur = map.get(key) ?? { date: key, positive: 0, negative: 0, sortKey };
      cur.positive += d.positive;
      cur.negative += d.negative;
      map.set(key, cur);
    });
    return Array.from(map.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((d) => ({ ...d, date: d.date.slice(5) }));
  }, [daywise]);

  // Platform comparison
  const platformData = useMemo(() => {
    const ps = ["Playstore", "iOS", "Google"];
    return ps.map((p) => {
      const rs = reviews.filter((r) => r.platform === p);
      return {
        platform: p,
        total: rs.length,
        negative: rs.filter((r) => r.rating > 0 && r.rating <= 2).length,
        positive: rs.filter((r) => r.rating >= 4).length,
      };
    });
  }, [reviews]);

  return (
    <PageShell title="Dashboard" subtitle="Live ORM overview across all platforms">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-5">
        <KpiCard
          label="Total Reviews"
          value={total.toLocaleString()}
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <KpiCard
          label="Negative Reviews"
          value={negative.toLocaleString()}
          hint={total ? `${((negative / total) * 100).toFixed(1)}% of total` : undefined}
          tone="destructive"
          icon={<AlertOctagon className="h-5 w-5" />}
        />
        <KpiCard
          label="Conversion Rate"
          value={convRate}
          hint={`${conv} converted of ${negative}`}
          tone="success"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <KpiCard
          label="Avg Rating"
          value={avg}
          hint={`${ratingsArr.length} rated reviews`}
          tone="warning"
          icon={<Star className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Positive vs Negative trend</h3>
            <span className="text-xs text-muted-foreground">Day-wise (all platforms)</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="positive" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="negative" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="panel p-4">
          <h3 className="text-sm font-semibold mb-3">Platform comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="platform" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="negative" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="positive" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageShell>
  );
}
