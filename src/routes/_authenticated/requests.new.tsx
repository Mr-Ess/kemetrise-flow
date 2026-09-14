import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { logActivity, notify } from "@/lib/actions";
import { PRIORITY } from "@/lib/constants";
import { ErrorState, InlineLoading, PageHeader, SectionCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type Priority = Database["public"]["Enums"]["priority_level"];

export const Route = createFileRoute("/_authenticated/requests/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    customer: typeof search.customer === "string" ? search.customer : undefined,
  }),
  head: () => ({
    meta: [
      { title: "طلب بيع جديد | KemetRise" },
      { name: "description", content: "إنشاء طلب بيع جديد وربطه بالعميل والمنتج والمواصفات." },
      { property: "og:title", content: "طلب بيع جديد | KemetRise" },
      { property: "og:description", content: "تسجيل طلب بيع جديد في نظام KemetRise." },
    ],
  }),
  component: NewRequestPage,
});

function NewRequestPage() {
  const { customer } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    customer_id: customer ?? "",
    product_service_id: "",
    title: "",
    description: "",
    quantity: "1",
    unit: "قطعة",
    material: "",
    color: "",
    dimensions: "",
    finish: "",
    required_delivery_date: "",
    estimated_value: "",
    priority: "normal" as Priority,
    customer_notes: "",
    internal_notes: "",
  });

  const { data: lists, isLoading, error, refetch } = useQuery({
    queryKey: ["request-form-lists"],
    queryFn: async () => {
      const [customers, products] = await Promise.all([
        supabase
          .from("customers")
          .select("id, code, full_name, phone")
          .eq("is_archived", false)
          .order("full_name"),
        supabase
          .from("products_services")
          .select("id, name, unit, reference_price, typical_delivery_days")
          .eq("is_active", true)
          .order("name"),
      ]);
      if (customers.error) throw customers.error;
      return { customers: customers.data ?? [], products: products.data ?? [] };
    },
  });

  const submit = useMutation({
    mutationFn: async (asDraft: boolean) => {
      if (!form.customer_id) throw new Error("اختر العميل");
      if (!form.title.trim()) throw new Error("أدخل عنوان الطلب");
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("sales_requests")
        .insert({
          customer_id: form.customer_id,
          product_service_id: form.product_service_id || null,
          title: form.title.trim(),
          description: form.description.trim() || null,
          quantity: Number(form.quantity) || 1,
          unit: form.unit || "قطعة",
          material: form.material.trim() || null,
          color: form.color.trim() || null,
          dimensions: form.dimensions.trim() || null,
          finish: form.finish.trim() || null,
          required_delivery_date: form.required_delivery_date || null,
          estimated_value: Number(form.estimated_value) || 0,
          priority: form.priority,
          customer_notes: form.customer_notes.trim() || null,
          internal_notes: form.internal_notes.trim() || null,
          status: asDraft ? "draft" : "submitted",
          submitted_at: asDraft ? null : new Date().toISOString(),
          created_by: auth.user?.id ?? null,
          salesperson_id: auth.user?.id ?? null,
        })
        .select("id, code, title")
        .single();
      if (error) throw error;

      await logActivity({
        entityType: "sales_request",
        entityId: data.id,
        entityCode: data.code,
        action: asDraft ? "draft_created" : "submitted",
        description: asDraft ? "تم حفظ الطلب كمسودة" : "تم إرسال الطلب للمراجعة",
      });
      if (!asDraft) {
        await notify({
          title: "طلب بيع جديد بانتظار المراجعة",
          body: `${data.code} — ${data.title}`,
          link: `/requests/${data.id}`,
          targetRole: "management",
        });
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success("تم حفظ الطلب");
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate({ to: "/requests/$id", params: { id: data.id } });
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  return (
    <>
      <PageHeader title="طلب بيع جديد" subtitle="سجّل تفاصيل الطلب ليتم تسعيره واعتماده" />

      {isLoading ? <InlineLoading /> : null}

      {lists ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard title="بيانات أساسية" className="lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>العميل *</Label>
                <Select
                  value={form.customer_id}
                  onValueChange={(v) => setForm({ ...form, customer_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العميل" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {lists.customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name} — {c.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المنتج / الخدمة</Label>
                <Select
                  value={form.product_service_id}
                  onValueChange={(v) => {
                    const p = lists.products.find((x) => x.id === v);
                    setForm({
                      ...form,
                      product_service_id: v,
                      unit: p?.unit ?? form.unit,
                      title: form.title || (p?.name ?? ""),
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنتج" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {lists.products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>عنوان الطلب *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: توريد 12 وحدة إضاءة نحاسية"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>وصف الطلب</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الكمية</Label>
                <Input
                  type="number"
                  min={1}
                  dir="ltr"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الوحدة</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </div>
            </div>
          </SectionCard>

          <div className="space-y-4">
            <SectionCard title="المواصفات">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>الخامة</Label>
                  <Input
                    value={form.material}
                    onChange={(e) => setForm({ ...form, material: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>اللون</Label>
                  <Input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>المقاسات</Label>
                  <Input
                    value={form.dimensions}
                    onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>التشطيب</Label>
                  <Input
                    value={form.finish}
                    onChange={(e) => setForm({ ...form, finish: e.target.value })}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="التوقيت والأولوية">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>تاريخ التسليم المطلوب</Label>
                  <Input
                    type="date"
                    dir="ltr"
                    value={form.required_delivery_date}
                    onChange={(e) => setForm({ ...form, required_delivery_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الأولوية</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setForm({ ...form, priority: v as Priority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>القيمة التقديرية (ج.م)</Label>
                  <Input
                    type="number"
                    min={0}
                    dir="ltr"
                    value={form.estimated_value}
                    onChange={(e) => setForm({ ...form, estimated_value: e.target.value })}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="ملاحظات" className="lg:col-span-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>ملاحظات العميل</Label>
                <Textarea
                  rows={3}
                  value={form.customer_notes}
                  onChange={(e) => setForm({ ...form, customer_notes: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ملاحظات داخلية</Label>
                <Textarea
                  rows={3}
                  value={form.internal_notes}
                  onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => submit.mutate(false)} disabled={submit.isPending}>
                إرسال الطلب للمراجعة
              </Button>
              <Button
                variant="outline"
                onClick={() => submit.mutate(true)}
                disabled={submit.isPending}
              >
                حفظ كمسودة
              </Button>
            </div>
          </SectionCard>
        </div>
      ) : null}
    </>
  );
}
