function getApiBase(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.length > 0) return envUrl;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:5000";
}

const API_BASE = getApiBase();

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

export interface SystemDetail extends System {
  vendor_website: string | null;
  vendor_verified: string;
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

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, API_BASE);
  if (params) {
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  systems: {
    list: (params?: {
      category?: string;
      q?: string;
      verified?: string;
      limit?: string;
      offset?: string;
    }) =>
      apiFetch<{ systems: System[]; count: number; offset: number; limit: number }>(
        "/api/systems",
        params as Record<string, string>
      ),

    get: (slug: string) =>
      apiFetch<{
        system: SystemDetail;
        features: SystemFeature[];
        integrations: SystemIntegration[];
        plans: PricingPlan[];
        reviews: Review[];
      }>(`/api/systems/${slug}`),
  },

  categories: {
    list: () => apiFetch<{ categories: Category[] }>("/api/categories"),
  },

  search: {
    query: (q: string) =>
      apiFetch<{ results: System[]; query: string }>("/api/search", { q }),
  },
};
