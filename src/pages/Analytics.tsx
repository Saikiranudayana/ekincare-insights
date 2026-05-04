import { PageShell } from "@/components/PageShell";
import { useSheetsData } from "@/hooks/useSheetsData";
import { useFilters } from "@/components/FiltersProvider";
import { applyFilters, parseDate, groupCount } from "@/lib/utils-data";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import {
  MessageSquare, TrendingUp, TrendingDown, Star, ThumbsUp, ThumbsDown,
  Clock, BarChart3, Globe, Smartphone, Apple,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Review } from "@/lib/types";

const PLATFORM_COLORS: Record<string, string> = {
  Playstore: "#34d399",
  iOS: "#60a5fa",
  Google: "#f97316",
};

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  Playstore: <Smartphone className="h-4 w-4" />,
  iOS: <Apple className="h-4 w-4" />,
  Google: <Globe className="h-4 w-4" />,
};

const SENTIMENT_COLORS = {
  Positive: "#22c55e",
  Neutral: "#f59e0b",
  Negative: "#ef4444",
};

function getSentiment(r: Review) {
  if (r.rating >= 4) return "Positive";
  if (r.rating === 3) return "Neutral";
  if (r.rating > 0 && r.rating <= 2) return "Negative";
  return null;
}

const TABS = ["Overview", "Platforms", "Ratings", "Sentiment", "Topics"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-xl rounded-xl p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
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

export default function Analytics() {
  const { data } = useSheetsData();
  const { filters } = useFilters();
  const [activeTab, setActiveTab] = useState("Overview");
  const [granularity, setGranularity] = useState<"Daily" | "Weekly" | "Monthly">("Daily");

  const reviews = useMemo(
    () => applyFilters(data?.reviews ?? [], filters, "review"),
    [data, filters]
  );
  const daywise = useMemo(
    () => applyFilters(data?.daywise ?? [], filters, "daywise"),
    [data, filters]
  );

  // KPIs
  const total = reviews.length;
  const positive = reviews.filter((r) => r.rating >= 4).length;
  const negative = reviews.filter((r) => r.rating > 0 && r.rating <= 2).length;
  const neutral = reviews.filter((r) => r.rating === 3).length;
  const rated = reviews.filter((r) => r.rating > 0);
  const avg = rated.length ? (rated.reduce((s, r) => s + r.rating, 0) / rated.length) : 0;
  const responded = reviews.filter((r) => /connected|responded/i.test(r.status)).length;

  // Response time avg
  const rtimes = reviews
    .map((r) => {
      const m = r.firstResponseTime?.match(/(\d+)/);
      return m ? parseInt(m[1]) : null;
    })
    .filter(Boolean) as number[];
  const avgRT = rtimes.length ? Math.round(rtimes.reduce((a, b) => a + b, 0) / rtimes.length) : 0;

  // Reviews over time
  const reviewsOverTime = useMemo(() => {
    const map = new Map<string, { date: string; count: number; positive: number; negative: number; neutral: number; sortKey: number }>();
    daywise.forEach((d) => {
      const dt = parseDate(d.date);
      if (!dt) return;
      let key = "";
      if (granularity === "Daily") key = d.date;
      else if (granularity === "Weekly") {
        const wk = Math.ceil(dt.getDate() / 7);
        key = `${dt.toLocaleString("en", { month: "short" })} W${wk}`;
      } else {
        key = dt.toLocaleString("en", { month: "short", year: "2-digit" });
      }
      const cur = map.get(key) ?? { date: key, count: 0, positive: 0, negative: 0, neutral: 0, sortKey: dt.getTime() };
      cur.count += d.total;
      cur.positive += d.positive;
      cur.negative += d.negative;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => a.sortKey - b.sortKey).slice(-30);
  }, [daywise, granularity]);

  // Sentiment over time
  const sentimentOverTime = useMemo(() => reviewsOverTime, [reviewsOverTime]);

  // Platform performance
  const platforms = ["Playstore", "iOS", "Google"];
  const platformPerf = useMemo(() =>
    platforms.map((p) => {
      const rs = reviews.filter((r) => r.platform === p);
      return {
        platform: p,
        Positive: rs.filter((r) => r.rating >= 4).length,
        Neutral: rs.filter((r) => r.rating === 3).length,
        Negative: rs.filter((r) => r.rating > 0 && r.rating <= 2).length,
        total: rs.length,
      };
    }), [reviews]);

  // Avg rating by platform
  const avgByPlatform = useMemo(() =>
    platforms.map((p) => {
      const rs = reviews.filter((r) => r.platform === p && r.rating > 0);
      const a = rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : 0;
      return { platform: p, avg: parseFloat(a.toFixed(2)), total: rs.length };
    }), [reviews]);

  // Rating breakdown 1-5
  const ratingBreakdown = useMemo(() => {
    return [5, 4, 3, 2, 1].map((star) => {
      const cnt = reviews.filter((r) => r.rating === star).length;
      const pct = total ? ((cnt / total) * 100).toFixed(1) : "0";
      return { star, count: cnt, pct: parseFloat(pct) };
    });
  }, [reviews, total]);

  // Sentiment overview
  const sentimentData = useMemo(() => [
    { name: "Positive", value: positive, color: "#22c55e" },
    { name: "Neutral", value: neutral, color: "#f59e0b" },
    { name: "Negative", value: negative, color: "#ef4444" },
  ], [positive, neutral, negative]);

  // Top negative topics (CLM categories for negative reviews)
  const topNegTopics = useMemo(() =>
    groupCount(
      reviews.filter((r) => r.rating > 0 && r.rating <= 2).filter((r) => r.clmCategory),
      (r) => r.clmCategory
    ).slice(0, 8),
    [reviews]
  );

  // Review by platform (pie)
  const reviewByPlatform = useMemo(() =>
    platforms.map((p) => ({ name: p, value: reviews.filter((r) => r.platform === p).length }))
  , [reviews]);

  return (
    <PageShell title="Analytics" subtitle="ORM insights across all platforms">
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiBlock
          label="Total Reviews"
          value={total.toLocaleString()}
          sub={`${responded} responded`}
          icon={<MessageSquare className="h-5 w-5" />}
          color="bg-blue-50 text-blue-600"
          trend="+12%"
          trendUp
        />
        <KpiBlock
          label="Positive Reviews"
          value={positive.toLocaleString()}
          sub={total ? `${((positive / total) * 100).toFixed(1)}% of total` : "—"}
          icon={<ThumbsUp className="h-5 w-5" />}
          color="bg-green-50 text-green-600"
          trend="+8%"
          trendUp
        />
        <KpiBlock
          label="Negative Reviews"
          value={negative.toLocaleString()}
          sub={total ? `${((negative / total) * 100).toFixed(1)}% of total` : "—"}
          icon={<ThumbsDown className="h-5 w-5" />}
          color="bg-red-50 text-red-600"
          trend="-3%"
          trendUp={false}
        />
        <KpiBlock
          label="Avg Rating"
          value={avg.toFixed(2)}
          sub={<StarRating rating={avg} />}
          icon={<Star className="h-5 w-5" />}
          color="bg-amber-50 text-amber-600"
          trend="+0.1"
          trendUp
        />
      </div>

      {/* ── OVERVIEW TAB ── */}
      {(activeTab === "Overview") && (<>
      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        {/* Reviews Over Time */}
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Reviews Over Time</h3>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as any)}
              className="text-xs border rounded-lg px-2 py-1 bg-white text-gray-600"
            >
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={reviewsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" fontSize={10} tick={{ fill: "#9ca3af" }} tickLine={false} />
              <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Total" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment Over Time */}
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Sentiment Over Time</h3>
            <div className="flex gap-3 text-xs">
              {Object.entries(SENTIMENT_COLORS).map(([k, c]) => (
                <span key={k} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                  {k}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={sentimentOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" fontSize={10} tick={{ fill: "#9ca3af" }} tickLine={false} />
              <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="positive" stroke="#22c55e" strokeWidth={2} dot={false} name="Positive" />
              <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} dot={false} name="Negative" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        {/* Platform Performance stacked bar */}
        <div className="panel p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Platform Performance</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={platformPerf} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="platform" fontSize={11} tick={{ fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Positive" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Neutral" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Negative" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment Overview Pie */}
        <div className="panel p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Sentiment Overview</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {sentimentData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any, n: any) => [`${v} reviews`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {sentimentData.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-gray-600">{s.name}</span>
                </div>
                <span className="font-semibold text-gray-800">
                  {s.value} <span className="text-gray-400 font-normal text-xs">({total ? ((s.value / total) * 100).toFixed(0) : 0}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        {/* Rating Breakdown */}
        <div className="panel p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Rating Breakdown</h3>
          <div className="flex items-center justify-center mb-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">{avg.toFixed(1)}</div>
              <StarRating rating={avg} />
              <div className="text-xs text-gray-400 mt-1">{rated.length} ratings</div>
            </div>
          </div>
          <div className="space-y-2">
            {ratingBreakdown.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="text-amber-500 flex items-center gap-0.5 w-10 shrink-0">
                  {star}<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: star >= 4 ? "#22c55e" : star === 3 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
                <span className="text-gray-500 text-xs w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Avg Rating by Platform */}
        <div className="panel p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Avg Rating by Platform</h3>
          <div className="space-y-5">
            {avgByPlatform.map(({ platform, avg: a, total: t }) => (
              <div key={platform}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: `${PLATFORM_COLORS[platform]}22`, color: PLATFORM_COLORS[platform] }}>
                      {PLATFORM_ICONS[platform]}
                    </span>
                    {platform}
                  </div>
                  <span className="text-sm font-bold text-gray-900">{a.toFixed(2)}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(a / 5) * 100}%`, background: PLATFORM_COLORS[platform] }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{t} reviews</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Negative Topics */}
        <div className="panel p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Top Negative Topics</h3>
          <div className="space-y-2">
            {topNegTopics.length === 0 && (
              <p className="text-sm text-gray-400">No data</p>
            )}
            {topNegTopics.map(({ name, value }, i) => {
              const max = topNegTopics[0]?.value || 1;
              return (
                <div key={name} className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-0.5">
                      <span className="truncate text-gray-700 text-xs">{name}</span>
                      <span className="text-gray-500 text-xs ml-1">{value}</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${(value / max) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Reviews by Platform</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={reviewByPlatform} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value">
                  {reviewByPlatform.map((entry, i) => (
                    <Cell key={i} fill={PLATFORM_COLORS[entry.name] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {reviewByPlatform.map(({ name, value }) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${PLATFORM_COLORS[name]}22`, color: PLATFORM_COLORS[name] }}>
                    {PLATFORM_ICONS[name]}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-700">{name}</div>
                    <div className="text-lg font-bold text-gray-900">{value.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Reviews by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={groupCount(reviews.filter(r => r.clmCategory), r => r.clmCategory).slice(0, 7)} layout="vertical" barSize={14}>
              <XAxis type="number" fontSize={10} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={90} fontSize={10} tick={{ fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} name="Reviews" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      </>)}

      {/* ── PLATFORMS TAB ── */}
      {activeTab === "Platforms" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="panel p-5 lg:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-4">Platform Performance (Stacked)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={platformPerf} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="platform" fontSize={12} tick={{ fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Positive" stackId="a" fill="#22c55e" />
                <Bar dataKey="Neutral" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Negative" stackId="a" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {avgByPlatform.map(({ platform, avg: a, total: t }) => (
            <div key={platform} className="panel p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${PLATFORM_COLORS[platform]}22`, color: PLATFORM_COLORS[platform] }}>
                  {PLATFORM_ICONS[platform]}
                </span>
                <div>
                  <div className="font-bold text-gray-900">{platform}</div>
                  <div className="text-xs text-gray-400">{t} rated reviews</div>
                </div>
                <div className="ml-auto text-2xl font-bold" style={{ color: PLATFORM_COLORS[platform] }}>{a.toFixed(2)}</div>
              </div>
              <StarRating rating={a} />
              <div className="mt-3 space-y-2">
                {["Positive","Neutral","Negative"].map((s) => {
                  const cnt = platformPerf.find(p => p.platform === platform)?.[s as keyof typeof platformPerf[0]] as number ?? 0;
                  const col = s === "Positive" ? "#22c55e" : s === "Neutral" ? "#f59e0b" : "#ef4444";
                  return (
                    <div key={s} className="flex items-center gap-2 text-xs">
                      <span className="w-16 text-gray-500">{s}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="h-full rounded-full" style={{ width: `${t ? (cnt/t)*100 : 0}%`, background: col }} />
                      </div>
                      <span className="w-8 text-right font-semibold text-gray-700">{cnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── RATINGS TAB ── */}
      {activeTab === "Ratings" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="panel p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Rating Distribution (1–5 Stars)</h3>
            <div className="flex justify-center mb-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900">{avg.toFixed(1)}</div>
                <StarRating rating={avg} />
                <div className="text-xs text-gray-400 mt-1">{rated.length} ratings total</div>
              </div>
            </div>
            <div className="space-y-3">
              {ratingBreakdown.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm text-amber-500 w-8 shrink-0">{star} ★</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: star >= 4 ? "#22c55e" : star === 3 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-8 text-right">{count}</span>
                  <span className="text-xs text-gray-400 w-10">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Rating Distribution Chart</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ratingBreakdown} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="star" fontSize={12} tickFormatter={(v) => `${v}★`} tick={{ fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [`${v} reviews`, "Count"]} />
                <Bar dataKey="count" radius={[4,4,0,0]} name="Reviews">
                  {ratingBreakdown.map(({ star }, i) => <Cell key={i} fill={star >= 4 ? "#22c55e" : star === 3 ? "#f59e0b" : "#ef4444"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── SENTIMENT TAB ── */}
      {activeTab === "Sentiment" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {sentimentData.map((s) => (
              <div key={s.name} className="panel p-5 text-center">
                <div className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                <div className="text-sm text-gray-500">{s.name} Reviews</div>
                <div className="text-xs text-gray-400">{total ? ((s.value/total)*100).toFixed(1) : 0}% of total</div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="panel p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Sentiment Breakdown</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3} dataKey="value">
                    {sentimentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [`${v} reviews`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="panel p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Sentiment Over Time</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={sentimentOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" fontSize={10} tick={{ fill: "#9ca3af" }} tickLine={false} />
                  <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="positive" stroke="#22c55e" strokeWidth={2} dot={false} name="Positive" />
                  <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} dot={false} name="Negative" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TOPICS TAB ── */}
      {activeTab === "Topics" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="panel p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Top Negative Topics</h3>
            <div className="space-y-3">
              {topNegTopics.map(({ name, value }, i) => {
                const max = topNegTopics[0]?.value || 1;
                return (
                  <div key={name} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700 text-xs truncate">{name}</span>
                        <span className="text-gray-500 text-xs ml-2">{value}</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${(value/max)*100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="panel p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Reviews by Category</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={groupCount(reviews.filter(r => r.clmCategory), r => r.clmCategory).slice(0,8)} layout="vertical" barSize={14}>
                <XAxis type="number" fontSize={10} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={100} fontSize={10} tick={{ fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#6366f1" radius={[0,4,4,0]} name="Reviews" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function KpiBlock({
  label, value, sub, icon, color, trend, trendUp,
}: {
  label: string;
  value: string;
  sub: React.ReactNode;
  icon: React.ReactNode;
  color: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="kpi-card group hover:-translate-y-0.5 transition-transform">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{value}</p>
          <div className="mt-1 text-xs text-gray-400">{sub}</div>
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          {icon}
        </div>
      </div>
      <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${trendUp ? "text-green-600" : "text-red-500"}`}>
        {trendUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        {trend} vs last period
      </div>
    </div>
  );
}
