import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type CategoryKind =
  | "service_category"
  | "product_category"
  | "product_subcategory"
  | "project_sector"
  | "inquiry_type"
  | "contact_method"
  | "news_category"
  | "partner_type"
  | "agent_region"
  | "budget_range"
  | "request_type";

export const CATEGORY_KINDS: { kind: CategoryKind; label: string }[] = [
  { kind: "service_category", label: "تصنيفات الخدمات" },
  { kind: "product_category", label: "تصنيفات المنتجات" },
  { kind: "product_subcategory", label: "تصنيفات فرعية للمنتجات" },
  { kind: "project_sector", label: "قطاعات المشاريع" },
  { kind: "inquiry_type", label: "أنواع الاستفسار" },
  { kind: "contact_method", label: "طرق التواصل المفضّلة" },
  { kind: "news_category", label: "تصنيفات الأخبار" },
  { kind: "partner_type", label: "أنواع الشراكة" },
  { kind: "agent_region", label: "مناطق الوكلاء" },
  { kind: "budget_range", label: "نطاقات الميزانية" },
  { kind: "request_type", label: "أنواع الطلب" },
];

export type CategoryRow = {
  id: string;
  kind: string;
  value: string;
  label_ar: string;
  label_en: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export function categoriesQueryKey(kind?: string) {
  return ["website-categories", kind ?? "all"] as const;
}

export async function fetchCategories(kind?: string) {
  let q = supabase
    .from("website_categories")
    .select("id,kind,value,label_ar,label_en,description,sort_order,is_active")
    .order("kind")
    .order("sort_order");
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as CategoryRow[];
}

/** Active options of one kind — for dropdowns across the app and website. */
export function useCategoryOptions(kind?: string) {
  const { data } = useQuery({
    queryKey: categoriesQueryKey(kind),
    queryFn: () => fetchCategories(kind),
    staleTime: 5 * 60_000,
    enabled: !!kind,
  });
  return (data ?? []).filter((c) => c.is_active);
}
