import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { logActivity, notify } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { DOCUMENT_STATUS, ORDER_STATUS, PAYMENT_METHODS } from "@/lib/constants";
import { egp, formatDate, num } from "@/lib/format";
import {
  EmptyState,
  ErrorState,
  Field,
  KpiCard,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/ui-kit";
import { CommentsPanel } from "@/components/CommentsPanel";
import { ActivityFeed } from "@/components/ActivityFeed";
import { OrderExecutionPanel } from "@/components/OrderExecutionPanel";
import { OnlinePaymentsPanel } from "@/components/OnlinePaymentsPanel";
import { PortalLinkButton } from "@/components/PortalLinkButton";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];

const FLOW: OrderStatus[] = [
  "new",
  "confirmed",
  "in_progress",
  "waiting_customer",
  "waiting_documents",
  "ready",
  "delivered",
  "completed",
];

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل أمر التنفيذ | KemetRise" },
      { name: "description", content: "متابعة تنفيذ الأمر والمدفوعات والمستندات حتى الإغلاق." },
      { property: "og:title", content: "تفاصيل أمر التنفيذ | KemetRise" },
      { property: "og:description", content: "إدارة أمر التنفيذ خطوة بخطوة في KemetRise." },
    ],
  }),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canEdit = hasRole("admin", "management", "sales", "staff");

  const [payOpen, setPayOpen] = useState(false);
  const [pay, setPay] = useState({
    amount: "",
    method: "cash" as PaymentMethod,
    payment_date: new Date().toISOString().slice(0, 10),
    reference: "",
    notes: "",
  });
  const [docOpen, setDocOpen] = useState(false);
  const [doc, setDoc] = useState({ name: "", doc_type: "", notes: "" });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const [order, payments, documents] = await Promise.all([
        supabase
          .from("orders")
          .select("*, customers(id, full_name, phone), quotations(code, total, payment_terms), sales_requests(id, code)")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("payments")
          .select("*")
          .eq("order_id", id)
          .eq("is_void", false)
          .order("payment_date", { ascending: false }),
        supabase.from("documents").select("*").eq("order_id", id).order("created_at"),
      ]);
      if (order.error) throw order.error;
      return {
        order: order.data,
        payments: payments.data ?? [],
        documents: documents.data ?? [],
      };
    },
  });

  const o = data?.order;

  const setStatus = useMutation({
    mutationFn: async (next: OrderStatus) => {
      const extra: Record<string, unknown> = {};
      if (next === "delivered") extra.actual_delivery = new Date().toISOString().slice(0, 10);
      const { error } = await supabase.from("orders").update({ status: next, ...extra }).eq("id", id);
      if (error) throw error;
      await logActivity({
        entityType: "order",
        entityId: id,
        entityCode: o?.code,
        action: next,
        description: `تم تحديث حالة الأمر إلى: ${ORDER_STATUS[next]?.label ?? next}`,
      });
      if (next === "completed") {
        await notify({
          title: "اكتمل أمر تنفيذ",
          body: `${o?.code} — ${o?.title}`,
          link: `/orders/${id}`,
          targetRole: "management",
        });
      }
    },
    onSuccess: () => {
      toast.success("تم تحديث الحالة");
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error("تعذّر التحديث", { description: e.message }),
  });

  const addPayment = useMutation({
    mutationFn: async () => {
      const amount = Number(pay.amount);
      if (!amount || amount <= 0) throw new Error("أدخل مبلغًا صحيحًا");
      if (!o) throw new Error("الأمر غير موجود");
      const { data: auth } = await supabase.auth.getUser();
      const { data: created, error } = await supabase
        .from("payments")
        .insert({
          order_id: id,
          customer_id: o.customer_id,
          amount,
          method: pay.method,
          payment_date: pay.payment_date,
          reference: pay.reference || null,
          notes: pay.notes || null,
          received_by: auth.user?.id ?? null,
        })
        .select("code")
        .single();
      if (error) throw error;
      await logActivity({
        entityType: "payment",
        entityId: id,
        entityCode: created.code,
        action: "payment_received",
        description: `تم تسجيل دفعة ${egp(amount)} (${PAYMENT_METHODS[pay.method]})`,
      });
    },
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة");
      setPayOpen(false);
      setPay({ ...pay, amount: "", reference: "", notes: "" });
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error("تعذّر التسجيل", { description: e.message }),
  });

  const addDoc = useMutation({
    mutationFn: async () => {
      if (!doc.name.trim()) throw new Error("أدخل اسم المستند");
      if (!o) throw new Error("الأمر غير موجود");
      const { error } = await supabase.from("documents").insert({
        order_id: id,
        customer_id: o.customer_id,
        name: doc.name.trim(),
        doc_type: doc.doc_type || null,
        notes: doc.notes || null,
        status: "required",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تمت إضافة المستند المطلوب");
      setDocOpen(false);
      setDoc({ name: "", doc_type: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (e: Error) => toast.error("تعذّر الحفظ", { description: e.message }),
  });

  const setDocStatus = useMutation({
    mutationFn: async (input: { docId: string; status: Database["public"]["Enums"]["document_status"] }) => {
      const { error } = await supabase
        .from("documents")
        .update({ status: input.status })
        .eq("id", input.docId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order", id] }),
    onError: (e: Error) => toast.error("تعذّر التحديث", { description: e.message }),
  });

  if (isLoading) return <LoadingState rows={6} />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!o) return <EmptyState title="أمر التنفيذ غير موجود" />;

  const cust = o.customers as { id: string; full_name: string; phone: string } | null;
  const paid = data!.payments.reduce((s, p) => s + Number(p.amount), 0);
  const remaining = Number(o.total_price) - paid;
  const pendingDocs = data!.documents.filter((d) => !["verified", "received"].includes(d.status));

  return (
    <>
      <PageHeader
        title={o.title}
        subtitle={`${o.code} · ${cust?.full_name ?? ""}`}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link to="/orders">
                <ArrowRight className="size-4" />
                كل الأوامر
              </Link>
            </Button>
            {(o.sales_requests as { id: string; code: string } | null) ? (
              <Button asChild size="sm" variant="outline">
                <Link
                  to="/requests/$id"
                  params={{ id: (o.sales_requests as { id: string }).id }}
                >
                  الطلب الأصلي
                </Link>
              </Button>
            ) : null}
            <Button size="sm" onClick={() => setPayOpen(true)}>
              <Plus className="size-4" />
              تسجيل دفعة
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="قيمة الأمر" value={egp(Number(o.total_price))} tone="info" />
        <KpiCard label="المحصّل" value={egp(paid)} tone="success" />
        <KpiCard label="المتبقي" value={egp(remaining)} tone={remaining > 0 ? "danger" : "success"} />
        <KpiCard label="مستندات ناقصة" value={num(pendingDocs.length)} tone="warning" />
      </div>

      <div className="panel my-4 flex flex-wrap items-center gap-2 p-4">
        <StatusPill
          label={ORDER_STATUS[o.status]?.label ?? o.status}
          tone={ORDER_STATUS[o.status]?.tone}
        />
        <span className="text-xs text-muted-foreground">
          تسليم متوقع {formatDate(o.expected_delivery)}
          {o.actual_delivery ? ` · تم التسليم ${formatDate(o.actual_delivery)}` : ""}
        </span>
        {canEdit ? (
          <div className="ms-auto flex flex-wrap gap-2">
            {FLOW.filter((s) => s !== o.status).map((s) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                disabled={setStatus.isPending || (s === "completed" && remaining > 0)}
                onClick={() => setStatus.mutate(s)}
              >
                {ORDER_STATUS[s].label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="destructive"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate("cancelled")}
            >
              إلغاء الأمر
            </Button>
          </div>
        ) : null}
      </div>

      {remaining > 0 ? (
        <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          لا يمكن إغلاق الأمر كمكتمل قبل تحصيل كامل القيمة (المتبقي {egp(remaining)}).
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="بيانات الأمر" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field
              label="العميل"
              value={
                cust ? (
                  <Link to="/customers/$id" params={{ id: cust.id }} className="hover:text-primary">
                    {cust.full_name}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            <Field label="الهاتف" value={<span className="num">{cust?.phone ?? "—"}</span>} />
            <Field label="الكمية" value={<span className="num">{num(o.quantity)}</span>} />
            <Field
              label="عرض السعر"
              value={
                <span className="num">
                  {(o.quotations as { code: string } | null)?.code ?? "—"}
                </span>
              }
            />
            <Field
              label="شروط الدفع"
              value={(o.quotations as { payment_terms: string | null } | null)?.payment_terms ?? "—"}
            />
            <Field label="القسم المسؤول" value={o.department || "—"} />
            <Field label="تاريخ الإنشاء" value={formatDate(o.created_at)} />
            <Field label="تسليم فعلي" value={formatDate(o.actual_delivery)} />
            <div className="col-span-2 sm:col-span-4">
              <Field label="الوصف" value={o.description || "—"} />
            </div>
            <div className="col-span-2 sm:col-span-4">
              <Field label="ملاحظات" value={o.notes || "—"} />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="المستندات"
          actions={
            <Button size="sm" variant="outline" onClick={() => setDocOpen(true)}>
              <Plus className="size-4" />
              مستند مطلوب
            </Button>
          }
        >
          {data!.documents.length === 0 ? (
            <EmptyState title="لا توجد مستندات" description="أضف المستندات المطلوبة من العميل." />
          ) : (
            <ul className="divide-y divide-border">
              {data!.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{d.name}</p>
                    <p className="num text-xs text-muted-foreground">{d.code}</p>
                  </div>
                  <Select
                    value={d.status}
                    onValueChange={(v) =>
                      setDocStatus.mutate({
                        docId: d.id,
                        status: v as Database["public"]["Enums"]["document_status"],
                      })
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOCUMENT_STATUS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="mt-4">
        <Tabs defaultValue="payments">
          <TabsList className="flex-wrap">
            <TabsTrigger value="payments">المدفوعات</TabsTrigger>
            <TabsTrigger value="comments">التعليقات</TabsTrigger>
            <TabsTrigger value="activity">سجل النشاط</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-4">
            <SectionCard title="سجل المدفوعات">
              {data!.payments.length === 0 ? (
                <EmptyState title="لا توجد دفعات مسجلة" />
              ) : (
                <ul className="divide-y divide-border">
                  {data!.payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="num text-sm font-semibold">{egp(Number(p.amount))}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="num">{p.code}</span> ·{" "}
                          {PAYMENT_METHODS[p.method] ?? p.method}
                          {p.reference ? ` · مرجع ${p.reference}` : ""}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(p.payment_date)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <CommentsPanel entityType="order" entityId={id} />
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ActivityFeed entityId={id} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>المبلغ (ج.م)</Label>
              <Input
                type="number"
                dir="ltr"
                value={pay.amount}
                onChange={(e) => setPay({ ...pay, amount: e.target.value })}
                placeholder={String(remaining)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select
                  value={pay.method}
                  onValueChange={(v) => setPay({ ...pay, method: v as PaymentMethod })}
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
                <Label>تاريخ الدفع</Label>
                <Input
                  type="date"
                  dir="ltr"
                  value={pay.payment_date}
                  onChange={(e) => setPay({ ...pay, payment_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>رقم المرجع</Label>
              <Input
                dir="ltr"
                value={pay.reference}
                onChange={(e) => setPay({ ...pay, reference: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                rows={2}
                value={pay.notes}
                onChange={(e) => setPay({ ...pay, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => addPayment.mutate()} disabled={addPayment.isPending}>
              حفظ الدفعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة مستند مطلوب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المستند</Label>
              <Input value={doc.name} onChange={(e) => setDoc({ ...doc, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>النوع</Label>
              <Input
                value={doc.doc_type}
                onChange={(e) => setDoc({ ...doc, doc_type: e.target.value })}
                placeholder="مثال: بطاقة رقم قومي / سجل تجاري"
              />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                rows={2}
                value={doc.notes}
                onChange={(e) => setDoc({ ...doc, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => addDoc.mutate()} disabled={addDoc.isPending}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
