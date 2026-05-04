import { PageShell } from "@/components/PageShell";
import { useSheetsData } from "@/hooks/useSheetsData";
import { useFilters } from "@/components/FiltersProvider";
import { applyFilters, responseDelayHours, parseDate } from "@/lib/utils-data";
import { useMemo, useState } from "react";
import { Review } from "@/lib/types";
import {
  AlertCircle, Clock, Globe, Smartphone, Apple,
  Search, Zap, RefreshCw, ChevronRight,
  CheckCircle2, PhoneCall, RotateCcw, Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

interface Row extends Review {
  delayHours: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PLATFORM_ICON: Record<string, React.ReactNode> = {
  Playstore: <Smartphone className="h-3.5 w-3.5" />,
  iOS: <Apple className="h-3.5 w-3.5" />,
  Google: <Globe className="h-3.5 w-3.5" />,
};
const PLATFORM_COLOR: Record<string, string> = {
  Playstore: "bg-emerald-50 text-emerald-700 border-emerald-200",
  iOS: "bg-blue-50 text-blue-700 border-blue-200",
  Google: "bg-orange-50 text-orange-700 border-orange-200",
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function delayLabel(h: number | null): { label: string; cls: string } {
  if (h == null) return { label: "—", cls: "text-gray-400" };
  if (h > 48) return { label: `${h.toFixed(0)}h`, cls: "text-red-600 font-semibold" };
  if (h > 24) return { label: `${h.toFixed(0)}h`, cls: "text-amber-600 font-semibold" };
  return { label: `${h.toFixed(1)}h`, cls: "text-green-600" };
}

// ─── Filter tab definitions ────────────────────────────────────────────────
const FILTER_TABS = [
  { id: "all",      label: "All",        icon: <Zap className="h-4 w-4" /> },
  { id: "pending",  label: "Pending",    icon: <AlertCircle className="h-4 w-4" /> },
  { id: "followup", label: "Follow-ups", icon: <PhoneCall className="h-4 w-4" /> },
  { id: "rnr",      label: "RNR",        icon: <RotateCcw className="h-4 w-4" /> },
  { id: "overdue",  label: "Overdue 24h",icon: <Clock className="h-4 w-4" /> },
];

function matchTab(r: Row, tab: string): boolean {
  const status = (r.finalStatus || r.status || "").toLowerCase();
  const attempt = (r.attempt || "").toLowerCase();
  switch (tab) {
    case "all":      return true;
    case "pending":  return /pending/i.test(status) || (!status && r.rating <= 2);
    case "followup": return /follow/i.test(status) || /follow/i.test(attempt);
    case "rnr":      return /rnr|busy|switch.*off|not.*reachable/i.test(status) || /rnr/i.test(attempt);
    case "overdue":  return r.delayHours != null && r.delayHours > 24;
    default:         return true;
  }
}

// ─── Row card ─────────────────────────────────────────────────────────────────
function ReviewCard({ row }: { row: Row }) {
  const { label: dLabel, cls: dCls } = delayLabel(row.delayHours);
  const status = row.finalStatus || row.status || "Pending";
  const isPending  = /pending/i.test(status) || !row.finalStatus;
  const isFollowup = /follow/i.test(status);
  const isRnr      = /rnr|busy|switch|reachable/i.test(status);

  const statusBadge = isFollowup
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium"><PhoneCall className="h-3 w-3" />Follow-up</span>
    : isRnr
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium"><RotateCcw className="h-3 w-3" />RNR</span>
    : isPending
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium"><AlertCircle className="h-3 w-3" />Pending</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200 text-xs font-medium">{status}</span>;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-4 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {(row.customer || "?")[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate text-sm">{row.customer || "Anonymous"}</div>
            <div className="text-xs text-gray-400">{row.reviewDate || "—"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Platform */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${PLATFORM_COLOR[row.platform] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
            {PLATFORM_ICON[row.platform] ?? <Globe className="h-3 w-3" />}
            {row.platform}
          </span>
          {statusBadge}
        </div>
      </div>

      {/* Stars + delay */}
      <div className="flex items-center justify-between">
        <Stars rating={row.rating} />
        <span className={`text-xs flex items-center gap-1 ${dCls}`}>
          <Clock className="h-3 w-3" />
          {dLabel} delay
        </span>
      </div>

      {/* Review text */}
      {row.comments && (
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          "{row.comments}"
        </p>
      )}

      {/* Issue + category */}
      <div className="flex flex-wrap gap-1.5">
        {row.clmCategory && (
          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs">{row.clmCategory}</span>
        )}
        {row.issue && (
          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-xs">{row.issue}</span>
        )}
        {row.attempt && (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs">Attempt: {row.attempt}</span>
        )}
      </div>

      {/* Ownership footer */}
      {row.ownership && (
        <div className="text-xs text-gray-400 border-t pt-2 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Owner: <span className="text-gray-600 font-medium">{row.ownership}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LiveActionCenter() {
  const { data } = useSheetsData();
  const { filters } = useFilters();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");

  const reviews = useMemo(
    () => applyFilters(data?.reviews ?? [], filters, "review"),
    [data, filters]
  );

  // All unresolved low-rating reviews
  const allRows: Row[] = useMemo(
    () =>
      reviews
        .filter((r) => r.rating > 0 && r.rating <= 2)
        .filter((r) => !/resolved/i.test(r.finalStatus))
        .map((r) => ({ ...r, delayHours: responseDelayHours(r) })),
    [reviews]
  );

  // Tab counts
  const tabCounts = useMemo(() => {
    const out: Record<string, number> = {};
    FILTER_TABS.forEach((t) => {
      out[t.id] = allRows.filter((r) => matchTab(r, t.id)).length;
    });
    return out;
  }, [allRows]);

  // Filtered rows
  const rows = useMemo(() => {
    let r = allRows.filter((row) => matchTab(row, activeTab));
    if (platformFilter !== "all") r = r.filter((row) => row.platform === platformFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (row) =>
          row.customer?.toLowerCase().includes(q) ||
          row.comments?.toLowerCase().includes(q) ||
          row.issue?.toLowerCase().includes(q) ||
          row.clmCategory?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [allRows, activeTab, platformFilter, search]);

  // Summary KPIs
  const overdue24 = allRows.filter((r) => r.delayHours != null && r.delayHours > 24).length;
  const followups = allRows.filter((r) => /follow/i.test(r.finalStatus || r.status || "")).length;
  const rnr       = allRows.filter((r) => /rnr|busy|switch|reachable/i.test(r.finalStatus || r.status || "")).length;

  return (
    <PageShell
      title="Live Action Center"
      subtitle="Unresolved low-rating reviews requiring immediate attention"
    >
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Unresolved", value: allRows.length, color: "bg-red-50 text-red-600 border-red-100", icon: <AlertCircle className="h-5 w-5" /> },
          { label: "Pending Response", value: tabCounts["pending"] ?? 0, color: "bg-amber-50 text-amber-600 border-amber-100", icon: <Zap className="h-5 w-5" /> },
          { label: "Follow-ups", value: followups, color: "bg-blue-50 text-blue-600 border-blue-100", icon: <PhoneCall className="h-5 w-5" /> },
          { label: "Overdue (>24h)", value: overdue24, color: "bg-rose-50 text-rose-700 border-rose-100", icon: <Clock className="h-5 w-5" /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className={`rounded-xl border p-4 flex items-center gap-3 ${color} bg-opacity-60`}>
            <div className="h-10 w-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs font-medium opacity-80">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs + Search + Platform */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Tab pills */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.id ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-500"
              }`}>
                {tabCounts[tab.id] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Platform filter */}
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="h-9 text-sm border rounded-lg px-3 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="all">All Platforms</option>
          <option value="Playstore">Playstore</option>
          <option value="iOS">iOS</option>
          <option value="Google">Google</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews, issues…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 h-9 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-400">{rows.length} reviews</span>
          <Button
            variant="outline" size="sm"
            onClick={() => qc.invalidateQueries({ queryKey: ["sheets-data"] })}
            className="h-9 gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Cards Grid */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <CheckCircle2 className="h-12 w-12 mb-3 text-green-400" />
          <p className="text-lg font-medium text-gray-600">All clear!</p>
          <p className="text-sm">No reviews match this filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row, i) => (
            <ReviewCard key={i} row={row} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
