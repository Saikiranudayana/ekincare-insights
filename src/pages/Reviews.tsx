import { PageShell } from "@/components/PageShell";
import { useSheetsData } from "@/hooks/useSheetsData";
import { useFilters } from "@/components/FiltersProvider";
import { applyFilters, parseDate } from "@/lib/utils-data";
import { useMemo, useState, useCallback } from "react";
import { Review } from "@/lib/types";
import {
  Search, Download, Eye, ChevronLeft, ChevronRight,
  Globe, Smartphone, Apple, X, Star, Clock, User,
  MessageSquare, FileText, Tag, ArrowUpDown, Filter,
  CheckCircle2, AlertCircle, Calendar, MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuCheckboxItem,
  DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Platform helpers ─────────────────────────────────────────────────────────
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

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${PLATFORM_COLOR[platform] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {PLATFORM_ICON[platform] ?? <Globe className="h-3 w-3" />}
      {platform}
    </span>
  );
}

// ─── Star renderer ────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  if (!rating) return <span className="text-xs text-gray-400">—</span>;
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

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  if (/connect|respond/i.test(s)) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-medium"><CheckCircle2 className="h-3 w-3" />Responded</span>;
  }
  if (/pending|rnr|busy|switch/i.test(s)) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium"><AlertCircle className="h-3 w-3" />Pending</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200 text-xs font-medium">{status || "—"}</span>;
}

// ─── Review Detail Modal ───────────────────────────────────────────────────────
function ReviewDetailModal({ review, onClose }: { review: Review; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <PlatformBadge platform={review.platform} />
            <span className="text-xs text-gray-400">Review Details</span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-0">
          {/* Left Content */}
          <div className="flex-1 p-6 space-y-5 border-r min-w-0">
            {/* Reviewer */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {(review.customer || "?")[0]?.toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{review.customer || "Anonymous"}</div>
                {review.mobile && <div className="text-xs text-gray-400">{review.mobile}</div>}
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <Calendar className="h-3 w-3" />
                  {review.reviewDate} {review.reviewTime && `· ${review.reviewTime}`}
                </div>
              </div>
            </div>

            {/* Review */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Review</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed border">
                {review.comments || <span className="text-gray-400 italic">No review text</span>}
              </div>
            </div>

            {/* Response */}
            {(review.summary || review.finalComment) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">Response</span>
                  <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">Responded</span>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed border border-blue-100">
                  {review.summary || review.finalComment}
                  {review.ownership && (
                    <div className="mt-2 text-xs text-gray-400">— {review.ownership}</div>
                  )}
                </div>
              </div>
            )}

            {/* Internal Notes */}
            {review.remarks && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">Internal Notes</span>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-sm text-gray-600 border border-amber-100">
                  {review.remarks}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="w-56 shrink-0 p-5 space-y-4 bg-gray-50 rounded-br-2xl">
            {/* Rating */}
            <div className="bg-white rounded-xl border p-3 text-center">
              <div className="text-3xl font-bold text-gray-900">{review.rating || "—"}</div>
              <div className="flex justify-center mt-1">
                <Stars rating={review.rating} />
              </div>
            </div>

            {/* Meta fields */}
            <div className="space-y-3">
              {[
                { label: "Platform", value: <PlatformBadge platform={review.platform} /> },
                { label: "Status", value: <StatusBadge status={review.status} /> },
                { label: "Response Time", value: review.firstResponseTime || "—" },
                { label: "Responded By", value: review.ownership || "—" },
                { label: "Actioned Date", value: review.actionedDate || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                  <div className="text-xs font-medium text-gray-700">{value}</div>
                </div>
              ))}
            </div>

            {/* Classification */}
            <div className="border-t pt-3 space-y-2">
              {review.clmCategory && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Category</div>
                  <span className="inline-flex px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium">
                    {review.clmCategory}
                  </span>
                </div>
              )}
              {review.issue && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Issue</div>
                  <span className="text-xs font-medium text-gray-700">{review.issue}</span>
                </div>
              )}
              {review.conversion && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Converted</div>
                  <span className={`text-xs font-medium ${/^y/i.test(review.conversion) ? "text-green-600" : "text-gray-500"}`}>
                    {review.conversion}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sorting helper ───────────────────────────────────────────────────────────
type SortKey = "reviewDate" | "rating" | "customer" | "platform" | "status";
type SortDir = "asc" | "desc";

// ─── Main page ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function Reviews() {
  const { data } = useSheetsData();
  const { filters } = useFilters();
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("reviewDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Review | null>(null);

  const allReviews = useMemo(
    () => applyFilters(data?.reviews ?? [], filters, "review"),
    [data, filters]
  );

  const rows = useMemo(() => {
    let r = allReviews;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (x) =>
          x.customer?.toLowerCase().includes(q) ||
          x.comments?.toLowerCase().includes(q) ||
          x.clmCategory?.toLowerCase().includes(q) ||
          x.platform?.toLowerCase().includes(q)
      );
    }
    if (platformFilter.length) r = r.filter((x) => platformFilter.includes(x.platform));
    if (ratingFilter.length) r = r.filter((x) => ratingFilter.includes(x.rating));
    if (statusFilter !== "all") {
      if (statusFilter === "responded") r = r.filter((x) => /connect|respond/i.test(x.status));
      if (statusFilter === "pending") r = r.filter((x) => !/connect|respond/i.test(x.status) && x.status);
    }

    r = [...r].sort((a, b) => {
      let av: any = a[sortKey], bv: any = b[sortKey];
      if (sortKey === "reviewDate") {
        av = parseDate(a.reviewDate)?.getTime() ?? 0;
        bv = parseDate(b.reviewDate)?.getTime() ?? 0;
      }
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return r;
  }, [allReviews, search, platformFilter, ratingFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
    setPage(1);
  };

  const exportCsv = () => {
    const headers = ["Customer", "Platform", "Rating", "Review", "Date", "Status", "Category", "First Response", "Actioned"];
    const csvRows = rows.map((r) =>
      [r.customer, r.platform, r.rating, `"${(r.comments || "").replace(/"/g, '""')}"`, r.reviewDate, r.status, r.clmCategory, r.firstResponseTime, r.actionedDate].join(",")
    );
    const blob = new Blob([[headers.join(","), ...csvRows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "reviews.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const SortBtn = ({ col, label }: { col: SortKey; label: string }) => (
    <button
      className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
      onClick={() => toggleSort(col)}
    >
      {label}
      <ArrowUpDown className={`h-3.5 w-3.5 ${sortKey === col ? "text-indigo-600" : "opacity-40"}`} />
    </button>
  );

  return (
    <PageShell title="Reviews" subtitle="All customer reviews with filtering, sorting & export">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-3 h-9 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Platform filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1">
              <Globe className="h-4 w-4" />
              {platformFilter.length ? `${platformFilter.length} Platform(s)` : "All Platforms"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["Playstore", "iOS", "Google"].map((p) => (
              <DropdownMenuCheckboxItem
                key={p} checked={platformFilter.includes(p)}
                onCheckedChange={() => {
                  setPlatformFilter((f) => f.includes(p) ? f.filter((x) => x !== p) : [...f, p]);
                  setPage(1);
                }}
              >{p}</DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Rating filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1">
              <Star className="h-4 w-4" />
              {ratingFilter.length ? `${ratingFilter.join(",")}★` : "All Ratings"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {[5, 4, 3, 2, 1].map((r) => (
              <DropdownMenuCheckboxItem
                key={r} checked={ratingFilter.includes(r)}
                onCheckedChange={() => {
                  setRatingFilter((f) => f.includes(r) ? f.filter((x) => x !== r) : [...f, r]);
                  setPage(1);
                }}
              >{r} {r === 1 ? "star" : "stars"}</DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 text-sm border rounded-lg px-3 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="all">All Status</option>
          <option value="responded">Responded</option>
          <option value="pending">Pending</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">{rows.length} reviews</span>
          <Button variant="outline" size="sm" className="h-9 gap-1" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3 text-left font-semibold"><SortBtn col="customer" label="Customer" /></th>
              <th className="px-4 py-3 text-left font-semibold"><SortBtn col="platform" label="Platform" /></th>
              <th className="px-4 py-3 text-left font-semibold"><SortBtn col="rating" label="Rating" /></th>
              <th className="px-4 py-3 text-left font-semibold">Review</th>
              <th className="px-4 py-3 text-left font-semibold"><SortBtn col="reviewDate" label="Date" /></th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-left font-semibold"><SortBtn col="status" label="Status" /></th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pageRows.length === 0 && (
              <tr><td colSpan={8} className="py-16 text-center text-gray-400">No reviews found</td></tr>
            )}
            {pageRows.map((r, i) => (
              <tr
                key={i}
                className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                onClick={() => setSelected(r)}
              >
                {/* Customer */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(r.customer || "?")[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 truncate max-w-[120px]">{r.customer || "Anonymous"}</div>
                      {r.mobile && <div className="text-xs text-gray-400 truncate max-w-[120px]">{r.mobile}</div>}
                    </div>
                  </div>
                </td>
                {/* Platform */}
                <td className="px-4 py-3"><PlatformBadge platform={r.platform} /></td>
                {/* Rating */}
                <td className="px-4 py-3"><Stars rating={r.rating} /></td>
                {/* Review */}
                <td className="px-4 py-3">
                  <span className="line-clamp-2 text-gray-600 max-w-[220px] block leading-snug text-xs">
                    {r.comments || <span className="italic text-gray-300">No text</span>}
                  </span>
                </td>
                {/* Date */}
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{r.reviewDate || "—"}</td>
                {/* Category */}
                <td className="px-4 py-3">
                  {r.clmCategory ? (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs">
                      {r.clmCategory}
                    </span>
                  ) : <span className="text-gray-300 text-xs">—</span>}
                </td>
                {/* Status */}
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                {/* Actions */}
                <td className="px-4 py-3">
                  <button
                    className="h-7 w-7 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition"
                    onClick={(e) => { e.stopPropagation(); setSelected(r); }}
                    title="View detail"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
        <span>
          Showing {rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length} reviews
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pg = i + 1;
            if (totalPages > 5) {
              if (page <= 3) pg = i + 1;
              else if (page >= totalPages - 2) pg = totalPages - 4 + i;
              else pg = page - 2 + i;
            }
            return (
              <Button
                key={pg} variant={pg === page ? "default" : "outline"} size="sm"
                onClick={() => setPage(pg)}
                className={pg === page ? "bg-indigo-600 text-white border-indigo-600" : ""}
              >
                {pg}
              </Button>
            );
          })}
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Review Detail Modal */}
      {selected && <ReviewDetailModal review={selected} onClose={() => setSelected(null)} />}
    </PageShell>
  );
}
