/**
 * Adapter between the current KemetRise content tables (managed from the
 * internal "الموقع العام" screen) and the shapes the ported website pages use.
 * When a section has no published rows, the adapter returns an empty array and
 * the page keeps rendering its original built-in content.
 */
import { getSiteContent, type SiteContent } from "@/lib/site.functions";

let cache: Promise<SiteContent> | null = null;

export function loadContent(): Promise<SiteContent> {
  if (!cache) cache = getSiteContent().catch(() => null as unknown as SiteContent);
  return cache;
}

const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

export async function legacyServices() {
  const c = await loadContent();
  return (c?.services ?? []).map((s, i) => ({
    id: s.id,
    name_ar: s.name,
    name_en: s.name_en || s.name,
    desc_ar: s.description ?? "",
    desc_en: s.description ?? "",
    category: s.category ?? "other",
    color: "#D4A017",
    icon_name: s.icon ?? "Layers",
    features_ar: arr(s.features),
    features_en: arr(s.features),
    is_active: true,
    sort_order: s.sort_order ?? i,
  }));
}

export async function legacyProducts() {
  const c = await loadContent();
  return (c?.products ?? []).map((p) => ({
    id: p.id,
    type: (p.product_type === "service" ? "service" : "product") as "service" | "product",
    category: p.category ?? "General",
    category_ar: p.category ?? "عام",
    sub_category: p.subcategory ?? undefined,
    sub_category_ar: p.subcategory ?? undefined,
    name: p.name_en || p.name,
    name_ar: p.name,
    description: p.description ?? "",
    description_ar: p.description ?? "",
    price_cents: p.price != null ? Math.round(Number(p.price) * 100) : undefined,
    compare_price_cents:
      p.compare_price != null ? Math.round(Number(p.compare_price) * 100) : undefined,
    pricing_model: p.pricing_model,
    icon: "📦",
    color: "#D4A017",
    rating: Number(p.rating ?? 4.8),
    reviews_count: Number(p.reviews_count ?? 0),
    is_featured: p.is_featured,
    is_new: p.is_new,
    features: arr(p.features),
    features_ar: arr(p.features),
  }));
}

export async function legacyProjects() {
  const c = await loadContent();
  return (c?.projects ?? []).map((p, i) => ({
    id: p.id,
    title: p.title,
    title_en: p.title,
    brand_name: p.client_name ?? "KemetRise",
    sector: p.sector,
    sector_ar: p.sector ?? undefined,
    sector_en: p.sector ?? undefined,
    execution_type: p.execution_type,
    description: p.description ?? "",
    description_en: p.description ?? "",
    image_url: p.cover_url,
    project_order: p.sort_order ?? i,
    is_active: true,
  }));
}

export async function legacyPartners() {
  const c = await loadContent();
  return (c?.partners ?? []).map((p, i) => ({
    id: p.id,
    name: p.name,
    name_en: p.name,
    category: p.category ?? "Other",
    category_ar: p.category ?? "أخرى",
    description: p.description ?? "",
    description_ar: p.description ?? "",
    logo_url: p.logo_url,
    website_url: p.website_url,
    partner_type: p.partner_type,
    sort_order: p.sort_order ?? i,
  }));
}

export async function legacyAgents() {
  const c = await loadContent();
  return (c?.agents ?? []).map((a, i) => ({
    id: a.id,
    name: a.name,
    name_en: a.name,
    region: a.region ?? "mena",
    country: a.country ?? "",
    country_en: a.country ?? "",
    coverage_scope: a.coverage ?? a.bio ?? null,
    coverage_scope_en: a.coverage ?? a.bio ?? null,
    contact_email: a.email,
    project_order: a.sort_order ?? i,
    is_active: true,
  }));
}

export async function legacyTeam() {
  const c = await loadContent();
  return (c?.team ?? []).map((m) => ({
    name_en: m.name,
    name_ar: m.name,
    role_en: m.title ?? "",
    role_ar: m.title ?? "",
    avatar: (m.name ?? "KR").slice(0, 2).toUpperCase(),
    color_key: "primary",
  }));
}

export async function legacyNews() {
  const c = await loadContent();
  return c?.news ?? [];
}

export async function legacySettings() {
  const c = await loadContent();
  return c?.settings ?? null;
}
