import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/actions";
import { PAYMENT_INTENT_STATUS, PAYMENT_METHODS } from "@/lib/constants";
import { egp, formatDateTime } from "@/lib/format";
import { EmptyState, InlineLoading, SectionCard, StatusPill } from "@/components/ui-kit";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OnlinePaymentsPanel({
  orderId,
  orderCode,
  customerId,
  remaining,
  canEdit,
}: {
  orderId: string;
  orderCode?: string;
  customerId: string;
  remaining: number;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    gateway_key: "",
    amount: "",
    reference: "",
    payer_name: "",
    note: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["intents", orderId],
    queryFn: async () => {
      const [intents, gateways] = await Promise.all([
        supabase
          .from("payment_intents")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at", { ascending: false }),
        supabase.from("payment_gateways").select("*").eq("is_active", true).order("sort_order"),
      ]);
      if (intents.error) throw intents.error;
      return { intents: intents.data ?? [], gateways: gateways.data ?? [] };
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["intents", orderId] });
    queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    queryClient.invalidateQueries({ queryKey: ["payments"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const gw = data?.gateways.find((g) => g.key === form.gateway_key);
      if (!gw) throw new Error("اختر طريقة الدفع");
      const amount = Number(form.amount);
      if (!amount || amount <= 0) throw new Error("أدخل مبلغًا صحيحًا");
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("payment_intents").insert({
        order_id: orderId,
        customer_id: customerId,
        gateway_key: gw.key,
        method: gw.method,
        amount,
        reference: form.reference || null,
        payer_name: form.payer_name || null,
        note: form.note || null,
        status: "submitted",
        source: "staff",
        created_by: auth.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تسجيل عملية الدفع");
      setOpen(false);
      setForm({ gateway_key: "", amount: "", reference: "", payer_name: "", note: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  const review = useMutation({
    mutationFn: async (input: { id: string; approve: boolean }) => {
      const intent = data?.intents.find((i) => i.id === input.id);
      if (!intent) throw new Error("العملية غير موجودة");
      const { data: auth } = await supabase.auth.getUser();

      if (!input.approve) {
        const { error } = await supabase
          .from("payment_intents")
          .update({
            status: "rejected",
            reviewed_by: auth.user?.id ?? null,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", input.id);
        if (error) throw error;
        return;
      }

      const { data: payment, error: payErr } = await supabase
        .from("payments")
        .insert({
          order_id: orderId,
          customer_id: customerId,
          amount: intent.amount,
          method: intent.method,
          payment_date: new Date().toISOString().slice(0, 10),
          reference: intent.reference,
          notes: `عبر بوابة الدفع (${intent.code})`,
          received_by: auth.user?.id ?? null,
        })
        .select("id, code")
        .single();
      if (payErr) throw payErr;

      const { error } = await supabase
        .from("payment_intents")
        .update({
          status: "confirmed",
          payment_id: payment.id,
          reviewed_by: auth.user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", input.id);
      if (error) throw error;

      const newRemaining = remaining - Number(intent.amount);
      if (newRemaining <= 0) {
        await supabase
          .from("orders")
          .update({ status: "confirmed" })
          .eq("id", orderId)
          .eq("status", "new");
      }
      await logActivity({
        entityType: "payment",
        entityId: orderId,
        entityCode: payment.code,
        action: "payment_confirmed",
        description: `تم اعتماد دفعة إلكترونية ${egp(Number(intent.amount))} (${intent.code})`,
      });
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة العملية");
      invalidate();
    },
    onError: (e: Error) => toast.error("تعذّر التحديث", { description: e.message }),
  });

  if (isLoading) return <InlineLoading />;

  const intents = data?.intents ?? [];
  const gateways = data?.gateways ?? [];
  const selected = gateways.find((g) => g.key === form.gateway_key);

  return (
    <SectionCard
      title="الدفع الإلكتروني"
      actions={
        canEdit ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            <CreditCard className="size-4" />
            تسجيل عملية دفع
          </Button>
        ) : null
      }
    >
      {intents.length === 0 ? (
        <EmptyState
          title="لا توجد عمليات دفع إلكتروني"
          description="عمليات الدفع من بوابة العميل أو من الفريق تظهر هنا للمراجعة والاعتماد."
        />
      ) : (
        <ul className="divide-y divide-border">
          {intents.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="num text-sm font-semibold">{egp(Number(i.amount))}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="num">{i.code}</span> · {PAYMENT_METHODS[i.method] ?? i.method}
                  {i.reference ? ` · مرجع ${i.reference}` : ""} · {formatDateTime(i.created_at)}
                </p>
                {i.note ? <p className="text-xs text-muted-foreground">{i.note}</p> : null}
              </div>
              <StatusPill
                label={PAYMENT_INTENT_STATUS[i.status]?.label ?? i.status}
                tone={PAYMENT_INTENT_STATUS[i.status]?.tone}
              />
              {canEdit && ["submitted", "under_review", "pending"].includes(i.status) ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={review.isPending}
                    onClick={() => review.mutate({ id: i.id, approve: true })}
                  >
                    اعتماد
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={review.isPending}
                    onClick={() => review.mutate({ id: i.id, approve: false })}
                  >
                    رفض
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل عملية دفع إلكتروني</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select
                value={form.gateway_key}
                onValueChange={(v) => setForm({ ...form, gateway_key: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر" />
                </SelectTrigger>
                <SelectContent>
                  {gateways.map((g) => (
                    <SelectItem key={g.key} value={g.key}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selected?.instructions ? (
                <p className="text-xs text-muted-foreground">{selected.instructions}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>المبلغ (ج.م)</Label>
              <Input
                type="number"
                dir="ltr"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder={String(remaining)}
              />
            </div>
            <div className="space-y-2">
              <Label>رقم العملية / المرجع</Label>
              <Input
                dir="ltr"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>اسم الدافع</Label>
              <Input
                value={form.payer_name}
                onChange={(e) => setForm({ ...form, payer_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                rows={2}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
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
    </SectionCard>
  );
}
