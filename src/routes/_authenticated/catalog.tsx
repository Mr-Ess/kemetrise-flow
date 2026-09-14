import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { egp } from "@/lib/format";
import { logActivity } from "@/lib/actions";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/catalog")({
  head: () => ({
    meta: [
      { title: "المنتجات والخدمات | KemetRise" },
      { name: "description", content: "كتالوج منتجات وخدمات KemetRise وأسعارها الاسترشادية." },
      { property: "og:title", content: "المنتجات والخدمات | KemetRise" },
      { property: "og:description", content: "إدارة كتالوج المنتجات والخدمات." },
    ],
  }),
  component: CatalogPage,
});

const emptyForm = {
  name: "",
  category: "",
  unit: "قطعة",
  description: "",
  reference_price: "",
  default_cost: "",
  typical_delivery_days: "7",
  is_active: true,
};

function CatalogPage() {
  const { canSeeCosts, isManager } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [q, setQ] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products_services")
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("اسم المنتج أو الخدمة مطلوب");
      const { data, error } = await supabase
        .from("products_services")
        .insert({
          name: form.name.trim(),
          category: form.category.trim() || null,
          unit: form.unit.trim() || "قطعة",
          description: form.description.trim() || null,
          reference_price: form.reference_price ? Number(form.reference_price) : 0,
          default_cost: form.default_cost ? Number(form.default_cost) : 0,
          typical_delivery_days: form.typical_delivery_days
            ? Number(form.typical_delivery_days)
            : 7,
          is_active: true,
        })
        .select("id, name")
        .single();
      if (error) throw error;
      await logActivity({
        entityType: "product",
        entityId: data.id,
        action: "created",
        description: `إضافة صنف جديد: ${data.name}`,
      });
    },
    onSuccess: () => {
      toast.success("تمت إضافة الصنف");
      setForm(emptyForm);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("products_services")
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog"] }),
    onError: (e: Error) => toast.error("تعذّر التحديث", { description: e.message }),
  });

  const rows = (data ?? []).filter(
    (p) =>
      !q ||
      p.name.includes(q) ||
      (p.category ?? "").includes(q) ||
      (p.description ?? "").includes(q),
  );

  return (
    <>
      <PageHeader
        title="المنتجات والخدمات"
        subtitle="الكتالوج المستخدم في طلبات البيع والتسعير"
        actions={
          isManager ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="size-4" />
                  صنف جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة منتج أو خدمة</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label>الاسم</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label>التصنيف</Label>
                      <Input
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>الوحدة</Label>
                      <Select
                        value={form.unit}
                        onValueChange={(v) => setForm({ ...form, unit: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["قطعة", "متر", "متر مربع", "كيلو", "طن", "ساعة", "خدمة"].map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="grid gap-1.5">
                      <Label>السعر الاسترشادي (ج.م)</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={form.reference_price}
                        onChange={(e) => setForm({ ...form, reference_price: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>التكلفة التقديرية (ج.م)</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={form.default_cost}
                        onChange={(e) => setForm({ ...form, default_cost: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>مدة التنفيذ (يوم)</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={form.typical_delivery_days}
                        onChange={(e) =>
                          setForm({ ...form, typical_delivery_days: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>الوصف</Label>
                    <Textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => create.mutate()} disabled={create.isPending}>
                    حفظ
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <SectionCard>
        <Input
          placeholder="بحث في الكتالوج…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-3 max-w-sm"
        />

        {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
        {isLoading ? <LoadingState /> : null}
        {data && rows.length === 0 ? <EmptyState title="لا توجد أصناف" /> : null}

        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="p-2 text-start">الاسم</th>
                  <th className="p-2 text-start">التصنيف</th>
                  <th className="p-2 text-start">الوحدة</th>
                  <th className="p-2 text-start">السعر الاسترشادي</th>
                  {canSeeCosts ? <th className="p-2 text-start">التكلفة التقديرية</th> : null}
                  <th className="p-2 text-start">مدة التنفيذ</th>
                  <th className="p-2 text-start">الحالة</th>
                  {isManager ? <th className="p-2" /> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-border/60">
                    <td className="p-2 font-medium">{p.name}</td>
                    <td className="p-2 text-muted-foreground">{p.category ?? "—"}</td>
                    <td className="p-2 text-muted-foreground">{p.unit}</td>
                    <td className="num p-2">{egp(Number(p.reference_price ?? 0))}</td>
                    {canSeeCosts ? (
                      <td className="num p-2">{egp(Number(p.default_cost ?? 0))}</td>
                    ) : null}
                    <td className="num p-2 text-muted-foreground">
                      {p.typical_delivery_days} يوم
                    </td>
                    <td className="p-2">
                      <StatusPill
                        label={p.is_active ? "مفعّل" : "موقوف"}
                        tone={p.is_active ? "success" : "neutral"}
                      />
                    </td>
                    {isManager ? (
                      <td className="p-2 text-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggle.mutate({ id: p.id, active: !p.is_active })}
                        >
                          {p.is_active ? "إيقاف" : "تفعيل"}
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </SectionCard>
    </>
  );
}
