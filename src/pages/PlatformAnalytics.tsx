import { PageShell } from "@/components/PageShell";
import { useSheetsData } from "@/hooks/useSheetsData";
import { useFilters } from "@/components/FiltersProvider";
import { applyFilters } from "@/lib/utils-data";
import { useMemo } from "react";
import { KpiCard } from "@/components/KpiCard";
import { Smartphone, Apple, Globe } from "lucide-react";

const PLATFORMS = [
  { key: "Playstore", icon: Smartphone, color: "tone-success" },
  { key: "iOS", icon: Apple, color: "tone-default" },
  { key: "Google", icon: Globe, color: "tone-warning" },
] as const;

export default function PlatformAnalytics() {
  const { data } = useSheetsData();
  const { filters } = useFilters();
  const reviews = useMemo(
    () => applyFilters(data?.reviews ?? [], filters, "review"),
    [data, filters]
  );

  return (
    <PageShell title="Platform Analytics" subtitle="Per-platform breakdown">
      <div className="space-y-6">
        {PLATFORMS.map(({ key, icon: Icon }) => {
          const rs = reviews.filter((r) => r.platform === key);
          const total = rs.length;
          const negative = rs.filter((r) => r.rating > 0 && r.rating <= 2).length;
          const positive = rs.filter((r) => r.rating >= 4).length;
          const negPct = total ? ((negative / total) * 100).toFixed(1) + "%" : "—";
          const conv = rs.filter((r) => /^y/i.test(r.conversion)).length;
          const convPct = negative ? ((conv / negative) * 100).toFixed(1) + "%" : "—";
          const avgRating = rs.filter((r) => r.rating > 0);
          const avg = avgRating.length
            ? (avgRating.reduce((s, r) => s + r.rating, 0) / avgRating.length).toFixed(2)
            : "—";
          return (
            <section key={key} className="panel p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">{key}</h2>
                  <p className="text-xs text-muted-foreground">
                    {total.toLocaleString()} reviews captured
                  </p>
                </div>
              </div>
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
                <KpiCard label="Total Ratings" value={total.toLocaleString()} />
                <KpiCard label="Negative" value={negative.toLocaleString()} hint={negPct} tone="destructive" />
                <KpiCard label="Positive" value={positive.toLocaleString()} tone="success" />
                <KpiCard label="Conversion %" value={convPct} hint={`${conv} of ${negative}`} tone="success" />
                <KpiCard label="Avg Rating" value={avg} tone="warning" />
              </div>
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}
