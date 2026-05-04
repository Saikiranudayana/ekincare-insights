import { PageShell } from "@/components/PageShell";
import { useSheetsData } from "@/hooks/useSheetsData";
import { useFilters } from "@/components/FiltersProvider";
import { applyFilters, groupCount } from "@/lib/utils-data";
import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AlertTriangle, Tag, Layers, ChevronRight, TrendingDown, Globe, Smartphone, Apple } from "lucide-react";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

const PLATFORM_COLOR: Record<string, string> = {
  Playstore: "#10b981", iOS: "#3b82f6", Google: "#f97316",
};
const PLATFORM_ICON: Record<string, React.ReactNode> = {
  Playstore: <Smartphone className="h-3.5 w-3.5" />,
  iOS: <Apple className="h-3.5 w-3.5" />,
  Google: <Globe className="h-3.5 w-3.5" />,
};

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

function StatBadge({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-3 rounded-xl border bg-white shadow-sm">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xl font-bold" style={{ color }}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

function TopBar({ items, color }: { items: { name: string; value: number }[]; color: string }) {
  const max = items[0]?.value || 1;
  return (
    <div className="space-y-2">
      {items.map(({ name, value }, i) => (
        <div key={name} className="flex items-center gap-2 text-xs">
          <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0 text-white" style={{ background: color, fontSize: 10 }}>{i + 1}</span>
          <div className="flex-1">
            <div className="flex justify-between mb-0.5">
              <span className="truncate text-gray-700">{name}</span>
              <span className="text-gray-500 ml-1 shrink-0">{value}</span>
            </div>
            <div className="bg-gray-100 rounded-full h-1.5">
              <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const TABS = ["Overview", "By Category", "By Issue", "By Platform", "Trends"];

export default function IssueAnalysis() {
  const { data } = useSheetsData();
  const { filters } = useFilters();
  const [activeTab, setActiveTab] = useState("Overview");

  const reviews = useMemo(() => applyFilters(data?.reviews ?? [], filters, "review"), [data, filters]);
  const negReviews = useMemo(() => reviews.filter((r) => r.rating > 0 && r.rating <= 2), [reviews]);

  const byCLM    = useMemo(() => groupCount(reviews,    (r) => r.clmCategory), [reviews]);
  const byIssue  = useMemo(() => groupCount(reviews,    (r) => r.issue),       [reviews]);
  const bySub    = useMemo(() => groupCount(reviews,    (r) => r.subIssue),    [reviews]);
  const byService= useMemo(() => groupCount(reviews,    (r) => r.service),     [reviews]);
  const negByCLM = useMemo(() => groupCount(negReviews, (r) => r.clmCategory), [negReviews]);
  const negByIssue = useMemo(() => groupCount(negReviews, (r) => r.issue),     [negReviews]);

  // Per-platform issue breakdown
  const platformIssues = useMemo(() =>
    ["Playstore", "iOS", "Google"].map((p) => {
      const rs = reviews.filter((r) => r.platform === p);
      return {
        platform: p,
        ...groupCount(rs.filter(r => r.clmCategory), r => r.clmCategory)
          .slice(0, 4)
          .reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {}),
      };
    }), [reviews]);

  // Sentiment by category (stacked bar)
  const clmSentiment = useMemo(() =>
    byCLM.slice(0, 8).map(({ name }) => {
      const rs = reviews.filter((r) => r.clmCategory === name);
      return {
        name: name.length > 16 ? name.slice(0, 16) + "…" : name,
        Positive: rs.filter((r) => r.rating >= 4).length,
        Neutral:  rs.filter((r) => r.rating === 3).length,
        Negative: rs.filter((r) => r.rating > 0 && r.rating <= 2).length,
      };
    }), [byCLM, reviews]);

  return (
    <PageShell title="Issue Analysis" subtitle="Deep-dive into complaint categories, issues & problem areas">
      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "Overview" && (
        <div className="space-y-5">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatBadge label="Total Reviews" value={reviews.length} sub="across all platforms" color="#6366f1" />
            <StatBadge label="Negative Reviews" value={negReviews.length} sub={`${reviews.length ? ((negReviews.length/reviews.length)*100).toFixed(1) : 0}% of total`} color="#ef4444" />
            <StatBadge label="Unique Issues" value={byIssue.length} sub="distinct issue types" color="#f59e0b" />
            <StatBadge label="CLM Categories" value={byCLM.length} sub="distinct categories" color="#10b981" />
          </div>

          {/* CLM + Issue side-by-side */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="panel p-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="h-4 w-4 text-indigo-500" />
                <h3 className="font-semibold text-gray-800">CLM Categories</h3>
                <span className="ml-auto text-xs text-gray-400">{byCLM.length} categories</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byCLM.slice(0, 10)} layout="vertical" barSize={14}>
                  <XAxis type="number" fontSize={10} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={110} fontSize={10} tick={{ fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Reviews">
                    {byCLM.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="panel p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-gray-800">Top Issues</h3>
                <span className="ml-auto text-xs text-gray-400">{byIssue.length} issue types</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byIssue.slice(0, 10)} layout="vertical" barSize={14}>
                  <XAxis type="number" fontSize={10} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={110} fontSize={10} tick={{ fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Reviews">
                    {byIssue.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sentiment by Category stacked */}
          <div className="panel p-5">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-4 w-4 text-indigo-500" />
              <h3 className="font-semibold text-gray-800">Sentiment by Category</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={clmSentiment} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" fontSize={10} tick={{ fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Positive" stackId="a" fill="#22c55e" />
                <Bar dataKey="Neutral"  stackId="a" fill="#f59e0b" />
                <Bar dataKey="Negative" stackId="a" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── BY CATEGORY TAB ── */}
      {activeTab === "By Category" && (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="panel p-5">
              <h3 className="font-semibold text-gray-800 mb-4">All Categories — All Reviews</h3>
              <TopBar items={byCLM.slice(0, 12)} color="#6366f1" />
            </div>
            <div className="panel p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Negative Reviews by Category
              </h3>
              <TopBar items={negByCLM.slice(0, 12)} color="#ef4444" />
            </div>
          </div>
          <div className="panel p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Category Pie Distribution</h3>
            <div className="flex items-center gap-6 flex-wrap">
              <ResponsiveContainer width={260} height={260}>
                <PieChart>
                  <Pie data={byCLM.slice(0, 8)} cx="50%" cy="50%" outerRadius={110} paddingAngle={2} dataKey="value" nameKey="name">
                    {byCLM.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [`${v} reviews`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 grid grid-cols-2 gap-2">
                {byCLM.slice(0, 8).map(({ name, value }, i) => (
                  <div key={name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-600 truncate text-xs">{name}</span>
                    <span className="ml-auto font-semibold text-xs text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BY ISSUE TAB ── */}
      {activeTab === "By Issue" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="panel p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Top Issues</h3>
            <TopBar items={byIssue.slice(0, 15)} color="#6366f1" />
          </div>
          <div className="panel p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Top Sub-Issues</h3>
            <TopBar items={bySub.slice(0, 15)} color="#f59e0b" />
          </div>
          <div className="panel p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Issues in Negative Reviews</h3>
            <TopBar items={negByIssue.slice(0, 12)} color="#ef4444" />
          </div>
          <div className="panel p-5">
            <h3 className="font-semibold text-gray-800 mb-4">By Service Type</h3>
            <TopBar items={byService.slice(0, 12)} color="#10b981" />
          </div>
        </div>
      )}

      {/* ── BY PLATFORM TAB ── */}
      {activeTab === "By Platform" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {["Playstore", "iOS", "Google"].map((plat) => {
              const rs = reviews.filter((r) => r.platform === plat);
              const topCLM = groupCount(rs.filter(r => r.clmCategory), r => r.clmCategory).slice(0, 8);
              const topIssue = groupCount(rs.filter(r => r.issue), r => r.issue).slice(0, 6);
              const color = PLATFORM_COLOR[plat];
              return (
                <div key={plat} className="panel p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: color + "22", color }}>
                      {PLATFORM_ICON[plat]}
                    </span>
                    <h3 className="font-semibold text-gray-800">{plat}</h3>
                    <span className="ml-auto text-xs text-gray-400">{rs.length} reviews</span>
                  </div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Top Categories</h4>
                  <TopBar items={topCLM} color={color} />
                  <h4 className="text-xs font-semibold text-gray-500 mt-4 mb-2 uppercase tracking-wide">Top Issues</h4>
                  <TopBar items={topIssue} color={color} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TRENDS TAB ── */}
      {activeTab === "Trends" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="panel p-5">
              <h3 className="font-semibold text-gray-800 mb-4">CLM Category Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byCLM.slice(0, 12)} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" fontSize={9} tick={{ fill: "#6b7280" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={50} />
                  <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4,4,0,0]} name="Reviews">
                    {byCLM.slice(0, 12).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="panel p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Sub-Issue Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bySub.slice(0, 10)} layout="vertical" barSize={14}>
                  <XAxis type="number" fontSize={10} tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={120} fontSize={10} tick={{ fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0,6,6,0]} name="Reviews">
                    {bySub.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
