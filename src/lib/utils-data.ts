import { Review, DayWise } from "./types";

// Parse various date formats: dd-mm-yyyy, dd/mm/yyyy
export function parseDate(s: string): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (!m) return null;
  let [, d, mo, y] = m;
  if (y.length === 2) y = "20" + y;
  const dt = new Date(+y, +mo - 1, +d);
  return isNaN(dt.getTime()) ? null : dt;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Parse "HH:MM" to minutes
export function timeToMinutes(s: string): number | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return +m[1] * 60 + +m[2];
}

// Hours diff between actioned date+time and review date+time
export function responseDelayHours(r: Review): number | null {
  const rd = parseDate(r.reviewDate);
  const ad = parseDate(r.actionedDate);
  if (!rd || !ad) return null;
  const rt = timeToMinutes(r.reviewTime) ?? 0;
  const at = timeToMinutes(r.firstResponseTime) ?? 0;
  const diff = (ad.getTime() + at * 60_000) - (rd.getTime() + rt * 60_000);
  return diff / (1000 * 60 * 60);
}

export interface Filters {
  from?: Date | null;
  to?: Date | null;
  platforms: string[]; // empty = all
  ratings: number[]; // empty = all
}

export const defaultFilters: Filters = { platforms: [], ratings: [] };

export function applyFilters<T extends { reviewDate?: string; date?: string; platform?: string; rating?: number }>(
  rows: T[],
  f: Filters,
  kind: "review" | "daywise" = "review"
): T[] {
  return rows.filter((r) => {
    const dateStr = (r as any).reviewDate || (r as any).date;
    const d = parseDate(dateStr);
    if (f.from && d && d < f.from) return false;
    if (f.to && d && d > f.to) return false;
    if (f.platforms.length) {
      const p = (r.platform || "").toLowerCase();
      const norm = p === "playstore" ? "playstore" : p === "ios" ? "ios" : p === "google" ? "google" : p;
      const want = f.platforms.map((x) => x.toLowerCase());
      if (!want.includes(norm)) return false;
    }
    if (kind === "review" && f.ratings.length && r.rating != null) {
      if (!f.ratings.includes(r.rating)) return false;
    }
    return true;
  });
}

export function groupCount<T>(rows: T[], key: (r: T) => string): { name: string; value: number }[] {
  const m = new Map<string, number>();
  rows.forEach((r) => {
    const k = (key(r) || "Unspecified").trim() || "Unspecified";
    m.set(k, (m.get(k) || 0) + 1);
  });
  return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
