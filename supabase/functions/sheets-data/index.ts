import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SHEET_ID = "1lqSFO6I8jsKR6lDv-GfFB-ePEbPucNQVUaZM6iH-RNE";
const GW = "https://connector-gateway.lovable.dev/google_sheets/v4";

const REVIEW_TABS: Record<string, string> = {
  playstore: "Master data",
  ios: "IOS",
  google: "Google Business Review",
};
const DAYWISE_TAB = "Day Wise Dashboard | ORM";

async function fetchRange(range: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GOOGLE_SHEETS_API_KEY = Deno.env.get("GOOGLE_SHEETS_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
  if (!GOOGLE_SHEETS_API_KEY) throw new Error("GOOGLE_SHEETS_API_KEY missing");
  const url = `${GW}/spreadsheets/${SHEET_ID}/values:batchGet?${new URLSearchParams({ ranges: range })}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_SHEETS_API_KEY,
    },
  });
  if (!res.ok) throw new Error(`Sheets ${range} ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.valueRanges?.[0]?.values ?? [];
}

function rowsToObjects(values: string[][]) {
  if (!values || values.length === 0) return [];
  const headers = values[0].map((h) => (h ?? "").toString().trim());
  return values.slice(1).map((row) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => {
      if (!h) return;
      o[h] = (row[i] ?? "").toString().trim();
    });
    return o;
  });
}

function normalizeReview(r: Record<string, string>, platform: string) {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = r[k] ?? r[k.trim()] ?? r[k + " "];
      if (v != null && v !== "") return v;
    }
    return "";
  };
  const ratingRaw = get("Rating Given", "Rating");
  const rating = parseInt(ratingRaw) || 0;
  return {
    platform,
    year: get("Year"),
    month: get("Month"),
    channel: get("Channel"),
    reviewDate: get("Review Date"),
    reviewTime: get("Review Time"),
    mobile: get("Mobile Number", "Mobile Number "),
    customer: get("Customer Name"),
    identified: get("Customer Identified"),
    actionedDate: get("Actioned Date"),
    firstResponseTime: get("First Response Time"),
    rating,
    url: get("URL Link"),
    comments: get("User Comments"),
    clmCategory: get("CLM Categoery", "CLM Category"),
    status: get("Status"),
    errorType: get("Error Type"),
    finalStatus: get("Final Status"),
    conversion: get("Conversion(Yes/No)"),
    updatedLink: get("Updated Review Link"),
    ownership: get("Ownership", "Ownership "),
    remarks: get("Remarks"),
    attempt: get("Attempt"),
    reason: get("Reason"),
    summary: get("Summery", "Summary"),
    finalComment: get("Final Comment"),
    internalTeam: get("Internal Team Updated"),
    service: get("Service"),
    issue: get("Issue", "Issue "),
    subIssue: get("Sub- issue", "Sub- issue ", "Sub-issue"),
    orderId: get("Order ID"),
  };
}

function parseDaywise(values: string[][]) {
  // Row 0: platform headers across blocks of 7 cols (6 fields + 1 spacer)
  // Row 1: column names
  // Data starts row 2
  const platforms = ["playstore", "ios", "google"];
  const out: any[] = [];
  for (let i = 2; i < values.length; i++) {
    const row = values[i] ?? [];
    platforms.forEach((p, idx) => {
      const base = idx * 7;
      const date = row[base];
      if (!date) return;
      const total = parseInt(row[base + 1]) || 0;
      const positive = parseInt(row[base + 2]) || 0;
      const negative = parseInt(row[base + 3]) || 0;
      const converted = parseInt(row[base + 4]) || 0;
      const eod = row[base + 5] || "";
      if (total === 0 && positive === 0 && negative === 0 && !eod) return;
      out.push({ platform: p, date, total, positive, negative, converted, eod });
    });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const tabs = [DAYWISE_TAB, REVIEW_TABS.playstore, REVIEW_TABS.ios, REVIEW_TABS.google];
    const [daywiseRaw, ps, ios, goog] = await Promise.all(
      tabs.map((t) => fetchRange(`'${t}'!A1:AZ5000`))
    );
    const reviews = [
      ...rowsToObjects(ps).map((r) => normalizeReview(r, "Playstore")),
      ...rowsToObjects(ios).map((r) => normalizeReview(r, "iOS")),
      ...rowsToObjects(goog).map((r) => normalizeReview(r, "Google")),
    ].filter((r) => r.customer || r.comments || r.rating);
    const daywise = parseDaywise(daywiseRaw);
    return new Response(
      JSON.stringify({ reviews, daywise, fetchedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
