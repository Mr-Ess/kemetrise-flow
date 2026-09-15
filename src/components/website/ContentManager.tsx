import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, LoadingState } from "@/components/ui-kit";

type FieldType = "text" | "textarea" | "number" | "bool" | "list" | "date" | "select";
type Field = {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  /** For type "select": pulls its options from the shared categories list. */
  kind?: string;
};

export type TableSpec = {
  table: string;
  label: string;
  titleKey: string;
  subtitleKey?: string;
  fields: Field[];
  singleton?: boolean;
  orderBy?: string;
};

export const WEBSITE_TABLES: TableSpec[] = [
  {
    table: "website_settings",
    label: "إعدادات الموقع",
    titleKey: "site_name",
    singleton: true,
    fields: [
      { key: "site_name", label: "اسم الموقع", required: true },
      { key: "tagline", label: "الجملة التعريفية" },
      { key: "email", label: "البريد" },
      { key: "phone", label: "الهاتف" },
      { key: "whatsapp", label: "واتساب" },
      { key: "address", label: "العنوان" },
      { key: "seo_title", label: "عنوان SEO" },
      { key: "seo_description", label: "وصف SEO", type: "textarea" },
      { key: "footer_text", label: "نص التذييل" },
      { key: "logo_url", label: "رابط الشعار" },
      { key: "default_locale", label: "اللغة الافتراضية (ar / en)" },
    ],
  },
  {
    table: "website_hero",
    label: "الواجهة الرئيسية",
    titleKey: "title",
    singleton: true,
    fields: [
      { key: "badge", label: "الشارة" },
      { key: "title", label: "العنوان", required: true },
      { key: "subtitle", label: "الوصف", type: "textarea" },
      { key: "primary_cta_label", label: "زر رئيسي" },
      { key: "primary_cta_href", label: "رابط الزر الرئيسي" },
      { key: "secondary_cta_label", label: "زر ثانوي" },
      { key: "secondary_cta_href", label: "رابط الزر الثانوي" },
      { key: "media_url", label: "رابط الصورة/الفيديو" },
      { key: "is_active", label: "مفعّل", type: "bool" },
    ],
  },
  {
    table: "website_stats",
    label: "الأرقام",
    titleKey: "label",
    subtitleKey: "value",
    fields: [
      { key: "label", label: "الوصف", required: true },
      { key: "value", label: "القيمة", required: true },
      { key: "sort_order", label: "الترتيب", type: "number" },
      { key: "is_published", label: "منشور", type: "bool" },
    ],
  },
  {
    table: "website_features",
    label: "المزايا",
    titleKey: "title",
    fields: [
      { key: "title", label: "العنوان", required: true },
      { key: "description", label: "الوصف", type: "textarea" },
      { key: "sort_order", label: "الترتيب", type: "number" },
      { key: "is_published", label: "منشور", type: "bool" },
    ],
  },
  {
    table: "website_how_it_works",
    label: "كيف نعمل",
    titleKey: "title",
    fields: [
      { key: "step_no", label: "رقم الخطوة", type: "number" },
      { key: "title", label: "العنوان", required: true },
      { key: "description", label: "الوصف", type: "textarea" },
      { key: "sort_order", label: "الترتيب", type: "number" },
      { key: "is_published", label: "منشور", type: "bool" },
    ],
  },
  {
    table: "website_services",
    label: "الخدمات",
    titleKey: "name",
    subtitleKey: "category",
    fields: [
      { key: "slug", label: "الرابط (slug)", required: true },
      { key: "name", label: "الاسم", required: true },
      { key: "category", label: "التصنيف", type: "select", kind: "service_category" },
      { key: "description", label: "الوصف", type: "textarea" },
      { key: "features", label: "المزايا (سطر لكل ميزة)", type: "list" },
      { key: "is_featured", label: "مميّز", type: "bool" },
      { key: "is_published", label: "منشور", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  {
    table: "website_products",
    label: "المنتجات",
    titleKey: "name",
    subtitleKey: "category",
    fields: [
      { key: "slug", label: "الرابط (slug)", required: true },
      { key: "name", label: "الاسم", required: true },
      { key: "category", label: "التصنيف", type: "select", kind: "product_category" },
      { key: "subcategory", label: "التصنيف الفرعي", type: "select", kind: "product_subcategory" },
      { key: "description", label: "الوصف", type: "textarea" },
      { key: "price", label: "السعر", type: "number" },
      { key: "features", label: "المزايا (سطر لكل ميزة)", type: "list" },
      { key: "is_new", label: "جديد", type: "bool" },
      { key: "is_featured", label: "مميّز", type: "bool" },
      { key: "is_published", label: "منشور", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  {
    table: "website_projects",
    label: "المشاريع",
    titleKey: "title",
    subtitleKey: "client_name",
    fields: [
      { key: "slug", label: "الرابط (slug)", required: true },
      { key: "title", label: "العنوان", required: true },
      { key: "client_name", label: "العميل" },
      { key: "sector", label: "القطاع", type: "select", kind: "project_sector" },
      { key: "status", label: "الحالة (completed / in_progress / planned)" },
      { key: "description", label: "الوصف", type: "textarea" },
      { key: "is_published", label: "منشور", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  {
    table: "website_portfolio",
    label: "الأعمال السابقة",
    titleKey: "title",
    subtitleKey: "category",
    fields: [
      { key: "slug", label: "الرابط (slug)", required: true },
      { key: "title", label: "العنوان", required: true },
      { key: "category", label: "التصنيف", type: "select", kind: "project_sector" },
      { key: "description", label: "الوصف", type: "textarea" },
      { key: "results", label: "النتائج" },
      { key: "is_published", label: "منشور", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  {
    table: "website_partners",
    label: "الشركاء",
    titleKey: "name",
    subtitleKey: "partner_type",
    fields: [
      { key: "name", label: "الاسم", required: true },
      { key: "partner_type", label: "نوع الشراكة", type: "select", kind: "partner_type" },
      { key: "category", label: "التصنيف", type: "select", kind: "partner_type" },
      { key: "description", label: "الوصف", type: "textarea" },
      { key: "website_url", label: "الموقع" },
      { key: "is_published", label: "منشور", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  {
    table: "website_agents",
    label: "الوكلاء",
    titleKey: "name",
    subtitleKey: "region",
    fields: [
      { key: "name", label: "الاسم", required: true },
      { key: "region", label: "المنطقة", type: "select", kind: "agent_region" },
      { key: "country", label: "الدولة" },
      { key: "coverage", label: "نطاق التغطية" },
      { key: "bio", label: "نبذة", type: "textarea" },
      { key: "email", label: "البريد" },
      { key: "phone", label: "الهاتف" },
      { key: "is_published", label: "منشور", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  {
    table: "website_leadership_team",
    label: "فريق القيادة",
    titleKey: "name",
    subtitleKey: "title",
    fields: [
      { key: "name", label: "الاسم", required: true },
      { key: "title", label: "المسمى" },
      { key: "bio", label: "نبذة", type: "textarea" },
      { key: "linkedin_url", label: "لينكدإن" },
      { key: "is_published", label: "منشور", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  {
    table: "website_news",
    label: "الأخبار",
    titleKey: "title",
    subtitleKey: "category",
    orderBy: "created_at",
    fields: [
      { key: "slug", label: "الرابط (slug)", required: true },
      { key: "title", label: "العنوان", required: true },
      { key: "category", label: "التصنيف", type: "select", kind: "news_category" },
      { key: "author", label: "الكاتب" },
      { key: "excerpt", label: "المقتطف", type: "textarea" },
      { key: "content", label: "المحتوى", type: "textarea" },
      { key: "is_published", label: "منشور", type: "bool" },
      { key: "published_at", label: "تاريخ النشر", type: "date" },
    ],
  },
  {
    table: "website_testimonials",
    label: "آراء العملاء",
    titleKey: "author_name",
    subtitleKey: "company",
    fields: [
      { key: "author_name", label: "الاسم", required: true },
      { key: "author_title", label: "المسمى" },
      { key: "company", label: "الشركة" },
      { key: "quote", label: "الرأي", type: "textarea", required: true },
      { key: "rating", label: "التقييم", type: "number" },
      { key: "is_published", label: "منشور", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  {
    table: "website_faqs",
    label: "الأسئلة الشائعة",
    titleKey: "question",
    fields: [
      { key: "question", label: "السؤال", required: true },
      { key: "answer", label: "الإجابة", type: "textarea", required: true },
      { key: "category", label: "التصنيف" },
      { key: "is_published", label: "منشور", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  {
    table: "website_plans",
    label: "الباقات",
    titleKey: "name",
    fields: [
      { key: "name", label: "الاسم", required: true },
      { key: "description", label: "الوصف", type: "textarea" },
      { key: "price", label: "السعر", type: "number" },
      { key: "billing_period", label: "الدورة (monthly / yearly / custom)" },
      { key: "features", label: "المزايا (سطر لكل ميزة)", type: "list" },
      { key: "cta_label", label: "نص الزر" },
      { key: "is_featured", label: "مميّزة", type: "bool" },
      { key: "is_published", label: "منشورة", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  {
    table: "website_about",
    label: "من نحن",
    titleKey: "title",
    subtitleKey: "section_key",
    fields: [
      { key: "section_key", label: "المفتاح", required: true },
      { key: "title", label: "العنوان", required: true },
      { key: "body", label: "النص", type: "textarea" },
      { key: "is_published", label: "منشور", type: "bool" },
      { key: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
];

type Row = Record<string, unknown>;

function emptyRow(spec: TableSpec): Row {
  const r: Row = {};
  for (const f of spec.fields) {
    r[f.key] =
      f.type === "bool" ? true : f.type === "number" ? 0 : f.type === "list" ? [] : "";
  }
  return r;
}

export function ContentManager() {
  const [tableName, setTableName] = useState(WEBSITE_TABLES[0]!.table);
  const spec = WEBSITE_TABLES.find((t) => t.table === tableName)!;
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["website-cms", spec.table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(spec.table as "website_services")
        .select("*")
        .order(spec.orderBy ?? (spec.singleton ? "created_at" : "sort_order"), {
          ascending: spec.orderBy ? false : !spec.singleton,
        });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const save = useMutation({
    mutationFn: async (row: Row) => {
      const payload: Row = {};
      for (const f of spec.fields) {
        let v = row[f.key];
        if (f.type === "number") v = v === "" || v === null ? null : Number(v);
        if (f.type === "date") v = v ? new Date(String(v)).toISOString() : null;
        if (f.type === "list" && typeof v === "string")
          v = String(v)
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        payload[f.key] = v;
      }
      const table = supabase.from(spec.table as "website_services");
      const res = row['id']
        ? await table.update(payload as never).eq("id", String(row['id']))
        : await table.insert(payload as never);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("تم الحفظ");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["website-cms", spec.table] });
      queryClient.invalidateQueries({ queryKey: ["site-content"] });
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(spec.table as "website_services")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      queryClient.invalidateQueries({ queryKey: ["website-cms", spec.table] });
      queryClient.invalidateQueries({ queryKey: ["site-content"] });
    },
    onError: (e: Error) => toast.error("تعذّر الحذف", { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={tableName}
          onValueChange={(v) => {
            setTableName(v);
            setEditing(null);
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEBSITE_TABLES.map((t) => (
              <SelectItem key={t.table} value={t.table}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!spec.singleton ? (
          <Button size="sm" onClick={() => setEditing(emptyRow(spec))}>
            <Plus className="size-4" />
            إضافة
          </Button>
        ) : null}
      </div>

      {isLoading ? <LoadingState rows={3} /> : null}

      {!isLoading && (data ?? []).length === 0 ? (
        <EmptyState title="لا توجد عناصر" description="أضف أول عنصر لهذا القسم." />
      ) : null}

      <ul className="divide-y divide-border rounded-xl border border-border">
        {(data ?? []).map((row) => (
          <li key={String(row['id'])} className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{String(row[spec.titleKey] ?? "")}</p>
              {spec.subtitleKey ? (
                <p className="truncate text-xs text-muted-foreground">
                  {String(row[spec.subtitleKey] ?? "")}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button size="icon" variant="ghost" onClick={() => setEditing(row)} aria-label="تعديل">
                <Pencil className="size-4" />
              </Button>
              {!spec.singleton ? (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="حذف"
                  onClick={() => remove.mutate(String(row['id']))}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{spec.label}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(editing);
              }}
            >
              {spec.fields.map((f) => {
                const value = editing[f.key];
                const set = (v: unknown) => setEditing({ ...editing, [f.key]: v });
                if (f.type === "bool")
                  return (
                    <div key={f.key} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                      <Label>{f.label}</Label>
                      <Switch checked={!!value} onCheckedChange={set} />
                    </div>
                  );
                if (f.type === "textarea")
                  return (
                    <div key={f.key} className="sm:col-span-2">
                      <Label>{f.label}</Label>
                      <Textarea
                        rows={4}
                        value={String(value ?? "")}
                        onChange={(e) => set(e.target.value)}
                        required={f.required}
                      />
                    </div>
                  );
                if (f.type === "list")
                  return (
                    <div key={f.key} className="sm:col-span-2">
                      <Label>{f.label}</Label>
                      <Textarea
                        rows={4}
                        value={Array.isArray(value) ? (value as string[]).join("\n") : String(value ?? "")}
                        onChange={(e) => set(e.target.value)}
                      />
                    </div>
                  );
                if (f.type === "select")
                  return (
                    <CategoryField
                      key={f.key}
                      label={f.label}
                      kind={f.kind!}
                      value={String(value ?? "")}
                      onChange={set}
                    />
                  );
                return (
                  <div key={f.key}>
                    <Label>{f.label}</Label>
                    <Input
                      type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                      className={f.type === "number" ? "num" : undefined}
                      value={
                        f.type === "date" && value
                          ? String(value).slice(0, 10)
                          : String(value ?? "")
                      }
                      onChange={(e) => set(e.target.value)}
                      required={f.required}
                    />
                  </div>
                );
              })}
              <div className="sm:col-span-2">
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? "جارٍ الحفظ..." : "حفظ"}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
