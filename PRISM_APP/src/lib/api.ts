import { getAuthToken } from "./auth-storage";

function getApiBase(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.length > 0) return envUrl;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:5000";
}

const API_BASE = getApiBase();

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  email_verified: boolean;
  theme: string;
}

export interface System {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  industry: string;
  target_size: string;
  deployment_type: string;
  pricing_tier: string;
  starting_price: string;
  has_api: boolean;
  has_mobile_app: boolean;
  has_ai_features: boolean;
  has_offline_mode: boolean;
  trial_available: boolean;
  enterprise_pricing: boolean;
  verified: boolean;
  rating: number;
  review_count: number;
  logo_url: string | null;
  website_url: string | null;
  security_certifications: string[];
  category_name: string;
  category_slug: string;
  vendor_name: string;
  vendor_logo: string | null;
}

export interface SystemMedia {
  id: string;
  media_type: "image" | "video" | "screenshot";
  url: string;
  caption: string | null;
  sort_order: number;
}

export interface SystemDetail extends System {
  vendor_website: string | null;
  vendor_verified: string;
  demo_url?: string | null;
}

export interface SystemDetailResponse {
  system: SystemDetail;
  features: SystemFeature[];
  integrations: SystemIntegration[];
  plans: PricingPlan[];
  reviews: Review[];
  media: SystemMedia[];
}

export interface SystemFeature {
  feature_name: string;
  feature_value: boolean;
  feature_detail: string | null;
  category: string;
}

export interface SystemIntegration {
  integration_name: string;
  integration_type: string;
  api_available: boolean;
}

export interface PricingPlan {
  name: string;
  price: string;
  billing_cycle: string;
  is_popular: boolean;
  features: string[];
  max_seats: number | null;
}

export interface Review {
  rating: number;
  title: string;
  pros: string;
  cons: string;
  review_text: string;
  is_verified_customer: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  system_count: number;
}

export interface Thread {
  id: string;
  subject: string;
  last_message: string | null;
  unread_count: number;
  system_name?: string;
  vendor_name?: string;
  updated_at: string;
}

export interface Message {
  id: string;
  body: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
}

export interface WatchlistItem extends System {
  watchlist_id: string;
  saved_at: string;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {},
): Promise<T> {
  const url = new URL(path, API_BASE);
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  }

  const token = await getAuthToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body) headers["Content-Type"] = "application/json";

  const res = await fetch(url.toString(), { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-client": "mobile" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      return data as { user: AuthUser; token: string };
    },
    signup: (body: { email: string; password: string; name?: string }) =>
      apiFetch<{ success: boolean; error?: string; message?: string }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    me: () => apiFetch<{ user: AuthUser | null }>("/api/auth/me"),
    logout: () => apiFetch<{ success: boolean }>("/api/auth/logout", { method: "POST" }),
  },

  systems: {
    list: (params?: Record<string, string>) =>
      apiFetch<{ systems: System[]; count: number }>("/api/systems", { params }),

    get: (slug: string) => apiFetch<SystemDetailResponse>(`/api/systems/${slug}`),

    byIds: (ids: string[]) =>
      apiFetch<{ systems: System[] }>("/api/systems", {
        params: { ids: ids.join(","), limit: String(Math.max(ids.length, 2)) },
      }),
  },

  compare: {
    load: async (ids: string[]) => {
      const { systems } = await api.systems.byIds(ids);
      const ordered = ids
        .map((id) => systems.find((s) => s.id === id))
        .filter((s): s is System => !!s);
      const details = await Promise.all(ordered.map((s) => api.systems.get(s.slug)));
      return details;
    },
  },

  categories: {
    list: () => apiFetch<{ categories: Category[] }>("/api/categories"),
  },

  search: {
    query: (q: string) =>
      apiFetch<{ results: System[]; query: string }>("/api/search", { params: { q } }),
  },

  watchlist: {
    list: () => apiFetch<{ items: WatchlistItem[] }>("/api/watchlist"),
    add: (system_id: string) =>
      apiFetch("/api/watchlist", { method: "POST", body: JSON.stringify({ system_id }) }),
    remove: (systemId: string) => apiFetch(`/api/watchlist/${systemId}`, { method: "DELETE" }),
  },

  threads: {
    list: () => apiFetch<{ threads: Thread[] }>("/api/threads"),
    get: (id: string) => apiFetch<{ thread: Thread; messages: Message[] }>(`/api/threads/${id}`),
    create: (body: { system_id?: string; vendor_id?: string; subject: string; message?: string }) =>
      apiFetch("/api/threads", { method: "POST", body: JSON.stringify(body) }),
    sendMessage: (threadId: string, body: string) =>
      apiFetch<{ message: Message }>(`/api/threads/${threadId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
  },

  recommendations: {
    submit: (answers: Record<string, unknown>) =>
      apiFetch<{ categories: string[]; systems: System[] }>("/api/recommendations", {
        method: "POST",
        body: JSON.stringify(answers),
      }),
  },

  theme: {
    get: () => apiFetch<{ theme: string }>("/api/user/theme"),
    set: (theme: string) =>
      apiFetch("/api/user/theme", { method: "PATCH", body: JSON.stringify({ theme }) }),
  },

  notifications: {
    list: () => apiFetch<{ notifications: unknown[]; unread: number }>("/api/notifications"),
  },

  pushTokens: {
    register: (token: string, platform: "ios" | "android" | "web") =>
      apiFetch("/api/push-tokens", {
        method: "POST",
        body: JSON.stringify({ token, platform }),
      }),
  },
};
