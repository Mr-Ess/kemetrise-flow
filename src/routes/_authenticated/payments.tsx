import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban, Plus, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { PAYMENT_METHODS } from "@/lib/constants";
import { egp, formatDate } from "@/lib/format";
import {
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  PageHeader,
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
import type { Database } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "المدفوعات | KemetRise" },
      { name: "description", content: "تحصيلات العملاء وطرق الدفع والمبالغ المتبقية." },
      { property: "og:title", content: "المدفوعات | KemetRise" },
      { property: "og:description", content: "تسجيل ومتابعة تحصيلات KemetRise." },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const queryClient = useQueryClient();
  const { isManager } = useAuth();
  const [term, setTerm] = useState("");
  const [method, setMethod] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    order_id: "",
    amount: "",
    method: "cash" as PaymentMethod,
    payment_date: new Date().toISOString().slice(0, 10),
    reference: "",
    notes: "",
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const [payments, orders, financials] = await Promise.all([
        supabase
          .from("payments")
          .select("*, customers(full_name), orders(code, title)")
          .order("payment_date", { ascending: false }),
        supabase
          .from("orders")
          .select("id, code, title, total_price, customer_id, customers(full_name)")
          .not("status", "in", "(cancelled)")
          .order("created_at", { ascending: false }),
        supabase.from("order_financials").select("*"),
      ]);
      if (payments.error) throw payments.error;
      return {
        payments: payments.data ?? [],
        orders: orders.data ?? [],
        financials: financials.data ?? [],
      };
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const amount = Number(form.amount);
      if (!form.order_id) throw new Error("اختر أمر التنفيذ");
      if (!amount || amount <= 0) throw new Error("أدخل مبلغًا صحيحًا");
      const order = data?.orders.find((o) => o.id === form.order_id);
      if (!order) throw new Error("أمر التنفيذ غير موجود");
      const { data: auth } = await supabase.auth.getUser();
      const { data: created, error } = await supabase
        .from("payments")
        .insert({
          order_id: form.order_id,
          customer_id: order.customer_id,
          amount,
          method: form.method,
          payment_date: form.payment_date,
          reference: form.reference || null,
          notes: form.notes || null,
          received_by: auth.user?.id ?? null,
        })
        .select("code")
        .single();
      if (error) throw error;
      await logActivity({
        entityType: "payment",
        entityId: form.order_id,
        entityCode: created.code,
        action: "payment_received",
        description: `تم تسجيل دفعة ${egp(amount)} على الأمر ${order.code}`,
      });
    },
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة");
      setOpen(false);
      setForm({ ...form, amount: "", reference: "", notes: "" });
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error("تعذّر التسجيل", { description: e.message }),
  });

  const voidPayment = useMutation({
    mutationFn: async (p: { id: string; code: string }) => {
      const { error } = await supabase.from("payments").update({ is_void: true }).eq("id", p.id);
      if (error) throw error;
      await logActivity({
        entityType: "payment",
        entityId: p.id,
        entityCode: p.code,
        action: "voided",
        description: `تم إلغاء الدفعة ${p.code}`,
      });
    },
    onSuccess: () => {
      toast.success("تم إلغاء الدفعة");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error("تعذّر الإلغاء", { description: e.message }),
  });

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (data?.payments ?? []).filter((p) => {
      if (method !== "all" && p.method !== method) return false;
      if (!t) return true;
      const cust = (p.customers as { full_name: string } | null)?.full_name ?? "";
      const ord = (p.orders as { code: string } | null)?.code ?? "";
      return [p.code, cust, ord, p.reference].some((v) =>
        String(v ?? "").toLowerCase().includes(t),
      );
    });
  }, [data, term, method]);

  const collected = (data?.payments ?? [])
    .filter((p) => !p.is_void)
    .reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = (data?.financials ?? []).reduce(
    (s, f) => s + Number(f.remaining_amount ?? 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="المدفوعات"
        subtitle="تحصيلات العملاء على أوامر التنفيذ"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" />
                تسجيل دفعة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>أمر التنفيذ</Label>
                  <Select
                    value={form.order_id}
                    onValueChange={(v) => setForm({ ...form, order_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الأمر" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {(data?.orders ?? []).map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.code} — {(o.customers as { full_name: string } | null)?.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المبلغ (ج.م)</Label>
                  <Input
                    type="number"
                    dir="ltr"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>طريقة الدفع</Label>
                    <Select
                      value={form.method}
                      onValueChange={(v) => setForm({ ...form, method: v as PaymentMethod })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>التاريخ</Label>
                    <Input
                      type="date"
                      dir="ltr"
                      value={form.payment_date}
                      onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>رقم المرجع</Label>
                  <Input
                    dir="ltr"
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => add.mutate()} disabled={add.isPending}>
                  حفظ
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard label="إجمالي المحصّل" value={egp(collected)} tone="success" />
        <KpiCard label="المتبقي على الأوامر" value={egp(outstanding)} tone="danger" />
        <KpiCard label="عدد الدفعات" value={String(rows.length)} tone="info" />
      </div>

      <div className="panel mb-4 grid gap-3 p-4 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pr-9"
            placeholder="ابحث بكود الدفعة أو العميل أو الأمر"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger>
            <SelectValue placeholder="طريقة الدفع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الطرق</SelectItem>
            {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {isLoading ? <LoadingState /> : null}
      {data && rows.length === 0 ? <EmptyState title="لا توجد دفعات مطابقة" /> : null}

      {rows.length > 0 ? (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-right text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">الكود</th>
                <th className="px-4 py-3 font-medium">العميل</th>
                <th className="px-4 py-3 font-medium">الأمر</th>
                <th className="px-4 py-3 font-medium">المبلغ</th>
                <th className="px-4 py-3 font-medium">الطريقة</th>
                <th className="px-4 py-3 font-medium">التاريخ</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => (
                <tr key={p.id} className={p.is_void ? "opacity-50" : "hover:bg-muted/40"}>
                  <td className="num px-4 py-3 text-xs text-muted-foreground">{p.code}</td>
                  <td className="px-4 py-3">
                    {(p.customers as { full_name: string } | null)?.full_name ?? "—"}
                  </td>
                  <td className="num px-4 py-3 text-xs">
                    {(p.orders as { code: string } | null)?.code ?? "—"}
                  </td>
                  <td className="num px-4 py-3 font-semibold">{egp(Number(p.amount))}</td>
                  <td className="px-4 py-3">{PAYMENT_METHODS[p.method] ?? p.method}</td>
                  <td className="px-4 py-3 text-xs">{formatDate(p.payment_date)}</td>
                  <td className="px-4 py-3">
                    {p.is_void ? (
                      <StatusPill label="ملغاة" tone="danger" />
                    ) : isManager ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => voidPayment.mutate({ id: p.id, code: p.code })}
                      >
                        <Ban className="size-4" />
                        إلغاء
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-muted-foreground">
        لعرض تفاصيل أمر بعينه افتحه من{" "}
        <Link to="/orders" className="text-primary hover:underline">
          صفحة الأوامر
        </Link>
        .
      </p>
    </>
  );
}
