export interface Review {
  platform: "Playstore" | "iOS" | "Google" | string;
  year: string;
  month: string;
  channel: string;
  reviewDate: string;
  reviewTime: string;
  mobile: string;
  customer: string;
  identified: string;
  actionedDate: string;
  firstResponseTime: string;
  rating: number;
  url: string;
  comments: string;
  clmCategory: string;
  status: string;
  errorType: string;
  finalStatus: string;
  conversion: string;
  updatedLink: string;
  ownership: string;
  remarks: string;
  attempt: string;
  reason: string;
  summary: string;
  finalComment: string;
  internalTeam: string;
  service: string;
  issue: string;
  subIssue: string;
  orderId: string;
}

export interface DayWise {
  platform: "playstore" | "ios" | "google";
  date: string;
  total: number;
  positive: number;
  negative: number;
  converted: number;
  eod: string;
}

export interface SheetsPayload {
  reviews: Review[];
  daywise: DayWise[];
  fetchedAt: string;
}
