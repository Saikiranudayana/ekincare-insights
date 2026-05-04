import { PageShell } from "@/components/PageShell";
import { useSheetsData } from "@/hooks/useSheetsData";
import { useFilters } from "@/components/FiltersProvider";
import { applyFilters, groupCount } from "@/lib/utils-data";
import { useMemo } from "react";
import { Globe, TrendingUp, TrendingDown, Star, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import playstoreLogo from "@/images/playstore-logo.jpg";
import appstoreLogo from "@/images/appstore-logo.jpg";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const PLATFORMS = [
  { key: "Playstore", logoImg: playstoreLogo,  color: "#10b981", light: "#d1fae5", border: "#6ee7b7" },
  { key: "iOS",       logoImg: appstoreLogo,   color: "#3b82f6", light: "#dbeafe", border: "#93c5fd" },
  { key: "Google",   logoImg: null,            color: "#f97316", light: "#ffedd5", border: "#fdba74" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-xl rounded-xl p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < Math.round(rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function PlatformAnalytics() {
  const { data } = useSheetsData();
  const { filters } = useFilters();
  const reviews = useMemo(() => applyFilters(data?.reviews ?? [], filters, "review"), [data, filters]);

  const platformStats = useMemo(() =>
    PLATFORMS.map(({ key, color, light, border, logoImg }) => {
      const rs = reviews.filter((r) => r.platform === key);
      const total = rs.length;
      const rated = rs.filter((r) => r.rating > 0);
      const positive = rs.filter((r) => r.rating >= 4).length;
      const neutral  = rs.filter((r) => r.rating === 3).length;
      const negative = rs.filter((r) => r.rating > 0 && r.rating <= 2).length;
      const conv = rs.filter((r) => /^y/i.test(r.conversion)).length;
      const avg = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0;
      const ratingBreak = [5, 4, 3, 2, 1].map((s) => ({
        star: s, count: rs.filter((r) => r.rating === s).length,
      }));
      const topIssues = groupCount(rs.filter(r => r.clmCategory), r => r.clmCategory).slice(0, 5);
      return { key, color, light, border, logoImg, total, positive, neutral, negative, conv, avg, ratingBreak, topIssues, rated: rated.length };
    }), [reviews]);

  // Cross-platform comparison data
  const comparisonData = PLATFORMS.map((p) => {
    const s = platformStats.find((x) => x.key === p.key)!;
    return { platform: p.key, Positive: s.positive, Neutral: s.neutral, Negative: s.negative, Total: s.total };
  });

  const avgRatingData = platformStats.map((s) => ({
    platform: s.key, rating: parseFloat(s.avg.toFixed(2)), fill: s.color,
  }));

  return (
    <PageShell title="Platform Analytics" subtitle="Cross-platform performance comparison & breakdown">
      {/* Cross-platform comparison bar */}
      <div className="grid gap-4 lg:grid-cols-2 mb-5">
        <div className="panel p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Sentiment Comparison by Platform</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={comparisonData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="platform" fontSize={12} tick={{ fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Positive" stackId="a" fill="#22c55e" radius={[0,0,0,0]} />
              <Bar dataKey="Neutral"  stackId="a" fill="#f59e0b" />
              <Bar dataKey="Negative" stackId="a" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Avg Rating by Platform</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={avgRatingData} layout="vertical" barSize={22}>
              <XAxis type="number" domain={[0, 5]} fontSize={10} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="platform" type="category" width={80} fontSize={12} tick={{ fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} formatter={(v: any) => [`${v} / 5`, "Avg Rating"]} />
              <Bar dataKey="rating" radius={[0, 8, 8, 0]} name="Avg Rating">
                {avgRatingData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-platform deep-dive cards */}
      <div className="space-y-5">
        {platformStats.map((s) => {
          const Icon = PLATFORMS.find((p) => p.key === s.key)!.icon;
          const negPct = s.total ? ((s.negative / s.total) * 100).toFixed(1) : "0";
          const posPct = s.total ? ((s.positive / s.total) * 100).toFixed(1) : "0";
          const convPct = s.negative ? ((s.conv / s.negative) * 100).toFixed(1) : "0";
          const maxStar = s.ratingBreak[0]?.count || 1;

          return (
            <div key={s.key} className="panel p-5">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ background: s.light, border: `1px solid ${s.border}` }}>
                  {s.logoImg
                    ? <img src={s.logoImg} alt={s.key} className="h-9 w-9 object-contain rounded-lg" />
                    : <Globe className="h-6 w-6" style={{ color: s.color }} />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{s.key}</h2>
                  <p className="text-sm text-gray-500">{s.total.toLocaleString()} total reviews</p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-3xl font-bold" style={{ color: s.color }}>{s.avg.toFixed(2)}</div>
                  <Stars rating={s.avg} />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {/* KPI row */}
                <div className="lg:col-span-1 grid grid-cols-2 gap-3">
                  {[
                    { label: "Positive", value: s.positive, pct: posPct + "%", bg: "bg-green-50", text: "text-green-700", icon: <ThumbsUp className="h-4 w-4" /> },
                    { label: "Negative", value: s.negative, pct: negPct + "%", bg: "bg-red-50", text: "text-red-600", icon: <ThumbsDown className="h-4 w-4" /> },
                    { label: "Neutral",  value: s.neutral,  pct: s.total ? ((s.neutral/s.total)*100).toFixed(1)+"%" : "0%", bg: "bg-amber-50", text: "text-amber-700", icon: <Star className="h-4 w-4" /> },
                    { label: "Converted",value: s.conv,    pct: convPct + "%", bg: "bg-blue-50", text: "text-blue-700", icon: <RotateCcw className="h-4 w-4" /> },
                  ].map(({ label, value, pct, bg, text, icon }) => (
                    <div key={label} className={`rounded-xl p-3 ${bg}`}>
                      <div className={`flex items-center gap-1 ${text} mb-1`}>{icon}<span className="text-xs font-medium">{label}</span></div>
                      <div className={`text-2xl font-bold ${text}`}>{value}</div>
                      <div className="text-xs text-gray-400">{pct} of total</div>
                    </div>
                  ))}
                </div>

                {/* Star breakdown */}
                <div className="panel p-4 bg-gray-50 border-0">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Rating Breakdown</h4>
                  <div className="space-y-2">
                    {s.ratingBreak.map(({ star, count }) => (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="text-amber-500 text-xs w-6 shrink-0">{star}★</span>
                        <div className="flex-1 bg-white rounded-full h-2 overflow-hidden border border-gray-100">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${(count / Math.max(maxStar, 1)) * 100}%`, background: star >= 4 ? "#22c55e" : star === 3 ? "#f59e0b" : "#ef4444" }} />
                        </div>
                        <span className="text-gray-500 text-xs w-8 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top issues mini chart */}
                <div className="panel p-4 bg-gray-50 border-0">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Issues</h4>
                  {s.topIssues.length === 0
                    ? <p className="text-xs text-gray-400">No categorized issues</p>
                    : (
                      <ResponsiveContainer width="100%" height={130}>
                        <BarChart data={s.topIssues} layout="vertical" barSize={10}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={80} fontSize={10} tick={{ fill: "#6b7280" }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" fill={s.color} radius={[0, 4, 4, 0]} name="Reviews" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
