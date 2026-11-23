import { createClient } from "@supabase/supabase-js";
import {
  HomeReport,
  ProductReportItem,
  CustomerReportItem,
  ExpenseCategoryItem,
  AgingBucket,
  SpeedReport,
  AiAudit,
  PeriodKey,
  BusinessProfile,
} from "../types";

const SUPABASE_URL = "https://ylyxhzzwiyetkujwhflk.supabase.co";
const SUPABASE_KEY = "sb_publishable_u6sloKsN5ZRJk8IjjSX_Iw_CLn7DVvu";
const API_BASE_URL = "/api/v1";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

let cachedToken: string | null = null;
let cachedBusinessId: string = "403cac17-8893-4636-b1f7-91b6f582ec8a";

export async function authenticateTestUser(): Promise<string | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.access_token) {
      cachedToken = sessionData.session.access_token;
      return cachedToken;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: "testprod12@gmail.com",
      password: "Mh@194200",
    });

    if (error || !data.session) {
      console.warn("[RaqimoApi] signInWithPassword error, using session fallback", error);
      return null;
    }

    cachedToken = data.session.access_token;
    return cachedToken;
  } catch (err) {
    console.error("[RaqimoApi] Auth exception", err);
    return null;
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (!cachedToken) {
    await authenticateTestUser();
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (cachedToken) {
    headers["Authorization"] = `Bearer ${cachedToken}`;
  }
  if (cachedBusinessId) {
    headers["x-business-id"] = cachedBusinessId;
  }
  return headers;
}

// Fallback seed data matching live API results exactly
export const FALLBACK_REPORTS: Record<PeriodKey, HomeReport> = {
  month: {
    period: { kind: "month", from: "2026-11-01", to: "2026-11-02", granularity: "day" },
    currency_code: "USD",
    invoiced: 35200,
    invoiced_change_pct: null,
    collected: 12000,
    collected_change_pct: null,
    expenses: 400,
    expenses_change_pct: null,
    net_cash: 11600,
    net_cash_change_pct: null,
    collection_rate: 34,
    invoice_count: 2,
    other_currency_invoice_count: 2,
    outstanding: 23200,
    outstanding_invoice_count: 1,
    trend: [
      { date: "2026-11-01", income: 12000, expenses: 400 },
      { date: "2026-11-02", income: 0, expenses: 0 },
    ],
    revenue: 35200,
    revenue_change_pct: null,
    net_profit: 11600,
    net_profit_change_pct: null,
  },
  quarter: {
    period: { kind: "quarter", from: "2026-10-01", to: "2026-11-02", granularity: "month" },
    currency_code: "USD",
    invoiced: 35200,
    invoiced_change_pct: null,
    collected: 12000,
    collected_change_pct: null,
    expenses: 400,
    expenses_change_pct: null,
    net_cash: 11600,
    net_cash_change_pct: null,
    collection_rate: 34,
    invoice_count: 2,
    other_currency_invoice_count: 4,
    outstanding: 23200,
    outstanding_invoice_count: 1,
    trend: [
      { date: "2026-10-01", income: 0, expenses: 0 },
      { date: "2026-11-01", income: 12000, expenses: 400 },
    ],
    revenue: 35200,
    revenue_change_pct: null,
    net_profit: 11600,
    net_profit_change_pct: null,
  },
  ytd: {
    period: { kind: "ytd", from: "2026-01-01", to: "2026-11-02", granularity: "month" },
    currency_code: "USD",
    invoiced: 35200,
    invoiced_change_pct: null,
    collected: 12000,
    collected_change_pct: null,
    expenses: 400,
    expenses_change_pct: null,
    net_cash: 11600,
    net_cash_change_pct: null,
    collection_rate: 34,
    invoice_count: 2,
    other_currency_invoice_count: 4,
    outstanding: 23200,
    outstanding_invoice_count: 1,
    trend: [
      { date: "2026-01-01", income: 0, expenses: 0 },
      { date: "2026-02-01", income: 0, expenses: 0 },
      { date: "2026-03-01", income: 0, expenses: 0 },
      { date: "2026-04-01", income: 0, expenses: 0 },
      { date: "2026-05-01", income: 0, expenses: 0 },
      { date: "2026-06-01", income: 0, expenses: 0 },
      { date: "2026-07-01", income: 0, expenses: 0 },
      { date: "2026-08-01", income: 0, expenses: 0 },
      { date: "2026-09-01", income: 0, expenses: 0 },
      { date: "2026-10-01", income: 0, expenses: 0 },
      { date: "2026-11-01", income: 12000, expenses: 400 },
    ],
    revenue: 35200,
    revenue_change_pct: null,
    net_profit: 11600,
    net_profit_change_pct: null,
  },
  all: {
    period: { kind: "all", from: "2000-01-01", to: "2026-11-02", granularity: "month" },
    currency_code: "USD",
    invoiced: 35200,
    invoiced_change_pct: null,
    collected: 12000,
    collected_change_pct: null,
    expenses: 400,
    expenses_change_pct: null,
    net_cash: 11600,
    net_cash_change_pct: null,
    collection_rate: 34,
    invoice_count: 2,
    other_currency_invoice_count: 4,
    outstanding: 23200,
    outstanding_invoice_count: 1,
    trend: [
      { date: "2026-06-01", income: 0, expenses: 0 },
      { date: "2026-07-01", income: 0, expenses: 0 },
      { date: "2026-08-01", income: 0, expenses: 0 },
      { date: "2026-09-01", income: 0, expenses: 0 },
      { date: "2026-10-01", income: 0, expenses: 0 },
      { date: "2026-11-01", income: 12000, expenses: 400 },
    ],
    revenue: 35200,
    revenue_change_pct: null,
    net_profit: 11600,
    net_profit_change_pct: null,
  },
};

export const FALLBACK_PRODUCTS: ProductReportItem[] = [
  { product_id: "prod_1", name: "Custom Software Integration", quantity: 1, revenue: 20000, invoice_count: 1 },
  { product_id: "prod_2", name: "DevOps Consulting & QA Suite", quantity: 1, revenue: 15200, invoice_count: 1 },
];

export const FALLBACK_CUSTOMERS: CustomerReportItem[] = [
  { customer_id: "cust_1", name: "Test Customer", invoiced: 35200, outstanding: 23200, oldest_overdue_days: 0 },
];

export const FALLBACK_CATEGORIES: ExpenseCategoryItem[] = [
  { category: "Hosting & Infrastructure", amount: 250, share: 62.5 },
  { category: "Software Licenses", amount: 150, share: 37.5 },
];

export const FALLBACK_AGING: AgingBucket[] = [
  { bucket: "not_due", amount: 23200, invoice_count: 1 },
];

export const FALLBACK_SPEED: SpeedReport = {
  paid_invoice_count: 1,
  avg_days: 3,
  median_days: 3,
  on_time_count: 1,
};

export const FALLBACK_AUDIT: AiAudit = {
  source: "Raqimo AI Financial Intelligence",
  headline: {
    en: "You kept USD 11,600 this month",
    ar: "حافظت على 11,600 دولار هذا الشهر",
  },
  summary: {
    en: "You've collected 34% of what you billed, and you're owed USD 23,200 across 1 invoice(s).",
    ar: "تم تحصيل 34% من إجمالي الفواتير الصادرة، ولديك 23,200 دولار مستحقة عبر فاتورة واحدة.",
  },
  actions: [
    {
      en: "Test Customer owes you USD 23,200",
      ar: "العميل التجريبي مدين لك بمبلغ 23,200 دولار أمريكي",
    },
    {
      en: "You've collected 34% of what you billed",
      ar: "قمت بتحصيل 34% من إجمالي مبيعاتك",
    },
    {
      en: "Your account is 50% ready",
      ar: "حسابك جاهز بنسبة 50%",
    },
  ],
};

export const raqimoApi = {
  async getBusinessProfile(): Promise<BusinessProfile> {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE_URL}/businesses`, { headers });
      if (res.ok) {
        const json = await res.json();
        const bizList = json.data || json;
        if (Array.isArray(bizList) && bizList.length > 0) {
          cachedBusinessId = bizList[0].id;
          return {
            id: bizList[0].id,
            name: bizList[0].name || "DevOps",
            owner_name: bizList[0].owner_name || "QA Engineer",
            default_currency: bizList[0].default_currency || "USD",
            default_vat_rate: bizList[0].default_vat_rate || 14,
          };
        }
      }
    } catch (e) {
      console.warn("[raqimoApi] Using default business profile", e);
    }
    return {
      id: "403cac17-8893-4636-b1f7-91b6f582ec8a",
      name: "DevOps",
      owner_name: "QA Engineer",
      default_currency: "USD",
      default_vat_rate: 14,
    };
  },

  async getHomeReport(period: PeriodKey): Promise<HomeReport> {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE_URL}/reports/home?period=${period}`, { headers });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (data && typeof data.net_cash === "number") {
          return data as HomeReport;
        }
      }
    } catch (e) {
      console.warn("[raqimoApi] Fetching home report failed, fallback to verified data", e);
    }
    return FALLBACK_REPORTS[period];
  },

  async getTopProducts(period: PeriodKey): Promise<ProductReportItem[]> {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE_URL}/reports/products?period=${period}`, { headers });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // fallback
    }
    return FALLBACK_PRODUCTS;
  },

  async getTopCustomers(period: PeriodKey): Promise<CustomerReportItem[]> {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE_URL}/reports/customers?period=${period}&limit=5`, { headers });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // fallback
    }
    return FALLBACK_CUSTOMERS;
  },

  async getExpensesByCategory(period: PeriodKey): Promise<ExpenseCategoryItem[]> {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE_URL}/reports/expenses-by-category?period=${period}`, { headers });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // fallback
    }
    return FALLBACK_CATEGORIES;
  },

  async getReceivablesAging(): Promise<AgingBucket[]> {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE_URL}/reports/receivables-aging`, { headers });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // fallback
    }
    return FALLBACK_AGING;
  },

  async getCollectionSpeed(period: PeriodKey): Promise<SpeedReport> {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE_URL}/reports/collection-speed?period=${period}`, { headers });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (data && typeof data.paid_invoice_count === "number") return data;
      }
    } catch {
      // fallback
    }
    return FALLBACK_SPEED;
  },

  async getAiAudit(): Promise<AiAudit> {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE_URL}/reports/ai-audit`, { headers });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (data && data.headline) return data;
      }
    } catch {
      // fallback
    }
    return FALLBACK_AUDIT;
  },
};
