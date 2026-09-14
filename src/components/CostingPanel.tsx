import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { logActivity, notify } from "@/lib/actions";
import { COST_CATEGORIES } from "@/lib/constants";
import { egp, marginFromPrice, num, pct, priceFromMargin } from "@/lib/format";
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
import { Field, InlineLoading, SectionCard, StatusPill } from "@/components/ui-kit";
import type { Database } from "@/integrations/supabase/types";

type CostCategory = Database["public"]["Enums"]["cost_category"];
type Item = {
  id?: string;
  category: CostCategory;
  description: string;
  quantity: number;
  unit_cost: number;
};

export function CostingPanel({
  requestId,
  requestCode,
  canEdit,
}: {
  requestId: string;
  requestCode: string;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const key = ["costing", requestId];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data: costing, error } = await supabase
        .from("costings")
        .select("*")
        .eq("request_id", requestId)
        .maybeSingle();
      if (error) throw error;
      const items = costing
        ? (
            await supabase
              .from("costing_items")
              .select("*")
              .eq("costing_id", costing.id)
              .order("created_at")
          ).data ?? []
        : [];
      const rules = (
        await supabase.from("pricing_rules").select("*").eq("is_active", true).maybeSingle()
      ).data;
      return { costing, items, rules };
    },
  });

  const [items, setItems] = useState<Item[]>([]);
  const [additional, setAdditional] = useState("0");
  const [margin, setMargin] = useState("30");
  const [days, setDays] = useState("");
  const [notes, setNotes] = useState("");
  const [manualPrice, setManualPrice] = useState("");

  useEffect(() => {
    if (!data) return;
    setItems(
      data.items.map((i) => ({
        id: i.id,
        category: i.category,
        description: i.description,
        quantity: Number(i.quantity),
        unit_cost: Number(i.unit_cost),
      })),
    );
    setAdditional(String(data.costing?.additional_costs ?? 0));
    setMargin(String(data.costing?.target_margin ?? data.rules?.standard_margin ?? 30));
    setDays(data.costing?.delivery_days ? String(data.costing.delivery_days) : "");
    setNotes(data.costing?.notes ?? "");
    setManualPrice(data.costing?.suggested_price ? String(data.costing.suggested_price) : "");
  }, [data]);

  const directCost = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);
  const totalCost = directCost + (Number(additional) || 0);
  const autoPrice = priceFromMargin(totalCost, Number(margin) || 0);
  const price = Number(manualPrice) || autoPrice;
  const realMargin = marginFromPrice(totalCost, price);
  const rules = data?.rules;
  const needsApproval =
    !!rules &&
    (price >= Number(rules.approval_threshold) || realMargin < Number(rules.min_margin));

  const save = useMutation({
    mutationFn: async (submitForApproval: boolean) => {
      const { data: auth } = await supabase.auth.getUser();
      let costingId = data?.costing?.id;

      const payload = {
        request_id: requestId,
        direct_cost: directCost,
        additional_costs: Number(additional) || 0,
        total_cost: totalCost,
        target_margin: Number(margin) || 0,
        suggested_price: price,
        delivery_days: days ? Number(days) : null,
        notes: notes.trim() || null,
        costed_by: auth.user?.id ?? null,
        requires_approval: needsApproval,
        is_submitted: submitForApproval || (data?.costing?.is_submitted ?? false),
        submitted_at: submitForApproval ? new Date().toISOString() : data?.costing?.submitted_at ?? null,
      };

      if (costingId) {
        const { error } = await supabase.from("costings").update(payload).eq("id", costingId);
        if (error) throw error;
      } else {
        const { data: created, error } = await supabase
          .from("costings")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        costingId = created.id;
      }

      await supabase.from("costing_items").delete().eq("costing_id", costingId!);
      if (items.length > 0) {
        const { error } = await supabase.from("costing_items").insert(
          items.map((i) => ({
            costing_id: costingId!,
            category: i.category,
            description: i.description,
            quantity: i.quantity,
            unit_cost: i.unit_cost,
          })),
        );
        if (error) throw error;
      }

      const nextStatus = submitForApproval
        ? needsApproval
          ? "pending_approval"
          : "costing_completed"
        : "costing_in_progress";

      await supabase
        .from("sales_requests")
        .update({ status: nextStatus, status_changed_at: new Date().toISOString() })
        .eq("id", requestId);

      await logActivity({
        entityType: "sales_request",
        entityId: requestId,
        entityCode: requestCode,
        action: submitForApproval ? "costing_submitted" : "costing_saved",
        description: submitForApproval
          ? needsApproval
            ? `تم إرسال التسعير للاعتماد بسعر ${egp(price)}`
            : `اكتمل التسعير بسعر ${egp(price)}`
          : "تم حفظ مسودة التسعير",
      });

      if (submitForApproval && needsApproval) {
        await notify({
          title: "تسعير بانتظار الاعتماد",
          body: `${requestCode} — ${egp(price)} بهامش ${pct(realMargin)}`,
          link: `/requests/${requestId}`,
          targetRole: "management",
        });
      }
    },
    onSuccess: () => {
      toast.success("تم حفظ التسعير");
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ["request", requestId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  if (isLoading) return <InlineLoading />;

  return (
    <SectionCard
      title="التسعير الداخلي"
      actions={
        data?.costing?.approved_at ? (
          <StatusPill label="معتمد" tone="success" />
        ) : data?.costing?.is_submitted ? (
          <StatusPill label="بانتظار الاعتماد" tone="warning" />
        ) : (
          <StatusPill label="مسودة" tone="neutral" />
        )
      }
    >
      <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
        بيانات التكلفة والهامش داخلية بالكامل ولا تظهر في أي مستند يُرسل للعميل.
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <Label className="text-xs">البند</Label>
              <Select
                value={item.category}
                onValueChange={(v) => {
                  const next = [...items];
                  next[idx] = { ...item, category: v as CostCategory };
                  setItems(next);
                }}
                disabled={!canEdit}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COST_CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-4">
              <Label className="text-xs">الوصف</Label>
              <Input
                className="mt-1"
                value={item.description}
                disabled={!canEdit}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...item, description: e.target.value };
                  setItems(next);
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">الكمية</Label>
              <Input
                className="mt-1"
                type="number"
                dir="ltr"
                value={item.quantity}
                disabled={!canEdit}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...item, quantity: Number(e.target.value) || 0 };
                  setItems(next);
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">تكلفة الوحدة</Label>
              <Input
                className="mt-1"
                type="number"
                dir="ltr"
                value={item.unit_cost}
                disabled={!canEdit}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...item, unit_cost: Number(e.target.value) || 0 };
                  setItems(next);
                }}
              />
            </div>
            <div className="flex items-end sm:col-span-1">
              <Button
                size="icon"
                variant="ghost"
                disabled={!canEdit}
                onClick={() => setItems(items.filter((_, i) => i !== idx))}
                aria-label="حذف البند"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}

        {canEdit ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setItems([
                ...items,
                { category: "raw_materials", description: "", quantity: 1, unit_cost: 0 },
              ])
            }
          >
            <Plus className="size-4" />
            إضافة بند تكلفة
          </Button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label>تكاليف إضافية</Label>
          <Input
            type="number"
            dir="ltr"
            value={additional}
            disabled={!canEdit}
            onChange={(e) => setAdditional(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>هامش الربح المستهدف %</Label>
          <Input
            type="number"
            dir="ltr"
            value={margin}
            disabled={!canEdit}
            onChange={(e) => {
              setMargin(e.target.value);
              setManualPrice("");
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>سعر البيع المقترح</Label>
          <Input
            type="number"
            dir="ltr"
            value={manualPrice || String(autoPrice)}
            disabled={!canEdit}
            onChange={(e) => setManualPrice(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>مدة التنفيذ (يوم)</Label>
          <Input
            type="number"
            dir="ltr"
            value={days}
            disabled={!canEdit}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-5">
        <Field label="تكلفة مباشرة" value={<span className="num">{egp(directCost)}</span>} />
        <Field label="إجمالي التكلفة" value={<span className="num">{egp(totalCost)}</span>} />
        <Field label="سعر البيع" value={<span className="num">{egp(price)}</span>} />
        <Field label="الربح" value={<span className="num">{egp(price - totalCost)}</span>} />
        <Field
          label="هامش الربح الفعلي"
          value={
            <span className={realMargin < Number(rules?.min_margin ?? 0) ? "num text-destructive" : "num text-success"}>
              {pct(realMargin)}
            </span>
          }
        />
      </div>

      {rules ? (
        <p className="mt-3 text-xs text-muted-foreground">
          الحد الأدنى للهامش <span className="num">{num(Number(rules.min_margin), 1)}%</span> · حد
          الاعتماد الإداري <span className="num">{egp(Number(rules.approval_threshold))}</span>
          {needsApproval ? " · هذا التسعير يتطلب اعتماد الإدارة" : " · لا يتطلب اعتمادًا إداريًا"}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        <Label>ملاحظات التسعير</Label>
        <Textarea
          rows={2}
          value={notes}
          disabled={!canEdit}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {canEdit ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => save.mutate(false)} disabled={save.isPending}>
            حفظ كمسودة
          </Button>
          <Button onClick={() => save.mutate(true)} disabled={save.isPending || items.length === 0}>
            {needsApproval ? "إرسال للاعتماد" : "إنهاء التسعير"}
          </Button>
        </div>
      ) : null}
    </SectionCard>
  );
}
